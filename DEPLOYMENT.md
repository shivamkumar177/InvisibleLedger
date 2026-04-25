# The Invisible Ledger - Deployment Guide

This guide provides detailed instructions on how to deploy **The Invisible Ledger** to a production environment.

The architecture consists of a FastAPI backend and a Next.js frontend, orchestrated using Docker Compose. SQLite is used as the database and is persisted via a Docker volume.

## Prerequisites

1. **A Linux Server/VPS** (Ubuntu 22.04 or similar is recommended).
2. **Docker and Docker Compose** installed on your server.
3. **A Domain Name** pointing to your server's IP address (e.g., `ledger.yourdomain.com`).
4. **HTTPS Support** (Telegram Webhooks *require* a valid HTTPS certificate). You can use Nginx with Let's Encrypt / Certbot.
5. **API Keys:**
   - **Google Gemini API Key:** For the AI extraction model.
   - **Telegram Bot Token:** Create a bot via [@BotFather](https://t.me/BotFather) on Telegram.

---

## 1. Environment Setup

Clone the repository to your server and navigate into the project directory.

Copy the example environment file and edit it:

```bash
cp .env.example .env
# Edit .env using your favorite text editor
```

Fill in the required values:

```env
GEMINI_API_KEY=your_google_gemini_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
API_KEY=your_custom_secret_key_for_sms_webhook
JWT_SECRET=generate_a_secure_random_string_here
ADMIN_PASSWORD=your_secure_dashboard_password

# The public HTTPS URL where your backend is hosted.
# This is required for the Telegram webhook auto-registration.
WEBHOOK_URL=https://api.ledger.yourdomain.com
```

---

## 2. Reverse Proxy & HTTPS (Nginx)

Since Telegram requires HTTPS for webhooks, and the Next.js frontend should be securely accessible, you should set up a reverse proxy.

A common approach is to map:
- `ledger.yourdomain.com` -> Frontend (Port `3000`)
- `api.ledger.yourdomain.com` -> Backend (Port `8000`)

### Example Nginx Configuration

```nginx
# Frontend
server {
    server_name ledger.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend / API
server {
    server_name api.ledger.yourdomain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Run `certbot --nginx` to automatically issue SSL certificates for these domains.

---

## 3. Frontend Configuration (Optional but recommended)

Before building, you may want to ensure the frontend knows where the backend is.
You can pass this variable during the build or in the `docker-compose.yml`. In the provided `docker-compose.yml`, the frontend connects to `http://localhost:8000`.

For production, if users access the dashboard from their browser, `NEXT_PUBLIC_API_URL` should point to your public API domain.

Edit `docker-compose.yml`:
```yaml
  frontend:
    # ...
    environment:
      - NEXT_PUBLIC_API_URL=https://api.ledger.yourdomain.com
```

---

## 4. Build and Deploy

With the `.env` file configured and Nginx running, you can start the containers.

```bash
# Build the images and start the containers in detached mode
docker-compose up -d --build
```

To view logs and ensure everything started correctly:
```bash
docker-compose logs -f
```

---

## 5. Verifying Ingestion Services

### Telegram Webhook
Upon startup, the FastAPI backend reads the `WEBHOOK_URL` from the `.env` file and automatically registers itself with Telegram.
- Verify this by checking the backend logs: `docker-compose logs backend`
- You should see: `Telegram webhook set to https://api.ledger.yourdomain.com/api/v1/ingest/telegram`
- Test it by sending a text like "Spent $10 on coffee" to your Telegram bot.

### SMS Webhook
Your SMS provider (e.g., Twilio, Tasker on Android) needs to send a `POST` request to your backend.

**Endpoint:** `https://api.ledger.yourdomain.com/api/v1/ingest/sms`
**Headers:**
- `X-API-KEY: <your_custom_secret_key_for_sms_webhook>`
**Body:** Raw text or JSON containing the SMS text.

Example cURL test:
```bash
curl -X POST https://api.ledger.yourdomain.com/api/v1/ingest/sms \
     -H "X-API-KEY: your_custom_secret_key_for_sms_webhook" \
     -H "Content-Type: text/plain" \
     -d "Amazon order $45.99 confirmed."
```

---

## 6. Accessing the Dashboard

1. Navigate to `https://ledger.yourdomain.com`.
2. Enter the `ADMIN_PASSWORD` you defined in your `.env` file.
3. The dashboard will load as a PWA, allowing you to install it to your device's home screen.
4. You will see transactions populating in real-time as they are silently ingested via Telegram or SMS.

## 7. Database Backup

The SQLite database is stored in a Docker volume named `ledger_data`.
To back it up, you can copy the database file from the running container or volume path on the host:

```bash
docker cp $(docker-compose ps -q backend):/data/ledger.db ./ledger_backup.db
```
