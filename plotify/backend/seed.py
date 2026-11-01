"""
Plotify demo seed script.

Wipes existing data and inserts:
  - 3 users (admin, citizen1, citizen2)
  - 12 properties with realistic Indian addresses
  - 8 transfers (approved, pending, rejected)
  - Documents for several properties
  - 2 anomalous properties (rapid repeated transfers)

Run from the backend/ directory:
    python seed.py
"""
import sqlite3
import hashlib
import os
import sys
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

# Resolve DB path same way config.py does
DB_PATH = os.path.join(os.path.dirname(__file__), "plotify.db")

# Hardhat test wallets (public, safe to hardcode for demo)
WALLETS = {
    "admin":    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "citizen1": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "citizen2": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
}

FAKE_TX = [
    "0x3a1b2c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
    "0x9f8e7d6c5b4a3928170615049382716a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e",
    "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2",
    "0x5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6",
    "0xd9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e",
    "0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3",
    "0x7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8",
    "0xf1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a",
    "0x4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5",
    "0xc0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
    "0x6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7",
    "0xa0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
    "0x3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
]

def fake_hash(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()

def dt(days_ago: int, hours: int = 10) -> str:
    d = datetime.now() - timedelta(days=days_ago, hours=hours)
    return d.strftime("%Y-%m-%d %H:%M:%S")

def run():
    print(f"Seeding database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    # ── Wipe existing data ───────────────────────────────────────────────────
    conn.executescript("""
        DELETE FROM documents;
        DELETE FROM transfers;
        DELETE FROM properties;
        DELETE FROM users;
        DELETE FROM sqlite_sequence;
    """)

    # ── Users ────────────────────────────────────────────────────────────────
    conn.execute("""
        INSERT INTO users (id, username, password_hash, role, wallet_address, created_at)
        VALUES (1, 'admin', ?, 'admin', ?, ?)
    """, (generate_password_hash("admin123"), WALLETS["admin"], dt(90)))

    conn.execute("""
        INSERT INTO users (id, username, password_hash, role, wallet_address, created_at)
        VALUES (2, 'arjun_sharma', ?, 'user', ?, ?)
    """, (generate_password_hash("demo1234"), WALLETS["citizen1"], dt(60)))

    conn.execute("""
        INSERT INTO users (id, username, password_hash, role, wallet_address, created_at)
        VALUES (3, 'priya_mehta', ?, 'user', ?, ?)
    """, (generate_password_hash("demo1234"), WALLETS["citizen2"], dt(45)))

    # ── Properties ───────────────────────────────────────────────────────────
    # 10 normal properties + 2 anomalous (property_id 11 & 12)
    properties = [
        # id, title, location, area, owner_id, status, bc_id, tx_hash, registered_at, description
        (1,  "Andheri West Residential Plot",  "Andheri West, Mumbai",         142.0,  2, "active",           1,  FAKE_TX[0],  dt(55), "Corner plot, 3-road access"),
        (2,  "Bandra Kurla Complex Office",    "Bandra Kurla Complex, Mumbai", 310.0,  2, "active",           2,  FAKE_TX[1],  dt(48), "Premium commercial zone"),
        (3,  "Koregaon Park Bungalow Site",    "Koregaon Park, Pune",          890.0,  2, "active",           3,  FAKE_TX[2],  dt(42), "Quiet residential neighbourhood"),
        (4,  "Whitefield IT Corridor Plot",    "Whitefield, Bengaluru",        220.0,  3, "active",           4,  FAKE_TX[3],  dt(38), "Near tech park"),
        (5,  "DLF Phase 3 Residential",        "DLF Phase 3, Gurgaon",         400.0,  3, "active",           5,  FAKE_TX[4],  dt(32), "Gated community sector"),
        (6,  "Jubilee Hills Commercial",       "Jubilee Hills, Hyderabad",     180.0,  2, "pending_transfer", 6,  FAKE_TX[5],  dt(28), "Prime commercial location"),
        (7,  "Salt Lake Sector V Plot",        "Salt Lake, Kolkata",           260.0,  3, "active",           7,  FAKE_TX[6],  dt(22), "IT sector proximity"),
        (8,  "Connaught Place Commercial",     "Connaught Place, New Delhi",   95.0,   2, "active",           8,  FAKE_TX[7],  dt(18), "Central Delhi business district"),
        (9,  "Boat Club Road Bungalow",        "Boat Club Road, Pune",         1200.0, 3, "active",           9,  FAKE_TX[8],  dt(14), "Heritage neighbourhood"),
        (10, "Navi Mumbai Residential Plot",   "Navi Mumbai, Maharashtra",     175.0,  3, "active",           10, FAKE_TX[9],  dt(10), "Upcoming smart city area"),
        # Anomalous — many rapid transfers
        (11, "Dharavi Redevelopment Plot",     "Dharavi, Mumbai",              320.0,  1, "active",           11, FAKE_TX[10], dt(25), "Anomaly: transferred 5 times rapidly"),
        (12, "Electronic City Plot B7",        "Electronic City, Bengaluru",   210.0,  1, "active",           12, FAKE_TX[11], dt(20), "Anomaly: transferred same day"),
    ]

    conn.executemany("""
        INSERT INTO properties
            (id, title, location, area, owner_id, status, blockchain_id, tx_hash, registered_at, description)
        VALUES (?,?,?,?,?,?,?,?,?,?)
    """, properties)

    # ── Transfers ────────────────────────────────────────────────────────────
    transfers = [
        # Normal approved transfer: prop 1, arjun → priya
        (1,  1, 2, 3, "approved", "Agreed sale price Rs 1.2 Cr",    FAKE_TX[5],  dt(40), dt(38)),
        # Normal approved: prop 4, priya → arjun
        (2,  4, 3, 2, "approved", "Gift transfer — family",          FAKE_TX[6],  dt(30), dt(28)),
        # Pending: prop 6, arjun → admin
        (3,  6, 2, 1, "pending",  "Investment acquisition",          None,        dt(5),  None),
        # Rejected: prop 2
        (4,  2, 2, 3, "rejected", "Buyer failed verification",       None,        dt(20), dt(18)),
        # Anomalous property 11 — 5 rapid transfers
        (5,  11, 1, 2, "approved", "Transfer 1 of 5",                FAKE_TX[0],  dt(24, 0),  dt(24, 1)),
        (6,  11, 2, 3, "approved", "Transfer 2 of 5",                FAKE_TX[1],  dt(24, 2),  dt(24, 3)),
        (7,  11, 3, 2, "approved", "Transfer 3 of 5",                FAKE_TX[2],  dt(24, 4),  dt(24, 5)),
        (8,  11, 2, 3, "approved", "Transfer 4 of 5",                FAKE_TX[3],  dt(24, 6),  dt(24, 7)),
        (9,  11, 3, 1, "approved", "Transfer 5 of 5",                FAKE_TX[4],  dt(24, 8),  dt(24, 9)),
        # Anomalous property 12 — transferred same day as registration
        (10, 12, 1, 2, "approved", "Immediate transfer post-reg",    FAKE_TX[5],  dt(20, 1),  dt(20, 2)),
        (11, 12, 2, 3, "approved", "Same-day second transfer",       FAKE_TX[6],  dt(20, 3),  dt(20, 4)),
    ]

    conn.executemany("""
        INSERT INTO transfers
            (id, property_id, from_user_id, to_user_id, status, note, tx_hash, requested_at, resolved_at)
        VALUES (?,?,?,?,?,?,?,?,?)
    """, transfers)

    # ── Documents ────────────────────────────────────────────────────────────
    documents = [
        (1, 1, 2, "andheri_title_deed.pdf",   "title_deed",    fake_hash("andheri_title_deed"),    FAKE_TX[7],  dt(54)),
        (2, 1, 2, "andheri_survey_map.pdf",   "survey_map",    fake_hash("andheri_survey_map"),    None,        dt(53)),
        (3, 2, 2, "bkc_office_deed.pdf",      "title_deed",    fake_hash("bkc_office_deed"),       FAKE_TX[8],  dt(47)),
        (4, 3, 2, "koregaon_title.pdf",       "title_deed",    fake_hash("koregaon_title"),        None,        dt(41)),
        (5, 4, 3, "whitefield_survey.pdf",    "survey_map",    fake_hash("whitefield_survey"),     FAKE_TX[9],  dt(37)),
        (6, 5, 3, "dlf_sale_agreement.pdf",   "sale_agreement",fake_hash("dlf_sale_agreement"),    None,        dt(31)),
        (7, 8, 2, "connaught_deed.pdf",       "title_deed",    fake_hash("connaught_deed"),        FAKE_TX[10], dt(17)),
    ]

    conn.executemany("""
        INSERT INTO documents
            (id, property_id, uploader_id, filename, doc_type, sha256_hash, tx_hash, uploaded_at)
        VALUES (?,?,?,?,?,?,?,?)
    """, documents)

    conn.commit()
    conn.close()

    print("✓ Seeded 3 users, 12 properties, 11 transfers, 7 documents")
    print("")
    print("Demo accounts:")
    print("  Admin:    admin       / admin123")
    print("  Citizen:  arjun_sharma / demo1234")
    print("  Citizen:  priya_mehta  / demo1234")

if __name__ == "__main__":
    run()
