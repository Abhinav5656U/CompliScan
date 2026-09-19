import os
import redis
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

def create_app(config_name=None):
    app = Flask(__name__)

    if config_name == "testing":
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///test.db"
        app.config["TESTING"] = True
    else:
        db_url = os.environ.get("DATABASE_URL", "sqlite:///app.db")
        if db_url.startswith("postgres://"):
            db_url = db_url.replace("postgres://", "postgresql://", 1)
        app.config["SQLALCHEMY_DATABASE_URI"] = db_url

    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # Add ProxyFix for Render/Heroku deployments
    from werkzeug.middleware.proxy_fix import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key")
    
    # Secure JWT Config
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret")
    app.config["JWT_TOKEN_LOCATION"] = ["headers", "cookies"]
    is_dev = os.environ.get("FLASK_ENV") == "development" or app.config.get("TESTING")
    app.config["JWT_COOKIE_SECURE"] = False if is_dev else True  # Must be False for HTTP in dev
    app.config["JWT_COOKIE_CSRF_PROTECT"] = not is_dev  # Disable CSRF in dev to avoid 401 on uploads
    app.config["JWT_CSRF_CHECK_FORM"] = not is_dev
    app.config["JWT_COOKIE_SAMESITE"] = "Lax" if is_dev else "None"
    
    BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    app.config["UPLOAD_FOLDER"] = os.path.join(BASE_DIR, "uploads")
    app.config["MAX_CONTENT_LENGTH"] = int(
        os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # SMTP Config
    app.config["SMTP_SERVER"] = os.getenv("SMTP_SERVER", "smtp.mailtrap.io")
    app.config["SMTP_PORT"] = os.getenv("SMTP_PORT", 2525)
    app.config["SMTP_USER"] = os.getenv("SMTP_USER", "")
    app.config["SMTP_PASSWORD"] = os.getenv("SMTP_PASSWORD", "")

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # CORS Config
    cors_origins = os.getenv("CORS_ORIGINS")
    if cors_origins == "*":
        CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    else:
        origins = cors_origins.split(",") if cors_origins else ["http://localhost:3000", "http://127.0.0.1:3000"]
        CORS(app, resources={r"/api/*": {"origins": origins}}, supports_credentials=True)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Rate Limiting
    app.config["RATELIMIT_STORAGE_URI"] = os.getenv("RATELIMIT_STORAGE_URI", "memory://")
    limiter.init_app(app)
    
    # Security Headers
    Talisman(app, content_security_policy={
        'default-src': ["'self'"],
        'img-src': ["'self'", "data:", "https://res.cloudinary.com"],
        'script-src': ["'self'"],
        'style-src': ["'self'", "'unsafe-inline'"]
    }, force_https=False if app.debug else True)

    from app.routes.auth import auth_bp
    from app.routes.scan import scan_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.history import history_bp
    from app.routes.notice import notice_bp
    from app.routes.ecommerce import ecommerce_bp
    from app.routes.report import report_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(scan_bp, url_prefix="/api/scan")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(history_bp, url_prefix="/api/history")
    app.register_blueprint(notice_bp, url_prefix="/api/notice")
    app.register_blueprint(report_bp, url_prefix="/api/report")
    app.register_blueprint(ecommerce_bp)

    try:
        from app.routes.chatbot import chatbot_bp
        app.register_blueprint(chatbot_bp, url_prefix="/api/chatbot")
    except Exception as e:
        app.logger.warning(f"Chatbot blueprint registration skipped: {e}")

    from flask import send_from_directory
    from flask_jwt_extended import jwt_required

    @app.route("/uploads/<path:filename>")
    @jwt_required()
    def serve_uploads(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    # General error handlers for security
    @app.errorhandler(500)
    def internal_server_error(e):
        return jsonify(error="Internal Server Error"), 500
        
    @app.errorhandler(404)
    def not_found_error(e):
        return jsonify(error="Not Found"), 404

    @app.errorhandler(429)
    def ratelimit_error(e):
        return jsonify(error="Rate limit exceeded", message=str(e.description)), 429

    with app.app_context():
        db.create_all()
        
        # Ensure anonymous citizen user exists
        from app.models import User
        anon = User.query.filter_by(username="anonymous_citizen").first()
        if not anon:
            import secrets
            import string
            alphabet = string.ascii_letters + string.digits
            secure_password = ''.join(secrets.choice(alphabet) for i in range(32))
            
            anon = User(
                username="anonymous_citizen",
                email="anonymous@meterolens.local",
                role="citizen",
                full_name="Anonymous Citizen"
            )
            anon.set_password(secure_password)
            db.session.add(anon)
            db.session.commit()

    return app
