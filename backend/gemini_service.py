import os
import json
import logging
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

SYSTEM_INSTRUCTION = """Analyze financial data (SMS text or Receipt image). Return ONLY a JSON object.
Rules:
1. Extract 'amount' (numerical), 'currency' (default INR), 'merchant' (clean name), 'category', and 'payment_method'.
2. Determine 'is_expense' (True for spend, False for income/refund).
3. Categories: [Food, Grocery, Transport, Rent, Utilities, Shopping, Health, Entertainment, Investment, Salary, Other].
4. Payment Methods: Try to extract the payment method if present (e.g., 'Credit Card', 'UPI', 'Bank Account', 'Cash'). Default to 'Unknown'.
JSON Schema:
{ "amount": float, "currency": "string", "merchant": "string", "category": "string", "payment_method": "string", "is_expense": boolean }"""

def parse_transaction(text: str = None, image_bytes: bytes = None, mime_type: str = "image/jpeg"):
    """
    Parses a transaction from text or an image using Gemini.
    """
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY is not set.")
        return None

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        contents = []
        if text:
            contents.append(text)
        if image_bytes:
            contents.append(
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type,
                )
            )

        if not contents:
            return None

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
            ),
        )

        response_text = response.text.strip()
        # Clean up any potential markdown code blocks if the model ignored response_mime_type
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        data = json.loads(response_text)
        return data

    except Exception as e:
        logger.error(f"Error parsing transaction with Gemini: {e}")
        return None
