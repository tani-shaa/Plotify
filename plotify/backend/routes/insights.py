"""
Insights routes
  GET /api/insights/stats     — dashboard statistics
  GET /api/insights/anomalies — Isolation Forest anomaly detection results
"""
from flask import Blueprint, jsonify, current_app

from extensions import get_db, token_required, admin_required
from services.anomaly import detect_anomalies

insights_bp = Blueprint("insights", __name__, url_prefix="/api/insights")


# ── GET /api/insights/stats ───────────────────────────────────────────────────

@insights_bp.route("/stats", methods=["GET"])
@token_required
def stats(current_user):
    db = get_db()

    total_properties   = db.execute("SELECT COUNT(*) FROM properties").fetchone()[0]
    active_properties  = db.execute(
        "SELECT COUNT(*) FROM properties WHERE status = 'active'"
    ).fetchone()[0]
    pending_transfers  = db.execute(
        "SELECT COUNT(*) FROM transfers WHERE status = 'pending'"
    ).fetchone()[0]
    total_transfers    = db.execute("SELECT COUNT(*) FROM transfers").fetchone()[0]
    approved_transfers = db.execute(
        "SELECT COUNT(*) FROM transfers WHERE status = 'approved'"
    ).fetchone()[0]
    total_users        = db.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    total_documents    = db.execute("SELECT COUNT(*) FROM documents").fetchone()[0]

    # Recent activity — last 5 approved transfers
    recent = db.execute(
        """
        SELECT t.id, t.resolved_at, t.tx_hash,
               p.title AS property_title,
               fu.username AS from_username,
               tu.username AS to_username
        FROM   transfers t
        JOIN   properties p ON p.id = t.property_id
        JOIN   users fu ON fu.id = t.from_user_id
        JOIN   users tu ON tu.id = t.to_user_id
        WHERE  t.status = 'approved'
        ORDER  BY t.resolved_at DESC
        LIMIT  5
        """
    ).fetchall()

    return jsonify({
        "total_properties":   total_properties,
        "active_properties":  active_properties,
        "pending_transfers":  pending_transfers,
        "total_transfers":    total_transfers,
        "approved_transfers": approved_transfers,
        "total_users":        total_users,
        "total_documents":    total_documents,
        "recent_transfers":   [dict(r) for r in recent],
    })


# ── GET /api/insights/anomalies ───────────────────────────────────────────────

@insights_bp.route("/anomalies", methods=["GET"])
@token_required
@admin_required
def anomalies(current_user):
    db_path    = current_app.config["DB_PATH"]
    flagged    = detect_anomalies(db_path)

    if not flagged:
        return jsonify({
            "message":   "Not enough data for anomaly detection (need ≥ 5 properties).",
            "anomalies": [],
        })

    # Enrich with property title from DB
    db = get_db()
    for item in flagged:
        row = db.execute(
            "SELECT title, location FROM properties WHERE id = ?",
            (item["property_id"],),
        ).fetchone()
        if row:
            item["property_title"]    = row["title"]
            item["property_location"] = row["location"]

    return jsonify({"anomalies": flagged})


# ── GET /api/insights/chain-status ───────────────────────────────────────────

@insights_bp.route("/chain-status", methods=["GET"])
@token_required
def chain_status(current_user):
    """Returns live blockchain node status — block number, network, contract."""
    from flask import current_app
    import socket

    rpc_url          = current_app.config.get("BLOCKCHAIN_RPC_URL", "")
    contract_address = current_app.config.get("CONTRACT_ADDRESS", "")

    result = {
        "connected":        False,
        "block_number":     None,
        "network_id":       None,
        "rpc_url":          rpc_url,
        "contract_address": contract_address,
        "error":            None,
    }

    if not rpc_url or not contract_address:
        result["error"] = "Blockchain not configured"
        return jsonify(result)

    # Quick TCP probe first — avoids blocking on Web3 if node is down
    try:
        from urllib.parse import urlparse
        parsed = urlparse(rpc_url)
        host   = parsed.hostname or "127.0.0.1"
        port   = parsed.port or 8545
        sock   = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1.5)
        tcp_ok = sock.connect_ex((host, port)) == 0
        sock.close()
    except Exception:
        tcp_ok = False

    if not tcp_ok:
        result["error"] = "Node unreachable"
        return jsonify(result)

    try:
        from web3 import Web3
        w3 = Web3(Web3.HTTPProvider(rpc_url, request_kwargs={"timeout": 2}))
        if w3.is_connected():
            result["connected"]    = True
            result["block_number"] = w3.eth.block_number
            result["network_id"]   = w3.eth.chain_id
        else:
            result["error"] = "Node unreachable"
    except Exception as e:
        result["error"] = str(e)[:80]

    return jsonify(result)
