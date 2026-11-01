"""
Document routes
  POST /api/documents/upload          — hash & store a document  [auth]
  POST /api/documents/verify          — verify a file against stored hash  [auth]
  GET  /api/documents/property/<id>   — list documents for a property  [auth]
"""
import os
import uuid

from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

from extensions import get_db, token_required
from services.document_hash import hash_bytes, verify_bytes_against_hash
from services.blockchain import BlockchainService

documents_bp = Blueprint("documents", __name__, url_prefix="/api/documents")

ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "docx", "doc"}


def _allowed(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# ── POST /api/documents/upload ────────────────────────────────────────────────

@documents_bp.route("/upload", methods=["POST"])
@token_required
def upload_document(current_user):
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not _allowed(file.filename):
        return jsonify({"error": f"File type not allowed. Allowed: {ALLOWED_EXTENSIONS}"}), 400

    property_id = request.form.get("property_id", type=int)
    doc_type    = (request.form.get("doc_type") or "other").strip()

    if not property_id:
        return jsonify({"error": "property_id is required"}), 400

    db   = get_db()
    prop = db.execute(
        "SELECT id, blockchain_id FROM properties WHERE id = ?", (property_id,)
    ).fetchone()
    if not prop:
        return jsonify({"error": "Property not found"}), 404

    # Hash the file bytes before saving
    file_bytes  = file.read()
    sha256_hash = hash_bytes(file_bytes)

    # Save file with a unique name
    safe_name   = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    upload_dir  = current_app.config["UPLOAD_FOLDER"]
    os.makedirs(upload_dir, exist_ok=True)
    save_path   = os.path.join(upload_dir, unique_name)
    with open(save_path, "wb") as f:
        f.write(file_bytes)

    # Optionally anchor hash on-chain
    tx_hash = None
    if prop["blockchain_id"] and current_app.config.get("CONTRACT_ADDRESS"):
        try:
            bc = BlockchainService.from_app(current_app)
            tx_hash = bc.add_document_hash(prop["blockchain_id"], sha256_hash, doc_type)
        except Exception as exc:
            current_app.logger.warning("On-chain document hash failed: %s", exc)

    db.execute(
        """
        INSERT INTO documents (property_id, uploader_id, filename, doc_type, sha256_hash, tx_hash)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (property_id, current_user["sub"], unique_name, doc_type, sha256_hash, tx_hash),
    )
    db.commit()

    doc = db.execute(
        "SELECT * FROM documents WHERE id = last_insert_rowid()"
    ).fetchone()
    return jsonify(dict(doc)), 201


# ── POST /api/documents/verify ────────────────────────────────────────────────

@documents_bp.route("/verify", methods=["POST"])
@token_required
def verify_document(current_user):
    """
    Accepts a file upload and an optional document_id or sha256_hash.
    Returns whether the file matches the stored hash.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    file_bytes  = file.read()
    actual_hash = hash_bytes(file_bytes)

    # Strategy A: compare against a document_id stored in DB
    doc_id = request.form.get("document_id", type=int)
    if doc_id:
        db  = get_db()
        doc = db.execute(
            "SELECT sha256_hash FROM documents WHERE id = ?", (doc_id,)
        ).fetchone()
        if not doc:
            return jsonify({"error": "Document record not found"}), 404
        match = actual_hash.lower() == doc["sha256_hash"].lower()
        return jsonify({
            "match":       match,
            "actual_hash": actual_hash,
            "stored_hash": doc["sha256_hash"],
        })

    # Strategy B: caller provides expected hash directly
    expected = (request.form.get("expected_hash") or "").strip()
    if expected:
        match = actual_hash.lower() == expected.lower()
        return jsonify({
            "match":         match,
            "actual_hash":   actual_hash,
            "expected_hash": expected,
        })

    # No reference — just return the hash of the uploaded file
    return jsonify({"actual_hash": actual_hash})


# ── GET /api/documents/property/<id> ─────────────────────────────────────────

@documents_bp.route("/property/<int:prop_id>", methods=["GET"])
@token_required
def documents_for_property(prop_id, current_user):
    db   = get_db()
    rows = db.execute(
        """
        SELECT d.*, u.username AS uploader_username
        FROM   documents d
        JOIN   users u ON u.id = d.uploader_id
        WHERE  d.property_id = ?
        ORDER  BY d.uploaded_at DESC
        """,
        (prop_id,),
    ).fetchall()
    return jsonify([dict(r) for r in rows])
