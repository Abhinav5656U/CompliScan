import os
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.notice_service import check_eligibility, generate_notice_pdf

notice_bp = Blueprint("notice", __name__)

@notice_bp.route("/eligibility/<int:scan_id>", methods=["GET"])
@jwt_required()
def get_eligibility(scan_id):
    try:
        result = check_eligibility(scan_id)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@notice_bp.route("/generate/<int:scan_id>", methods=["POST"])
@jwt_required()
def generate_notice(scan_id):
    user_id = get_jwt_identity()
    try:
        notice = generate_notice_pdf(scan_id, user_id)
        return jsonify({"message": "Notice generated successfully", "notice": notice}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to generate notice"}), 500

@notice_bp.route("/download/<filename>", methods=["GET"])
def download_notice(filename):
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "notices")
    filepath = os.path.join(upload_dir, filename)
    if os.path.exists(filepath):
        return send_file(filepath, as_attachment=True, download_name=filename)
    else:
        return jsonify({"error": "File not found"}), 404
