from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from sqlalchemy.sql import func
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now())
    source = Column(String)  # 'sms', 'telegram_text', 'telegram_image'
    amount = Column(Float)
    currency = Column(String, default="INR")
    merchant = Column(String)
    category = Column(String)
    payment_method = Column(String, default="Unknown") # e.g., 'Credit Card', 'UPI', 'Bank Transfer'
    is_expense = Column(Boolean, default=True) # Credit vs Debit
    raw_data = Column(Text) # Original message or file path
