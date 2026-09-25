import re
import os
import random
import redis
from flask import Blueprint, request, jsonify, make_response, current_app
from email_validator import validate_email, EmailNotValidError
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    set_access_cookies,
    unset_jwt_cookies,
    get_csrf_token
)
from app import db
from app.models import User

auth_bp = Blueprint("auth", __name__)

VALID_ROLES = ("admin", "officer", "viewer")

def get_redis_client():
    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/1")
    return redis.from_url(redis_url)

def is_valid_email(email):
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False

def is_strong_password(password):
    if len(password) < 8:
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True

@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        required_fields = ["username", "email", "password"]
        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        if not is_valid_email(data["email"]):
            return jsonify({"error": "Invalid email format"}), 400
            
        if not is_strong_password(data["password"]):
            return jsonify({"error": "Password must be at least 8 characters"}), 400

        # Prevent enumeration: generic message
        if User.query.filter_by(username=data["username"]).first() or User.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "Registration failed. Username or email may already be in use."}), 409

        role = data.get("role", "viewer")
        
        if role == "officer":
            email_domain = data["email"].lower()
            if not (email_domain.endswith("@gov.in") or email_domain.endswith("@nic.in")):
                return jsonify({"error": "Inspector accounts require a valid @gov.in or @nic.in email address."}), 400
        else:
            # Enforce viewer role for all other public registrations to prevent mass assignment
            role = "viewer"

        user = User(
            username=data["username"],
            email=data["email"],
            role=role,
            full_name=data.get("full_name"),
            badge_number=data.get("badge_number") if role != "viewer" else None,
        )
        user.set_password(data["password"])

        db.session.add(user)
        db.session.commit()

        return jsonify({
            "message": "User registered successfully",
            "user": user.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Registration failed due to an internal error"}), 500


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        if not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email and password are required"}), 400

        user = User.query.filter_by(email=data["email"]).first()
        if not user or not user.check_password(data["password"]):
            # Generic message prevents enumeration
            return jsonify({"error": "Invalid email or password"}), 401

        access_token = create_access_token(identity=str(user.id))
        try:
            csrf_token = get_csrf_token(access_token)
        except Exception:
            csrf_token = None
        
        response = jsonify({
            "message": "Login successful",
            "user": user.to_dict(),
            "csrf_token": csrf_token,
            "access_token": access_token
        })
        
        # Set HttpOnly cookie
        set_access_cookies(response, access_token)
        return response, 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Login failed: {str(e)}"}), 500


@auth_bp.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"message": "Logout successful"})
    unset_jwt_cookies(response)
    return response, 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"user": user.to_dict()}), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch user due to an internal error"}), 500


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get("email")
        if not email:
            return jsonify({"error": "Email is required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            # Prevent enumeration
            return jsonify({"message": "If an account with that email exists, an OTP has been sent."}), 200

        otp = str(random.randint(100000, 999999))
        redis_client = get_redis_client()
        redis_client.setex(f"otp:{email}", 600, otp)  # 10 minutes TTL

        from app.services.email_service import send_complaint_email # Re-using or adapting
        from email.message import EmailMessage
        import smtplib
        
        # We can write a quick inline email send or use SMTP credentials from config
        smtp_server = current_app.config.get("SMTP_SERVER")
        smtp_port = current_app.config.get("SMTP_PORT", 2525)
        smtp_user = current_app.config.get("SMTP_USER")
        smtp_password = current_app.config.get("SMTP_PASSWORD")

        if smtp_server and smtp_user:
            msg = EmailMessage()
            msg['Subject'] = "MeteroLens - Password Reset OTP"
            msg['From'] = smtp_user
            msg['To'] = email
            msg.set_content(f"Your OTP for password reset is: {otp}\nThis OTP is valid for 10 minutes.")

            if int(smtp_port) == 465:
                server = smtplib.SMTP_SSL(smtp_server, int(smtp_port))
            else:
                server = smtplib.SMTP(smtp_server, int(smtp_port))
                server.starttls()
                
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
            server.quit()
        else:
            current_app.logger.error(f"Failed to send OTP because SMTP is not configured. OTP was {otp}")

        return jsonify({"message": "If an account with that email exists, an OTP has been sent."}), 200

    except Exception as e:
        current_app.logger.error(f"Forgot password error: {e}")
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/verify-otp", methods=["POST"])
def verify_otp():
    try:
        data = request.get_json()
        email = data.get("email")
        otp = data.get("otp")

        if not email or not otp:
            return jsonify({"error": "Email and OTP are required"}), 400

        redis_client = get_redis_client()
        stored_otp = redis_client.get(f"otp:{email}")

        if not stored_otp or stored_otp.decode("utf-8") != str(otp):
            return jsonify({"error": "Invalid or expired OTP"}), 400

        return jsonify({"message": "OTP verified successfully"}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    try:
        data = request.get_json()
        email = data.get("email")
        otp = data.get("otp")
        new_password = data.get("new_password")

        if not all([email, otp, new_password]):
            return jsonify({"error": "Email, OTP, and new password are required"}), 400

        if not is_strong_password(new_password):
            return jsonify({"error": "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol"}), 400

        redis_client = get_redis_client()
        stored_otp = redis_client.get(f"otp:{email}")

        if not stored_otp or stored_otp.decode("utf-8") != str(otp):
            return jsonify({"error": "Invalid or expired OTP"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.set_password(new_password)
        db.session.commit()

        # Invalidate OTP after use
        redis_client.delete(f"otp:{email}")

        return jsonify({"message": "Password updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@auth_bp.route("/janparichay/login", methods=["GET"])
def janparichay_login():
    """Mock endpoint to initiate JanParichay SSO"""
    # In a real scenario, this would generate a SAML request or OAuth URL 
    # and redirect the user to the government SSO portal.
    # For now, we mock it by returning a mock redirect URL.
    mock_redirect_url = "http://localhost:3000/login?sso=janparichay_mock"
    return jsonify({"redirect_url": mock_redirect_url}), 200

@auth_bp.route("/janparichay/callback", methods=["POST"])
def janparichay_callback():
    """Mock endpoint to handle SSO callback from JanParichay"""
    try:
        data = request.get_json()
        if data.get("provider") != "janparichay":
            return jsonify({"error": "Invalid SSO provider"}), 400

        # MOCK DATA representing what we would decode from a JanParichay SAML response
        mock_gov_email = "officer.demo@nic.in"
        mock_full_name = "Gov Inspector Demo"
        mock_badge_number = "NIC-2026-9912"

        # Check if user already exists
        user = User.query.filter_by(email=mock_gov_email).first()
        if not user:
            # Auto-provision the user with officer role
            user = User(
                username=mock_gov_email.split("@")[0],
                email=mock_gov_email,
                role="officer",
                full_name=mock_full_name,
                badge_number=mock_badge_number,
            )
            # Create a strong random password since they use SSO
            user.set_password(os.urandom(24).hex())
            db.session.add(user)
            db.session.commit()

        # Log them in
        access_token = create_access_token(identity=str(user.id))
        try:
            csrf_token = get_csrf_token(access_token)
        except Exception:
            csrf_token = None
        
        response = jsonify({
            "message": "JanParichay SSO login successful",
            "user": user.to_dict(),
            "csrf_token": csrf_token,
            "access_token": access_token
        })
        
        set_access_cookies(response, access_token)
        return response, 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"SSO failed: {str(e)}"}), 500

from google.oauth2 import id_token
from google.auth.transport import requests

@auth_bp.route("/google", methods=["POST"])
def google_auth():
    try:
        data = request.get_json()
        token = data.get("credential")
        
        if not token:
            return jsonify({"error": "No credential provided"}), 400
            
        import requests as httpx_requests
        user_info_resp = httpx_requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if not user_info_resp.ok:
            return jsonify({"error": "Invalid Google token"}), 401
            
        idinfo = user_info_resp.json()
        
        email = idinfo['email']
        name = idinfo.get('name', '')
        
        user = User.query.filter_by(email=email).first()
        if not user:
            # Auto-register new user
            user = User(
                username=email.split("@")[0] + str(random.randint(100, 999)),
                email=email,
                role="viewer",
                full_name=name
            )
            user.set_password(os.urandom(24).hex())
            db.session.add(user)
            db.session.commit()
            
        access_token = create_access_token(identity=str(user.id))
        try:
            csrf_token = get_csrf_token(access_token)
        except Exception:
            csrf_token = None
        
        response = jsonify({
            "message": "Google Login successful",
            "user": user.to_dict(),
            "csrf_token": csrf_token,
            "access_token": access_token
        })
        
        set_access_cookies(response, access_token)
        return response, 200
        
    except ValueError as e:
        return jsonify({"error": f"Invalid token: {str(e)}"}), 401
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Google auth failed: {str(e)}"}), 500

@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    try:
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({"error": "User not found"}), 404
        data = request.get_json()
        if "allergies" in data:
            user.allergies = data["allergies"]
        if "diet_preferences" in data:
            user.diet_preferences = data["diet_preferences"]
        db.session.commit()
        return jsonify({"message": "Profile updated successfully", "user": user.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to update profile"}), 500
