import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from fastapi.testclient import TestClient
from main import app
from auth import ADMIN_PASSWORD

client = TestClient(app)

def test_login():
    response = client.post("/api/v1/auth/login", json={"password": ADMIN_PASSWORD})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_sms_ingest_no_auth():
    response = client.post("/api/v1/ingest/sms", content=b"Sent $50 to Bob")
    assert response.status_code == 403

def test_telegram_ingest():
    response = client.post("/api/v1/ingest/telegram", json={"message": {"text": "Hello"}})
    assert response.status_code == 200
