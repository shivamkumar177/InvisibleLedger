# Local Development Setup Guide

This guide explains how to run **The Invisible Ledger** locally on your machine and how to use the provided VSCode configuration to debug both the frontend and backend simultaneously.

## Prerequisites

- **Python 3.12+**
- **Node.js 20+**
- **VSCode** (with Python and ESLint extensions recommended)

---

## 1. Environment Setup

At the root of the project, create your local environment file:

```bash
cp .env.example .env
```

Open `.env` and configure your local keys. For local testing without a domain, you can leave `WEBHOOK_URL` empty, or use a service like `ngrok` if you want to test live Telegram webhooks locally.

---

## 2. Manual Terminal Setup

If you prefer to run things in separate terminal windows instead of the VSCode debugger, follow these steps:

### Backend (FastAPI)

1. Open a terminal and navigate to the backend:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (e.g., using virtualenv or python's built in venv module).
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the development server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend (Next.js)

1. Open a second terminal and navigate to the frontend:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev -- -p 3000
   ```

You can now access the app at `http://localhost:3000`.

---

## 3. VSCode Debugger Setup (One-Click Start)

We have included a VSCode workspace configuration (`.vscode/launch.json`) that allows you to launch both the backend and frontend in debug mode with a single click.

1. Open the project root in VSCode.
2. Ensure you have installed the backend dependencies in a local virtual environment (`backend/venv`). VSCode will use the active Python interpreter.
3. Open the **Run and Debug** view in VSCode (`Ctrl+Shift+D` or `Cmd+Shift+D`).
4. In the dropdown menu at the top, select **"Full Stack"**.
5. Click the **Play button** (or press `F5`).

VSCode will automatically:
- Launch the FastAPI server with the Python debugger attached (on port 8000).
- Launch the Next.js development server in a JavaScript debug terminal (on port 3000).

You can place breakpoints in your Python API routes or your React components and they will be hit seamlessly.
