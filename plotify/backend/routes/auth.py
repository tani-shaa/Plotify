"""
Authentication routes
  POST /api/auth/register  — create a new user account
  POST /api/auth/login     — verify credentials, return JWT
  GET  /api/auth/me        — return current user info (requires token)
"""
import datetime

import jwt
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash

from extensions import get_db, token_required

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _make_token(user_id: int, username: str, role: str) -> str:
    payload = {
        "sub":      str(user_id),   # PyJWT 2.10+ requires sub to be a string
        "username": username,
        "role":     role,
        "iat":      datetime.datetime.utcnow(),
        "exp":      datetime.datetime.utcnow() + datetime.timedelta(
            hours=current_app.config["JWT_EXPIRY_HOURS"]
        ),
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


# ── POST /api/auth/register ───────────────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    username       = (data.get("username") or "").strip()
    password       = data.get("password", "")
    wallet_address = (data.get("wallet_address") or "").strip() or None

    if not username or len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    db = get_db()
    if db.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone():
        return jsonify({"error": "Username already taken"}), 409

    db.execute(
        "INSERT INTO users (username, password_hash, role, wallet_address) VALUES (?,?,?,?)",
        (username, generate_password_hash(password), "user", wallet_address),
    )
    db.commit()

    user = db.execute(
        "SELECT id, username, role FROM users WHERE username = ?", (username,)
    ).fetchone()

    token = _make_token(user["id"], user["username"], user["role"])
    return jsonify({"token": token, "user": dict(user)}), 201


# ── POST /api/auth/login ──────────────────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password", "")

    db   = get_db()
    user = db.execute(
        "SELECT id, username, password_hash, role FROM users WHERE username = ?",
        (username,),
    ).fetchone()

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid username or password"}), 401

    token = _make_token(user["id"], user["username"], user["role"])
    return jsonify({
        "token": token,
        "user": {
            "id":       user["id"],
            "username": user["username"],
            "role":     user["role"],
        },
    })


# ── GET /api/auth/me ──────────────────────────────────────────────────────────

@auth_bp.route("/me", methods=["GET"])
@token_required
def me(current_user):
    db   = get_db()
    user = db.execute(
        "SELECT id, username, role, wallet_address, created_at FROM users WHERE id = ?",
        (current_user["sub"],),
    ).fetchone()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(dict(user))
