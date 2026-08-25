import os
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name=None):
    app = Flask(__name__)

    if config_name == "testing":
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///test.db"
        app.config["TESTING"] = True
    else:
        app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
            "DATABASE_URL", "postgresql://postgres:password@localhost:5432/compliscan"
        )

    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret-key")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret")
    app.config["UPLOAD_FOLDER"] = os.getenv("UPLOAD_FOLDER", "./uploads")
    app.config["MAX_CONTENT_LENGTH"] = int(
        os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    CORS(app, resources={r"/api/*": {"origins": "*"}})
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    from app.routes.auth import auth_bp
    from app.routes.scan import scan_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.history import history_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(scan_bp, url_prefix="/api/scan")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(history_bp, url_prefix="/api/history")

    with app.app_context():
        db.create_all()

    return app
