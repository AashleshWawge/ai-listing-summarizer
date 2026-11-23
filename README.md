# Real Estate Listing Summarizer

A web application that ingests unstructured, messy real estate property descriptions and parses them into standardized, structured records using Groq's LLM inference and Pydantic validation.

Includes a FastAPI backend service and a React single-page application.

---

## Features

- **LLM Extraction**: Parses price, bedroom count, location, amenities, and generates a concise summary from noisy text.
- **Data Validation**: Validates model output using Pydantic schemas with fallback error handling per listing.
- **Client-Side Export**: Export parsed data directly as JSON (`listings_summary.json`). No database required.
- **Rate Limiting**: IP-based rate limiting via SlowAPI and backend concurrency control for external API calls.
- **CSV Support**: Upload custom CSV files or test using the bundled sample dataset.

---

## Tech Stack

- **Backend**: Python 3.10+, FastAPI, Uvicorn, Groq Python SDK, Pydantic, SlowAPI
- **Frontend**: React 19, Vite, Lucide Icons
- **Deployment**: Render (Backend), Vercel (Frontend)

---

## Project Structure

```
ai-listing-summarizer/
├── backend/
│   ├── .env.example            # Environment variable template
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt        # Python dependencies
│   └── sample_listings.csv     # Sample real estate descriptions
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vercel.json             # SPA routing rewrite configuration
│   ├── vite.config.js          # Vite config & API proxy
│   └── src/
│       ├── App.jsx             # Main dashboard component
│       ├── index.css           # Global stylesheet
│       └── main.jsx            # Application entrypoint
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- A Groq API key ([Groq Console](https://console.groq.com))

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your API key:
```ini
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=qwen/qwen3.8-27b
PORT=8000
RATE_LIMIT=20/minute
CONCURRENT_REQUEST_LIMIT=4
```

Start the backend:
```bash
uvicorn main:app --reload --port 8000
```
API runs at `http://localhost:8000`. Documentation available at `http://localhost:8000/docs`.

### 2. Frontend Setup

In a separate terminal:
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Application opens at `http://localhost:5173`. In development, requests to `/api` are automatically proxied to the FastAPI server.

---

## API Endpoints

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| `GET` | `/` | Health check & service info | None |
| `GET` | `/api/sample` | Returns bundled sample property descriptions | 60/min |
| `POST` | `/api/summarize` | Processes a batch of listings into structured JSON | 15/min |
| `POST` | `/api/upload-csv` | Parses uploaded CSV into listing entries | 30/min |

### Sample Response (`POST /api/summarize`)

```json
[
  {
    "id": 1,
    "bedrooms": 3,
    "price": "₹1.45 Cr",
    "location": "Baner, Pune",
    "key_features": [
      "1650 sq ft",
      "Hill view",
      "Modular kitchen",
      "2 covered car parkings"
    ],
    "summary": "Spacious 3 BHK apartment in Baner with hill views and modular kitchen.",
    "status": "success",
    "error": null
  }
]
```

---

## Deployment

### Backend on Render

1. Create a new **Web Service** on Render and connect your repository.
2. Set the following settings:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables:
   - `GROQ_API_KEY`: `your_groq_api_key`
   - `GROQ_MODEL`: `qwen/qwen3.8-27b`

### Frontend on Vercel

1. Import repository on Vercel.
2. Configure settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add environment variable:
   - `VITE_API_URL`: `https://<your-render-backend-url>` (without trailing slash)
