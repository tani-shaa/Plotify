"""
Shared helpers that the Flask app and blueprints can import without
creating circular dependencies.
"""
import sqlite3
import functools
import jwt
from flask import g, current_app, request, jsonify


# ── Database ──────────────────────────────────────────────────────────────────

def get_db():
    """Return the per-request SQLite connection stored in Flask's g."""
    if "db" not in g:
        g.db = sqlite3.connect(
            current_app.config["DB_PATH"],
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL;")
        g.db.execute("PRAGMA foreign_keys=ON;")
    return g.db


def close_db(e=None):
    """Tear down the per-request database connection."""
    db = g.pop("db", None)
    if db is not None:
        db.close()


# ── JWT auth decorator ────────────────────────────────────────────────────────

def token_required(f):
    """
    Decorator that checks for a valid JWT Bearer token.
    Injects the decoded payload as `current_user` into the wrapped function.

    Note: PyJWT >= 2.10 requires `sub` to be a string when encoding.
    We cast it back to int here for consistency with the database.
    """
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token missing"}), 401

        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(
                token,
                current_app.config["SECRET_KEY"],
                algorithms=["HS256"],
            )
            # sub is stored as string per PyJWT 2.10+ requirement; cast back to int
            payload["sub"] = int(payload["sub"])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except (jwt.InvalidTokenError, ValueError):
            return jsonify({"error": "Invalid token"}), 401

        return f(*args, current_user=payload, **kwargs)

    return decorated


def admin_required(f):
    """
    Decorator that requires both a valid JWT AND admin role.
    Must be stacked after @token_required.
    """
    @functools.wraps(f)
    def decorated(*args, current_user=None, **kwargs):
        if current_user is None or current_user.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, current_user=current_user, **kwargs)

    return decorated
