# Environment Variables Guide

This guide explains how to obtain each of the necessary environment variables for **The Invisible Ledger** and where to put them.

All of these should be saved in the `.env` file at the root of your project.

---

## `GEMINI_API_KEY`
**What it is:** The key used to access Google's Gemini AI models (Gemini 2.5 Flash) for parsing your receipts and texts into structured data.
**How to get it:**
1. Go to Google AI Studio: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Sign in with your Google account.
3. In the left-hand navigation menu, click **Get API key**.
4. Click the **Create API key** button.
5. Copy the generated key and paste it into your `.env` file.

---

## `TELEGRAM_BOT_TOKEN`
**What it is:** The token that allows your backend to communicate with the Telegram API and register the webhook to listen for your messages.
**How to get it:**
1. Open the Telegram app and search for the user `@BotFather` (with the verified blue checkmark).
2. Start a chat and send the command `/newbot`.
3. Follow the prompts to choose a name and a username for your bot.
4. Once created, BotFather will send you a message containing your **HTTP API Token**.
5. Copy this string (it usually looks like `123456789:ABCDEF...`) and paste it into your `.env` file.

---

## `API_KEY`
**What it is:** A custom secret key that *you* define to secure the SMS ingestion webhook. It ensures that only authorized clients (like your own phone) can send data to the `/api/v1/ingest/sms` endpoint.
**How to get it:**
1. You make this up!
2. Open a terminal and generate a random string, or just type a strong password. For example, using python: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
3. Paste this string into your `.env` file as `API_KEY`.
4. *Note:* You will need to configure your SMS forwarding service (like Twilio, or an Android automation app like Tasker/MacroDroid) to send this exact key in the `X-API-KEY` header of its POST requests.

---

## `JWT_SECRET`
**What it is:** A cryptographic secret used to sign and verify JSON Web Tokens (JWT) for dashboard authentication.
**How to get it:**
1. Similar to the `API_KEY`, you must generate this yourself.
2. It should be a long, random, and secure string.
3. In your terminal, you can generate one using: `openssl rand -hex 32`
4. Copy the output and paste it into your `.env` file.

---

## `ADMIN_PASSWORD`
**What it is:** The password you will use to log into the frontend dashboard.
**How to get it:**
1. Choose a strong password that you will remember.
2. Type it directly into your `.env` file next to `ADMIN_PASSWORD=`.

---

## `WEBHOOK_URL`
**What it is:** The public, HTTPS-enabled URL of your backend. Telegram requires this to know where to send incoming messages.
**How to get it:**
- **For Production:** This is the domain name where you have deployed your backend API (e.g., `https://api.ledger.yourdomain.com`). Make sure it starts with `https://`.
- **For Local Testing:** Telegram webhooks cannot point to `localhost`. You must use a tunneling service like [ngrok](https://ngrok.com/) to expose your local port 8000 to the internet. Run `ngrok http 8000`, and paste the `https://...` URL it gives you into your `.env` file.
