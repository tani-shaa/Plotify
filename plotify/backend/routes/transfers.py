"""
Transfer routes
  GET  /api/transfers                     — list transfers (filter by status/property)
  POST /api/transfers                     — request a new transfer  [auth]
  GET  /api/transfers/<id>                — get single transfer
  PUT  /api/transfers/<id>/approve        — approve & execute on-chain  [admin]
  PUT  /api/transfers/<id>/reject         — reject a transfer  [admin]
  GET  /api/transfers/property/<prop_id>  — get all transfers for a property
"""
import datetime

from flask import Blueprint, request, jsonify, current_app

from extensions import get_db, token_required, admin_required
from services.blockchain import BlockchainService

transfers_bp = Blueprint("transfers", __name__, url_prefix="/api/transfers")


def _row_to_dict(row) -> dict:
    return dict(row)


# ── GET /api/transfers ────────────────────────────────────────────────────────

@transfers_bp.route("", methods=["GET"])
@token_required
def list_transfers(current_user):
    db     = get_db()
    status = request.args.get("status", "").strip()
    prop   = request.args.get("property_id", type=int)

    query = """
        SELECT t.*,
               fu.username AS from_username,
               tu.username AS to_username,
               p.title     AS property_title
        FROM   transfers t
        JOIN   users  fu ON fu.id = t.from_user_id
        JOIN   users  tu ON tu.id = t.to_user_id
        JOIN   properties p ON p.id = t.property_id
        WHERE  1=1
    """
    params: list = []

    # Non-admins only see transfers involving their own user ID
    if current_user.get("role") != "admin":
        query  += " AND (t.from_user_id = ? OR t.to_user_id = ?)"
        params += [current_user["sub"], current_user["sub"]]

    if status:
        query  += " AND t.status = ?"
        params.append(status)
    if prop:
        query  += " AND t.property_id = ?"
        params.append(prop)

    query += " ORDER BY t.requested_at DESC"
    rows   = db.execute(query, params).fetchall()
    return jsonify([_row_to_dict(r) for r in rows])


# ── POST /api/transfers ───────────────────────────────────────────────────────

@transfers_bp.route("", methods=["POST"])
@token_required
def request_transfer(current_user):
    data        = request.get_json(silent=True) or {}
    property_id = data.get("property_id")
    to_username = (data.get("to_username") or "").strip()
    note        = (data.get("note") or "").strip() or None

    if not property_id:
        return jsonify({"error": "property_id is required"}), 400
    if not to_username:
        return jsonify({"error": "to_username is required"}), 400

    db = get_db()

    prop = db.execute(
        "SELECT id, owner_id, status FROM properties WHERE id = ?", (property_id,)
    ).fetchone()
    if not prop:
        return jsonify({"error": "Property not found"}), 404
    if prop["owner_id"] != current_user["sub"]:
        return jsonify({"error": "You do not own this property"}), 403
    if prop["status"] == "pending_transfer":
        return jsonify({"error": "A transfer is already pending for this property"}), 409

    to_user = db.execute(
        "SELECT id FROM users WHERE username = ?", (to_username,)
    ).fetchone()
    if not to_user:
        return jsonify({"error": f"User '{to_username}' not found"}), 404
    if to_user["id"] == current_user["sub"]:
        return jsonify({"error": "Cannot transfer to yourself"}), 400

    # Create the pending transfer record
    db.execute(
        """
        INSERT INTO transfers (property_id, from_user_id, to_user_id, note)
        VALUES (?, ?, ?, ?)
        """,
        (property_id, current_user["sub"], to_user["id"], note),
    )
    db.execute("UPDATE properties SET status = 'pending_transfer' WHERE id = ?", (property_id,))
    db.commit()

    transfer = db.execute(
        "SELECT * FROM transfers WHERE id = last_insert_rowid()"
    ).fetchone()
    return jsonify(_row_to_dict(transfer)), 201


# ── GET /api/transfers/<id> ───────────────────────────────────────────────────

@transfers_bp.route("/<int:transfer_id>", methods=["GET"])
@token_required
def get_transfer(transfer_id, current_user):
    db = get_db()
    row = db.execute(
        """
        SELECT t.*,
               fu.username AS from_username,
               tu.username AS to_username,
               p.title     AS property_title
        FROM   transfers t
        JOIN   users  fu ON fu.id = t.from_user_id
        JOIN   users  tu ON tu.id = t.to_user_id
        JOIN   properties p ON p.id = t.property_id
        WHERE  t.id = ?
        """,
        (transfer_id,),
    ).fetchone()

    if not row:
        return jsonify({"error": "Transfer not found"}), 404

    # Non-admins can only see their own transfers
    if current_user.get("role") != "admin":
        if row["from_user_id"] != current_user["sub"] and row["to_user_id"] != current_user["sub"]:
            return jsonify({"error": "Not authorised"}), 403

    return jsonify(_row_to_dict(row))


