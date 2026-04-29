import os
import logging
from telegram import Bot

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")

async def set_webhook(url: str):
    if not TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN is not set. Skipping webhook setup.")
        return False

    try:
        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        await bot.set_webhook(url)
        logger.info(f"Telegram webhook set to {url}")
        return True
    except Exception as e:
        logger.error(f"Failed to set Telegram webhook: {e}")
        return False

async def get_file_bytes(file_id: str):
    if not TELEGRAM_BOT_TOKEN:
        return None
    try:
        bot = Bot(token=TELEGRAM_BOT_TOKEN)
        file = await bot.get_file(file_id)
        file_bytes = await file.download_as_bytearray()
        return bytes(file_bytes)
    except Exception as e:
        logger.error(f"Failed to download file from Telegram: {e}")
        return None
