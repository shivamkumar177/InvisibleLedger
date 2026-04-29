import sys
import os
from datetime import datetime, timedelta

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from database import engine, SessionLocal
import models

# Drop all and recreate to update schema
models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

db = SessionLocal()

today = datetime.now()

# Day 1 (7 days ago)
db.add(models.Transaction(timestamp=today - timedelta(days=6), source="sms", amount=45.0, currency="USD", merchant="Shell Station", category="Transport", payment_method="Credit Card", is_expense=True, raw_data="Paid $45.00 at Shell Station via CC ending in 1234"))
db.add(models.Transaction(timestamp=today - timedelta(days=6), source="sms", amount=15.50, currency="USD", merchant="Starbucks", category="Food", payment_method="Apple Pay", is_expense=True, raw_data="Starbucks $15.50"))

# Day 2 (6 days ago)
db.add(models.Transaction(timestamp=today - timedelta(days=5), source="telegram", amount=3500.0, currency="USD", merchant="Stripe Payout", category="Salary", payment_method="Bank Transfer", is_expense=False, raw_data="Stripe payout $3500"))
db.add(models.Transaction(timestamp=today - timedelta(days=5), source="sms", amount=142.50, currency="USD", merchant="Whole Foods", category="Grocery", payment_method="Credit Card", is_expense=True, raw_data="Grocery run $142.50 via Visa 4455"))

# Day 3 (5 days ago)
db.add(models.Transaction(timestamp=today - timedelta(days=4), source="sms", amount=65.00, currency="USD", merchant="Uber", category="Transport", payment_method="UPI", is_expense=True, raw_data="Uber ride $65.00 paid via UPI"))

# Day 4 (4 days ago)
db.add(models.Transaction(timestamp=today - timedelta(days=3), source="telegram", amount=1204.88, currency="USD", merchant="AWS Cloud", category="Utilities", payment_method="Credit Card", is_expense=True, raw_data="AWS Invoice $1204.88 billed to CC"))

# Day 5 (3 days ago)
db.add(models.Transaction(timestamp=today - timedelta(days=2), source="sms", amount=120.00, currency="USD", merchant="Target", category="Shopping", payment_method="Debit Card", is_expense=True, raw_data="Target $120.00 on Debit Card"))

# Day 6 (2 days ago)
db.add(models.Transaction(timestamp=today - timedelta(days=1), source="telegram", amount=25.00, currency="USD", merchant="Netflix", category="Entertainment", payment_method="Credit Card", is_expense=True, raw_data="Netflix subscription $25.00"))

# Day 7 (Today)
db.add(models.Transaction(timestamp=today, source="sms", amount=150.00, currency="USD", merchant="Friend Repayment", category="Other", payment_method="Venmo", is_expense=False, raw_data="Bob sent you $150 on Venmo"))
db.add(models.Transaction(timestamp=today, source="sms", amount=35.00, currency="USD", merchant="Local Cafe", category="Food", payment_method="Cash", is_expense=True, raw_data="Lunch $35.00 cash"))

db.commit()
print("Seeded data successfully")
db.close()
