"""
Database initialisation — creates all tables if they do not exist.
Call init_db(app) once from the Flask application factory.
"""
import sqlite3
from flask import Flask


SCHEMA = """
-- Users table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    username       TEXT    NOT NULL UNIQUE,
    password_hash  TEXT    NOT NULL,
    role           TEXT    NOT NULL DEFAULT 'user',   -- 'admin' | 'user'
    wallet_address TEXT,
    created_at     DATETIME DEFAULT (datetime('now'))
);

-- Properties table ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT    NOT NULL,
    location        TEXT    NOT NULL,
    area            REAL    NOT NULL,                  -- square metres
    owner_id        INTEGER NOT NULL REFERENCES users(id),
    status          TEXT    NOT NULL DEFAULT 'active', -- 'active' | 'pending_transfer'
    blockchain_id   INTEGER,                           -- ID returned by smart contract
    tx_hash         TEXT,                              -- registration tx hash
    registered_at   DATETIME DEFAULT (datetime('now')),
    description     TEXT
);

-- Transfers table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transfers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id     INTEGER NOT NULL REFERENCES properties(id),
    from_user_id    INTEGER NOT NULL REFERENCES users(id),
    to_user_id      INTEGER NOT NULL REFERENCES users(id),
    status          TEXT    NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    note            TEXT,
    tx_hash         TEXT,                               -- blockchain tx hash after approval
    requested_at    DATETIME DEFAULT (datetime('now')),
    resolved_at     DATETIME
);

-- Documents table ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id     INTEGER NOT NULL REFERENCES properties(id),
    uploader_id     INTEGER NOT NULL REFERENCES users(id),
    filename        TEXT    NOT NULL,
    doc_type        TEXT    NOT NULL DEFAULT 'other',  -- 'title_deed' | 'survey_map' | 'other'
    sha256_hash     TEXT    NOT NULL,
    tx_hash         TEXT,                              -- optional on-chain anchor
    uploaded_at     DATETIME DEFAULT (datetime('now'))
);
"""


def init_db(app: Flask) -> None:
    """Create tables and seed an admin account if the DB is freshly created."""
    with app.app_context():
        db_path = app.config["DB_PATH"]
        conn = sqlite3.connect(db_path)
        conn.executescript(SCHEMA)

        # Seed a default admin user if no users exist yet
        cursor = conn.execute("SELECT COUNT(*) FROM users")
        if cursor.fetchone()[0] == 0:
            from werkzeug.security import generate_password_hash
            conn.execute(
                """
                INSERT INTO users (username, password_hash, role, wallet_address)
                VALUES (?, ?, ?, ?)
                """,
                (
                    "admin",
                    generate_password_hash("admin123"),
                    "admin",
                    # first Hardhat test account address
                    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                ),
            )
            conn.commit()
            print("[DB] Seeded default admin user (admin / admin123)")

        conn.close()
