import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from database import engine, SessionLocal
import models

db = SessionLocal()
tx1 = models.Transaction(source="sms", amount=45.0, merchant="Shell Station", category="Transport", is_expense=True, raw_data="Paid $45.00 at Shell Station")
tx2 = models.Transaction(source="telegram_text", amount=142.50, merchant="Whole Foods Market", category="Groceries", is_expense=True, raw_data="Grocery run 142.5")
tx3 = models.Transaction(source="sms", amount=1204.88, merchant="AWS Cloud Services", category="Infrastructure", is_expense=True, raw_data="AWS Invoice $1204.88")
db.add(tx1)
db.add(tx2)
db.add(tx3)
db.commit()
print("Seeded data")
