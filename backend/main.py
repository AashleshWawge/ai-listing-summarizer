import os
import re
import csv
import io
import json
import asyncio
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from groq import AsyncGroq
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

load_dotenv()

RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT", "20/minute")
limiter = Limiter(key_func=get_remote_address, default_limits=[RATE_LIMIT_DEFAULT])

app = FastAPI(
    title="HomeBrief API",
    version="1.0.0"
)

app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again shortly."}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL_NAME = os.getenv("GROQ_MODEL", "qwen/qwen3.8-27b")

SEMAPHORE_LIMIT = int(os.getenv("CONCURRENT_REQUEST_LIMIT", 4))
groq_semaphore = asyncio.Semaphore(SEMAPHORE_LIMIT)

def get_groq_client() -> AsyncGroq:
    key = os.getenv("GROQ_API_KEY")
    if not key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured."
        )
    return AsyncGroq(api_key=key)

class ListingInput(BaseModel):
    id: int
    description: str

class ListingSummary(BaseModel):
    id: int
    bedrooms: Optional[int] = Field(None, description="Extracted count of bedrooms.")
    price: str = Field(..., description="Extracted price string.")
    location: str = Field(..., description="Neighborhood or area name.")
    key_features: List[str] = Field(default_factory=list, description="Key features or amenities.")
    summary: str = Field(..., description="Concise listing summary.")
    raw_description: Optional[str] = None
    status: str = "success"
    error: Optional[str] = None

SYSTEM_PROMPT = """You are a real estate data parser.
Given an unstructured real estate listing, extract the following structured attributes strictly in JSON:
{
  "bedrooms": integer or null (e.g. 2 for 2BHK, 4 for 4BHK, null for studio or unspecified),
  "price": string (standardized price, e.g. "₹1.45 Cr", "₹22,000 / month", "Price on Request"),
  "location": string (area name, e.g. "Baner, Pune"),
  "key_features": array of up to 4 strings,
  "summary": string (1-2 sentences summarizing the property)
}
Return only valid JSON matching this schema."""

def extract_json(raw_text: str) -> dict:
    text = raw_text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    try:
        data = json.loads(text)
        if isinstance(data, list) and len(data) > 0:
            return data[0] if isinstance(data[0], dict) else {}
        if isinstance(data, dict):
            return data
    except Exception:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass

    return {}

async def process_single_listing(client: AsyncGroq, item: ListingInput) -> ListingSummary:
    async with groq_semaphore:
        try:
            response = await client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Listing ID {item.id}:\n{item.description}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=600
            )
            raw_content = response.choices[0].message.content or "{}"
            parsed = extract_json(raw_content)

            raw_beds = parsed.get("bedrooms")
            bedrooms = None
            if raw_beds is not None:
                try:
                    bedrooms = int(raw_beds)
                except (ValueError, TypeError):
                    bedrooms = None

            features = parsed.get("key_features") or []
            if isinstance(features, str):
                features = [f.strip() for f in features.split(",") if f.strip()]
            features = [str(f) for f in features][:4]

            return ListingSummary(
                id=item.id,
                bedrooms=bedrooms,
                price=str(parsed.get("price") or "Price on Request"),
                location=str(parsed.get("location") or "Unknown"),
                key_features=features,
                summary=str(parsed.get("summary") or item.description[:120]),
                raw_description=item.description,
                status="success"
            )
        except Exception as exc:
            return ListingSummary(
                id=item.id,
                bedrooms=None,
                price="N/A",
                location="Unknown",
                key_features=[],
                summary="Unable to parse listing.",
                raw_description=item.description,
                status="error",
                error=str(exc)
            )

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "model": MODEL_NAME,
        "rate_limit": RATE_LIMIT_DEFAULT
    }

@app.get("/api/sample", response_model=List[ListingInput])
@limiter.limit("60/minute")
def get_sample_listings(request: Request, city: str = "pune"):
    filename = "sample_listings_mumbai.csv" if city.lower() == "mumbai" else "sample_listings.csv"
    csv_path = os.path.join(os.path.dirname(__file__), filename)
    if not os.path.exists(csv_path):
        raise HTTPException(status_code=404, detail=f"{filename} not found")

    items: List[ListingInput] = []
    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                row_id = int(row.get("id", len(items) + 1))
            except ValueError:
                row_id = len(items) + 1
            desc = row.get("description", "").strip()
            if desc:
                items.append(ListingInput(id=row_id, description=desc))
    return items

@app.post("/api/summarize", response_model=List[ListingSummary])
@limiter.limit("15/minute")
async def summarize_listings(request: Request, listings: List[ListingInput]):
    if not listings:
        raise HTTPException(status_code=400, detail="No listings provided.")

    client = get_groq_client()
    tasks = [process_single_listing(client, item) for item in listings]
    return await asyncio.gather(*tasks)

@app.post("/api/upload-csv", response_model=List[ListingInput])
@limiter.limit("30/minute")
async def upload_csv(request: Request, file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Expected a .csv file.")

    content = await file.read()
    try:
        decoded = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        decoded = content.decode("latin-1")

    reader = csv.reader(io.StringIO(decoded))
    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="CSV is empty.")

    header = [col.strip().lower() for col in rows[0]]
    desc_idx = 1 if len(header) > 1 and "desc" in header[1] else (0 if "desc" in header[0] else None)
    start_row = 1 if (desc_idx is not None or "description" in header or "listing" in header) else 0

    items: List[ListingInput] = []
    for i, row in enumerate(rows[start_row:], start=1):
        if not row or not any(row):
            continue
        if len(row) == 1:
            desc = row[0].strip()
            item_id = i
        else:
            try:
                item_id = int(row[0].strip())
                desc = row[1].strip()
            except (ValueError, IndexError):
                item_id = i
                desc = " ".join(row).strip()

        if desc:
            items.append(ListingInput(id=item_id, description=desc))

    return items
