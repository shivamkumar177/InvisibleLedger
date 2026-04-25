import os
import json
import logging
from typing import List, Dict, Any
from fastapi import FastAPI, Request, BackgroundTasks, Depends, HTTPException, status, Security
from fastapi.security.api_key import APIKeyHeader
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from database import engine, Base, get_db, SessionLocal
import models
import schemas
import auth
from gemini_service import parse_transaction
from telegram_service import set_webhook, get_file_bytes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_KEY = os.environ.get("API_KEY", "default_sms_key")
api_key_header = APIKeyHeader(name="X-API-KEY", auto_error=False)

def get_api_key(api_key: str = Security(api_key_header)):
    if api_key == API_KEY:
        return api_key
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Could not validate API KEY")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    webhook_url = os.environ.get("WEBHOOK_URL")
    if webhook_url:
        await set_webhook(f"{webhook_url}/api/v1/ingest/telegram")
    yield
    # Shutdown
    pass

app = FastAPI(title="The Invisible Ledger API", lifespan=lifespan)

# Helper for background processing
def process_and_save_transaction(source: str, raw_data: str, text: str = None, image_bytes: bytes = None):
    try:
        # Note: parse_transaction makes a synchronous network call
        parsed_data = parse_transaction(text=text, image_bytes=image_bytes)
        if not parsed_data:
            logger.error("Failed to parse transaction.")
            return

        # Use SessionLocal in a context manager
        with SessionLocal() as db:
            new_tx = models.Transaction(
                source=source,
                amount=parsed_data.get('amount', 0.0),
                currency=parsed_data.get('currency', 'INR'),
                merchant=parsed_data.get('merchant', 'Unknown'),
                category=parsed_data.get('category', 'Other'),
                is_expense=parsed_data.get('is_expense', True),
                raw_data=raw_data
            )
            db.add(new_tx)
            db.commit()
            db.refresh(new_tx)
            logger.info(f"Saved transaction {new_tx.id}: {new_tx.amount} {new_tx.currency} at {new_tx.merchant}")
    except Exception as e:
        logger.error(f"Error in background task: {e}")

# ================= AUTH ENDPOINTS =================
@app.post("/api/v1/auth/login", response_model=schemas.Token)
def login(request: schemas.LoginRequest):
    if request.password != auth.ADMIN_PASSWORD:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password")
    access_token = auth.create_access_token(data={"sub": "admin"})
    return {"access_token": access_token, "token_type": "bearer"}


# ================= INGESTION WEBHOOKS =================
@app.post("/api/v1/ingest/telegram")
async def ingest_telegram(request: Request, background_tasks: BackgroundTasks):
    # Telegram webhooks must return 200 OK immediately
    try:
        update = await request.json()
    except Exception:
        return {"status": "ok"} # Ignore bad requests silently

    message = update.get("message")
    if not message:
        return {"status": "ok"}

    text = message.get("text")
    photo = message.get("photo")
    document = message.get("document")

    # DO NOT call bot.send_message. No confirmation.

    if text:
        background_tasks.add_task(
            process_and_save_transaction,
            source="telegram_text",
            raw_data=text,
            text=text
        )
    elif photo:
        # Get the highest resolution photo
        file_id = photo[-1]["file_id"]

        # Download in background task to respond quickly.
        # Define as synchronous `def` because `process_and_save_transaction` calls the synchronous Gemini API.
        # If it were `async def`, FastAPI would run it on the main event loop, blocking the server.
        def process_photo_sync(file_id, caption):
            import asyncio
            # get_file_bytes is async, so we must run it in an event loop
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            file_bytes = loop.run_until_complete(get_file_bytes(file_id))
            if file_bytes:
                process_and_save_transaction(
                    source="telegram_image",
                    raw_data=f"Telegram Photo {file_id}. Caption: {caption}",
                    text=caption,
                    image_bytes=file_bytes
                )
        background_tasks.add_task(process_photo_sync, file_id, message.get("caption", ""))

    elif document and document.get("mime_type", "").startswith("image/"):
        file_id = document["file_id"]
        def process_doc_sync(file_id, caption):
            import asyncio
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            file_bytes = loop.run_until_complete(get_file_bytes(file_id))
            if file_bytes:
                 process_and_save_transaction(
                     source="telegram_image",
                     raw_data=f"Telegram Doc {file_id}. Caption: {caption}",
                     text=caption,
                     image_bytes=file_bytes
                 )
        background_tasks.add_task(process_doc_sync, file_id, message.get("caption", ""))

    return {"status": "ok"}

@app.post("/api/v1/ingest/sms")
async def ingest_sms(request: Request, background_tasks: BackgroundTasks, api_key: str = Depends(get_api_key)):
    # Assuming the SMS provider sends JSON with 'body' or raw text
    try:
        body_bytes = await request.body()
        raw_text = body_bytes.decode('utf-8')

        # Try JSON first
        try:
            data = json.loads(raw_text)
            text = data.get("text") or data.get("body") or raw_text
        except json.JSONDecodeError:
            text = raw_text

        background_tasks.add_task(
            process_and_save_transaction,
            source="sms",
            raw_data=raw_text,
            text=text
        )
        return {"status": "processing"}
    except Exception as e:
        logger.error(f"Error in SMS webhook: {e}")
        raise HTTPException(status_code=400, detail="Bad Request")


# ================= DASHBOARD ENDPOINTS =================
@app.get("/api/v1/transactions", response_model=List[schemas.TransactionResponse])
def get_transactions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: dict = Depends(auth.verify_token)):
    transactions = db.query(models.Transaction).order_by(models.Transaction.timestamp.desc()).offset(skip).limit(limit).all()
    return transactions

@app.delete("/api/v1/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db), current_user: dict = Depends(auth.verify_token)):
    db_tx = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not db_tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    db.delete(db_tx)
    db.commit()
    return {"status": "deleted", "id": transaction_id}

# Enable CORS for the Next.js frontend
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
