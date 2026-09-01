import io
import os
import re
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from google import genai
from google.genai import types
from PIL import Image

load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

app = Flask(__name__)

GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()
DEFAULT_MODEL = "gemini-3.6-flash"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", DEFAULT_MODEL)
FALLBACK_MODELS = [
    m.strip()
    for m in os.getenv(
        "GEMINI_FALLBACK_MODELS",
        "gemini-3.6-flash",
    ).split(",")
    if m.strip()
]
MAX_IMAGE_DIMENSION = int(os.getenv("MAX_IMAGE_DIMENSION", "1600"))
JPEG_QUALITY = int(os.getenv("JPEG_QUALITY", "85"))
ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png"}

OCR_PROMPT = (
    "Extract all visible text from this image. "
    "Text may be Bangla, English, or mixed. "
    "Keep original line breaks. Return only the extracted text."
)

_client: genai.Client | None = None


def ensure_gemini_configured():
    global _client
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "GEMINI_API_KEY is not set. Copy .env.example to .env and add your key."
        )
    if _client is None:
        _client = genai.Client(api_key=GEMINI_API_KEY)
    return _client


def model_candidates():
    ordered = [GEMINI_MODEL, *FALLBACK_MODELS]
    seen = set()
    for name in ordered:
        if name not in seen:
            seen.add(name)
            yield name


def optimize_image(image_bytes: bytes, mime_type: str) -> tuple[bytes, str]:
    image = Image.open(io.BytesIO(image_bytes))
    image = image.convert("RGB") if image.mode in (
        "RGBA", "P", "LA") else image

    width, height = image.size
    largest_side = max(width, height)
    if largest_side > MAX_IMAGE_DIMENSION:
        scale = MAX_IMAGE_DIMENSION / largest_side
        image = image.resize(
            (int(width * scale), int(height * scale)),
            Image.Resampling.LANCZOS,
        )

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
    return buffer.getvalue(), "image/jpeg"


def is_quota_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return "429" in str(exc) or "quota" in text or "resource exhausted" in text


def retry_seconds_from_error(exc: Exception) -> int | None:
    match = re.search(r"retry in (\d+(?:\.\d+)?)s", str(exc), re.IGNORECASE)
    if match:
        return max(1, int(float(match.group(1))))
    return None


def friendly_api_error(exc: Exception) -> str:
    if is_quota_error(exc):
        wait_hint = ""
        seconds = retry_seconds_from_error(exc)
        if seconds:
            wait_hint = f" Try again in about {seconds} seconds."
        return (
            "Gemini API free-tier quota is used up for this model."
            f"{wait_hint} Wait a minute, switch GEMINI_MODEL in .env "
            "(e.g. gemini-1.5-flash), or enable billing at "
            "https://aistudio.google.com/"
        )
    return f"OCR failed: {str(exc)[:300]}"


def run_ocr(image_bytes: bytes, mime_type: str) -> str:
    optimized_bytes, optimized_mime = optimize_image(image_bytes, mime_type)
    image_part = types.Part.from_bytes(
        data=optimized_bytes, mime_type=optimized_mime)
    last_error = None

    for model_name in model_candidates():
        try:
            response = ensure_gemini_configured().models.generate_content(
                model=model_name,
                contents=[OCR_PROMPT, image_part],
                config=types.GenerateContentConfig(
                    temperature=0,
                    max_output_tokens=8192,
                ),
            )
            return (response.text or "").strip()
        except Exception as exc:
            last_error = exc
            if is_quota_error(exc):
                continue
            raise

    raise last_error or RuntimeError("No Gemini model available.")


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/extract-text", methods=["POST"])
def extract_text():
    if "file" not in request.files:
        return jsonify({"error": "No image uploaded."}), 400

    uploaded = request.files["file"]
    if not uploaded or not uploaded.filename:
        return jsonify({"error": "No image uploaded."}), 400

    mime_type = uploaded.mimetype or "application/octet-stream"
    if mime_type not in ALLOWED_MIME_TYPES:
        return jsonify({"error": "Please upload a valid JPG or PNG image."}), 400

    image_bytes = uploaded.read()
    if not image_bytes:
        return jsonify({"error": "The uploaded image is empty."}), 400

    try:
        text = run_ocr(image_bytes, mime_type)
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:
        status = 429 if is_quota_error(exc) else 502
        return jsonify({"error": friendly_api_error(exc)}), status

    if not text:
        return jsonify({"error": "No text was detected in the image."}), 422

    return jsonify({"text": text})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    print(f"Starting Bangla OCR Pro at http://127.0.0.1:{port}")
    print("Keep this window open while using the site. Press Ctrl+C to stop.")
    app.run(debug=debug, host="127.0.0.1", port=port, use_reloader=False)


# for local start
# cd "D:\GOAL\Final Trimester (261)\FYDP III\Sixfinity-OCR-Webpage"
# & ".\.venv-1\Scripts\python.exe" app.py
