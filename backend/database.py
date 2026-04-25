from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Use a local path for development if /data is not writable/available
# In production with docker-compose, this will likely resolve to /data/ledger.db
# since docker mounts the volume to /data
db_dir = "/data"
if os.path.exists(db_dir) and os.access(db_dir, os.W_OK):
    db_path = os.path.join(db_dir, "ledger.db")
else:
    # Fallback to local directory for development/testing
    db_path = os.path.join(os.path.dirname(__file__), "ledger.db")

SQLALCHEMY_DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
