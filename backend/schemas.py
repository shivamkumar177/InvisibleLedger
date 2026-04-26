from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class TransactionBase(BaseModel):
    amount: float
    currency: Optional[str] = "INR"
    merchant: Optional[str] = None
    category: Optional[str] = None
    payment_method: Optional[str] = "Unknown"
    is_expense: Optional[bool] = True

class TransactionCreate(TransactionBase):
    source: str
    raw_data: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: int
    timestamp: datetime
    source: str
    raw_data: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class LoginRequest(BaseModel):
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
