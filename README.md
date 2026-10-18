# Sixfinity OCR Website
![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![Deep Learning](https://img.shields.io/badge/Deep%20Learning-OCR%20%7C%20VLMs%20%7C%20LLM-orange)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![License](https://img.shields.io/badge/License-MIT-green.svg)

Sixfinity OCR is a user-friendly Bangla document digitization application designed to extract text from handwritten and printed Bangla-English documents. Users can upload document images through the interface, which processes the input using OCR and Vision-Language Model (VLM)-based techniques powered by the Gemini API to generate machine-readable text. The application provides a clear visualization of the extracted output and allows users to edit, copy, and download the digitized text. By combining OCR, AI-based recognition, and an intuitive user interface, Sixfinity OCR offers a practical, accurate, and cost-effective solution for real-world Bangla document digitization.

**Live demo:** https://sixfinity-ocr-webpage.vercel.app

## Features

- Upload JPG/PNG/JPEG images
- Extract Bangla, English, or mixed text with Sixfinity OCR
- Edit, copy, and download extracted text
- Responsive two-panel UI

## Tech stack

- **Backend:** Python + Flask (not Django)
- **API:** Google Gemini (`gemini-3.6-flash`)
- **Frontend:** HTML, CSS, JavaScript
- **Deploy:** Vercel

## Run locally

1. Clone the repository:

```bash
git clone https://github.com/MdAmmarHossain11/Sixfinity-OCR-Webpage.git
cd Sixfinity-OCR-Webpage
```

2. Create your environment file:

```bash
copy .env.example .env
```

3. Add your Gemini API key in `.env`:

```env
GEMINI_API_KEY=your_api_key_here
```

4. Install dependencies and start the server:

```bash
python -m pip install -r requirements.txt
python app.py
```

5. Open `http://127.0.0.1:5000`

On Windows you can also double-click `run.bat`.

## Why processing can feel slow

This project already optimizes uploads by:

- Compressing images in the browser before upload
- Resizing images on the server before sending to Gemini
- Using the configured Gemini Flash model

OCR speed depends on:

- Image size (large photos take longer)
- Gemini API response time
- Free-tier rate limits

## Environment variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Required. Your Gemini API key |
| `GEMINI_MODEL` | Default: `gemini-3.6-flash` |
| `MAX_IMAGE_DIMENSION` | Default: `1600` |
| `PORT` | Used in production hosting |

## Project structure

```text
app.py
requirements.txt
render.yaml
Procfile
templates/index.html
static/style.css
static/script.js
.github/workflows/ci.yml
.github/workflows/deploy.yml
```

## License

This project is licensed under the **MIT License**.

See the [`LICENSE`](LICENSE) file for more information.

## Support

If you find this project useful or interesting, consider giving the repository a ⭐ on GitHub.