# ── PUT /api/transfers/<id>/approve ──────────────────────────────────────────

@transfers_bp.route("/<int:transfer_id>/approve", methods=["PUT"])
@token_required
@admin_required
def approve_transfer(transfer_id, current_user):
    db = get_db()
    t  = db.execute("SELECT * FROM transfers WHERE id = ?", (transfer_id,)).fetchone()

    if not t:
        return jsonify({"error": "Transfer not found"}), 404
    if t["status"] != "pending":
        return jsonify({"error": f"Transfer is already {t['status']}"}), 409

    prop = db.execute(
        "SELECT blockchain_id FROM properties WHERE id = ?", (t["property_id"],)
    ).fetchone()

    from_user = db.execute(
        "SELECT wallet_address FROM users WHERE id = ?", (t["from_user_id"],)
    ).fetchone()
    to_user   = db.execute(
        "SELECT wallet_address FROM users WHERE id = ?", (t["to_user_id"],)
    ).fetchone()

    tx_hash = None
    if (
        prop and prop["blockchain_id"]
        and from_user and from_user["wallet_address"]
        and to_user   and to_user["wallet_address"]
        and current_app.config.get("CONTRACT_ADDRESS")
    ):
        try:
            bc = BlockchainService.from_app(current_app)
            tx_hash = bc.transfer_ownership(
                prop["blockchain_id"],
                from_user["wallet_address"],
                to_user["wallet_address"],
                t["note"] or "",
            )
        except Exception as exc:
            current_app.logger.warning("On-chain transfer failed: %s", exc)

    now = datetime.datetime.utcnow().isoformat()
    db.execute(
        """
        UPDATE transfers
        SET    status = 'approved', tx_hash = ?, resolved_at = ?
        WHERE  id = ?
        """,
        (tx_hash, now, transfer_id),
    )
    # Update property owner and status
    db.execute(
        "UPDATE properties SET owner_id = ?, status = 'active', tx_hash = ? WHERE id = ?",
        (t["to_user_id"], tx_hash, t["property_id"]),
    )
    db.commit()

    updated = db.execute("SELECT * FROM transfers WHERE id = ?", (transfer_id,)).fetchone()
    return jsonify(_row_to_dict(updated))


# ── PUT /api/transfers/<id>/reject ────────────────────────────────────────────

@transfers_bp.route("/<int:transfer_id>/reject", methods=["PUT"])
@token_required
@admin_required
def reject_transfer(transfer_id, current_user):
    db = get_db()
    t  = db.execute("SELECT * FROM transfers WHERE id = ?", (transfer_id,)).fetchone()

    if not t:
        return jsonify({"error": "Transfer not found"}), 404
    if t["status"] != "pending":
        return jsonify({"error": f"Transfer is already {t['status']}"}), 409

    now = datetime.datetime.utcnow().isoformat()
    db.execute(
        "UPDATE transfers SET status = 'rejected', resolved_at = ? WHERE id = ?",
        (now, transfer_id),
    )
    db.execute(
        "UPDATE properties SET status = 'active' WHERE id = ?",
        (t["property_id"],),
    )
    db.commit()

    updated = db.execute("SELECT * FROM transfers WHERE id = ?", (transfer_id,)).fetchone()
    return jsonify(_row_to_dict(updated))


# ── GET /api/transfers/property/<prop_id> ─────────────────────────────────────

@transfers_bp.route("/property/<int:prop_id>", methods=["GET"])
@token_required
def transfers_for_property(prop_id, current_user):
    db = get_db()
    rows = db.execute(
        """
        SELECT t.*,
               fu.username AS from_username,
               tu.username AS to_username
        FROM   transfers t
        JOIN   users fu ON fu.id = t.from_user_id
        JOIN   users tu ON tu.id = t.to_user_id
        WHERE  t.property_id = ?
        ORDER  BY t.requested_at DESC
        """,
        (prop_id,),
    ).fetchall()

    return jsonify([_row_to_dict(r) for r in rows])
