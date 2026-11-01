"""
Property routes
  GET  /api/properties              — list all (with optional ?search= and ?owner_id=)
  POST /api/properties              — register a new property  [auth required]
  GET  /api/properties/<id>         — get single property
  PUT  /api/properties/<id>         — update description/status  [admin]
"""
from flask import Blueprint, request, jsonify, current_app

from extensions import get_db, token_required, admin_required
from services.blockchain import BlockchainService

properties_bp = Blueprint("properties", __name__, url_prefix="/api/properties")


def _row_to_dict(row) -> dict:
    d = dict(row)
    return d


# ── GET /api/properties ───────────────────────────────────────────────────────

@properties_bp.route("", methods=["GET"])
def list_properties():
    db     = get_db()
    search = request.args.get("search", "").strip()
    owner  = request.args.get("owner_id", type=int)

    query  = """
        SELECT p.*, u.username AS owner_username
        FROM   properties p
        JOIN   users u ON u.id = p.owner_id
        WHERE  1=1
    """
    params: list = []

    if search:
        query  += " AND (p.title LIKE ? OR p.location LIKE ?)"
        params += [f"%{search}%", f"%{search}%"]
    if owner:
        query  += " AND p.owner_id = ?"
        params.append(owner)

    query += " ORDER BY p.registered_at DESC"

    rows = db.execute(query, params).fetchall()
    return jsonify([_row_to_dict(r) for r in rows])


# ── POST /api/properties ──────────────────────────────────────────────────────

@properties_bp.route("", methods=["POST"])
@token_required
def create_property(current_user):
    data  = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    loc   = (data.get("location") or "").strip()
    area  = data.get("area")
    desc  = (data.get("description") or "").strip() or None

    if not title:
        return jsonify({"error": "title is required"}), 400
    if not loc:
        return jsonify({"error": "location is required"}), 400
    try:
        area = float(area)
        if area <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"error": "area must be a positive number"}), 400

    db = get_db()
    owner_id = current_user["sub"]

    # Resolve owner wallet address (needed for blockchain call)
    owner_row = db.execute(
        "SELECT wallet_address FROM users WHERE id = ?", (owner_id,)
    ).fetchone()
    wallet = owner_row["wallet_address"] if owner_row else None

    tx_hash       = None
    blockchain_id = None

    if wallet and current_app.config.get("CONTRACT_ADDRESS"):
        try:
            bc = BlockchainService.from_app(current_app)
            tx_hash, blockchain_id = bc.register_property(
                title, loc, int(area), wallet
            )
        except Exception as exc:
            current_app.logger.warning("Blockchain registration failed: %s", exc)
            # Proceed with off-chain record only

    db.execute(
        """
        INSERT INTO properties
            (title, location, area, owner_id, blockchain_id, tx_hash, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (title, loc, area, owner_id, blockchain_id, tx_hash, desc),
    )
    db.commit()

    prop = db.execute(
        """
        SELECT p.*, u.username AS owner_username
        FROM   properties p
        JOIN   users u ON u.id = p.owner_id
        WHERE  p.id = last_insert_rowid()
        """
    ).fetchone()

    return jsonify(_row_to_dict(prop)), 201


# ── GET /api/properties/<id> ──────────────────────────────────────────────────

@properties_bp.route("/<int:prop_id>", methods=["GET"])
def get_property(prop_id):
    db   = get_db()
    prop = db.execute(
        """
        SELECT p.*, u.username AS owner_username
        FROM   properties p
        JOIN   users u ON u.id = p.owner_id
        WHERE  p.id = ?
        """,
        (prop_id,),
    ).fetchone()

    if not prop:
        return jsonify({"error": "Property not found"}), 404

    result = _row_to_dict(prop)

    # Optionally pull on-chain history if blockchain is available
    if prop["blockchain_id"] and current_app.config.get("CONTRACT_ADDRESS"):
        try:
            bc = BlockchainService.from_app(current_app)
            result["chain_history"] = bc.get_transfer_history(prop["blockchain_id"])
        except Exception:
            pass

    return jsonify(result)


# ── PUT /api/properties/<id> ──────────────────────────────────────────────────

@properties_bp.route("/<int:prop_id>", methods=["PUT"])
@token_required
@admin_required
def update_property(prop_id, current_user):
    db   = get_db()
    prop = db.execute("SELECT id FROM properties WHERE id = ?", (prop_id,)).fetchone()
    if not prop:
        return jsonify({"error": "Property not found"}), 404

    data = request.get_json(silent=True) or {}
    allowed = ("description", "status")
    updates, params = [], []

    for field in allowed:
        if field in data:
            updates.append(f"{field} = ?")
            params.append(data[field])

    if not updates:
        return jsonify({"error": "Nothing to update"}), 400

    params.append(prop_id)
    db.execute(f"UPDATE properties SET {', '.join(updates)} WHERE id = ?", params)
    db.commit()

    updated = db.execute(
        "SELECT p.*, u.username AS owner_username FROM properties p JOIN users u ON u.id = p.owner_id WHERE p.id = ?",
        (prop_id,),
    ).fetchone()
    return jsonify(_row_to_dict(updated))
