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

---

## Setting up SMS Forwarding on iPhone (Apple Shortcuts)

If you are using an iPhone, you can automatically forward your bank/transaction SMS messages to your Ledger using the built-in Apple Shortcuts app.

1. **Open the Shortcuts app** on your iPhone.
2. Go to the **Automation** tab at the bottom.
3. Tap the **+** (plus) icon in the top right to create a new Personal Automation.
4. Scroll down and select **Message**.
5. Set the conditions for the automation:
   - **Message Contains:** Enter keywords that your bank uses (e.g., "spent", "debited", "credited", "purchase").
   - **Sender:** (Optional) You can specify your bank's number or contact if you want to be extra precise.
   - Choose **Run Immediately** (so it happens silently without asking you).
6. Tap **Next**.
7. Tap **New Blank Automation**.
8. Tap **Add Action** and search for **Get Contents of URL**.
9. Configure the action:
   - **URL:** Enter your deployed webhook URL (e.g., `https://api.ledger.yourdomain.com/api/v1/ingest/sms`).
   - Tap the arrow next to the URL to expand the advanced settings.
   - **Method:** Change from `GET` to `POST`.
   - **Headers:** Add a new header:
     - **Key:** `X-API-KEY`
     - **Text:** The secret `API_KEY` you defined in your `.env` file.
   - **Request Body:** Select **JSON**.
   - Add a new Text field in the JSON body:
     - **Key:** `text`
     - **Text:** Tap here and select **Shortcut Input** (or "Message" -> "Content") from the variables bar above the keyboard. This passes the actual text of the SMS.
10. Tap **Done** to save the automation.

Now, whenever your iPhone receives an SMS matching your criteria, it will silently send the text to your Invisible Ledger in the background!

---

## Using the Telegram Bot

Once your `TELEGRAM_BOT_TOKEN` and `WEBHOOK_URL` are configured and your backend is running, using the Telegram integration is the easiest way to log transactions.

1. **Find your bot:** In the Telegram app, search for the username you gave your bot when you created it with `@BotFather`.
2. **Start the chat:** Tap **Start** (or send `/start`).
3. **Log a transaction:**
   - **Text:** Simply type a message like `"Bought a coffee for $4.50 at Starbucks"` or `"Uber ride 15 EUR"`. Send it to the bot.
   - **Images (Receipts):** Take a photo of a physical receipt or upload a screenshot of a digital receipt and send it to the bot.
   - **Documents:** You can also send PDF invoices or image documents.
4. **The Silent Magic:** The bot will intentionally *not* reply to you (as per the "Silent Ledger" philosophy). However, in the background, your backend will send the text or image to Gemini AI, extract the merchant, amount, category, and currency, and save it to your database.
5. **Verify:** Open your Next.js dashboard, and you will see the new transaction appear automatically!
