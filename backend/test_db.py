import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from database import engine, SessionLocal
import models

models.Base.metadata.create_all(bind=engine)
db = SessionLocal()
print("Database schema created.")
db.close()
