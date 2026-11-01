"""
Plotify Flask application factory.
"""
from flask import Flask
from flask_cors import CORS

from config import Config
from extensions import close_db
from models.database import init_db


def create_app(config_class=Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ── Database setup ────────────────────────────────────────────────────────
    app.teardown_appcontext(close_db)
    init_db(app)

    # ── Blueprints ────────────────────────────────────────────────────────────
    from routes.auth       import auth_bp
    from routes.properties import properties_bp
    from routes.transfers  import transfers_bp
    from routes.documents  import documents_bp
    from routes.insights   import insights_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(properties_bp)
    app.register_blueprint(transfers_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(insights_bp)

    # ── Health check ──────────────────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        from flask import jsonify
        return jsonify({"status": "ok", "app": "Plotify"})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
