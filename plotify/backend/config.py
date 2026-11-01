import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # ── Flask ─────────────────────────────────────────────────────────────────
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
    DEBUG: bool = os.getenv("FLASK_ENV", "production") == "development"

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URI: str = os.getenv("DATABASE_URI", "sqlite:///plotify.db")
    # Derive the plain filesystem path from the URI for sqlite3 usage
    DB_PATH: str = DATABASE_URI.replace("sqlite:///", "")
    if not os.path.isabs(DB_PATH):
        # Make the path relative to this file's directory (backend/)
        DB_PATH = os.path.join(os.path.dirname(__file__), DB_PATH)

    # ── Blockchain ────────────────────────────────────────────────────────────
    BLOCKCHAIN_RPC_URL: str = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
    CONTRACT_ADDRESS: str = os.getenv("CONTRACT_ADDRESS", "")
    ADMIN_PRIVATE_KEY: str = os.getenv("ADMIN_PRIVATE_KEY", "")

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_EXPIRY_HOURS: int = int(os.getenv("JWT_EXPIRY_HOURS", "24"))

    # ── File uploads ──────────────────────────────────────────────────────────
    UPLOAD_FOLDER: str = os.path.join(os.path.dirname(__file__), "uploads")
    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16 MB
