# Bangla OCR Website

Bangla handwritten document to text converter built with **Flask** and **Google Gemini API**.

Live demo: add your Render URL here after deployment.

## Features

- Upload JPG/PNG images
- Extract Bangla, English, or mixed text with Gemini OCR
- Copy, download, and edit extracted text
- Responsive two-panel UI

## Tech stack

- **Backend:** Python + Flask (not Django)
- **AI:** Google Gemini (`gemini-3.6-flash`)
- **Frontend:** HTML, CSS, JavaScript
- **Deploy:** Vercel or Render

## Run locally

1. Clone the repository:

```bash
git clone https://github.com/mdalemrananas/BANGLA-OCR-WEBSITE.git
cd BANGLA-OCR-WEBSITE
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

OCR speed depends on:

- Image size (large photos take longer)
- Gemini API response time
- Free-tier rate limits

This project already optimizes uploads by:

- Compressing images in the browser before upload
- Resizing images on the server before sending to Gemini
- Using the configured Gemini Flash model

## Deploy live with GitHub + Vercel

Vercel can host the Flask API as a Python serverless function. The Gemini key must be configured in Vercel, not committed to GitHub.

1. Create a GitHub repository named `Sixfinity-OCR-Webpage` and push this project.
2. Go to [Vercel](https://vercel.com/) and import the GitHub repository.
3. In Vercel project settings, open **Environment Variables** and add:
   - Name: `GEMINI_API_KEY`
   - Value: your Gemini API key
   - Environments: Production, Preview, and Development
4. Deploy the project. Vercel will use `vercel.json` and `api/index.py` automatically.
5. Open the generated Vercel URL and upload an image.

The Vercel function has a maximum execution time and image size set by the selected Vercel plan. For larger workloads, use the Render deployment below.

## Deploy live with GitHub + Render

GitHub Pages cannot run this app because it needs a Python backend and a secret API key.

Use **Render** (free tier):

1. Push this code to GitHub.
2. Go to [Render](https://render.com/) and create a **Web Service**.
3. Connect repository: `mdalemrananas/BANGLA-OCR-WEBSITE`
4. Render will detect `render.yaml` automatically.
5. Add environment variable in Render:
   - `GEMINI_API_KEY` = your Gemini API key
6. Deploy the service.
7. Copy the Render **Deploy Hook** URL.
8. In GitHub repo go to **Settings > Secrets and variables > Actions**
9. Add secret:
   - Name: `RENDER_DEPLOY_HOOK`
   - Value: your Render deploy hook URL

After that, every push to `main` will:

- Run CI tests (`.github/workflows/ci.yml`)
- Trigger live redeploy (`.github/workflows/deploy.yml`)

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

MIT
