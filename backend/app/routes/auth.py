import re
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies
)
from app import db
from app.models import User

auth_bp = Blueprint("auth", __name__)

VALID_ROLES = ("admin", "officer", "viewer")

def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email) is not None

def is_strong_password(password):
    return len(password) >= 8

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

        # Only allow viewer role for public registration
        role = "viewer"
        
        # If an admin is creating the user (requires jwt_required but this is public endpoint, 
        # normally you'd separate admin user creation to a different endpoint)
        # We will enforce "viewer" always here to prevent mass assignment.

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
        
        response = jsonify({
            "message": "Login successful",
            "user": user.to_dict(),
        })
        
        # Set HttpOnly cookie
        set_access_cookies(response, access_token)
        return response, 200

    except Exception as e:
        return jsonify({"error": "Login failed due to an internal error"}), 500


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
