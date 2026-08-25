import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db
from app.models import User, Scan
from app.services.ocr_service import extract_text
from app.services.validation_service import validate_compliance
from app.services.report_service import generate_pdf_report

scan_bp = Blueprint("scan", __name__)

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "tiff", "bmp", "webp"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@scan_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_scan():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        if "image" not in request.files:
            return jsonify({"error": "No image file provided"}), 400

        file = request.files["image"]
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not allowed_file(file.filename):
            return jsonify({
                "error": f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400

        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        upload_dir = current_app.config["UPLOAD_FOLDER"]
        os.makedirs(upload_dir, exist_ok=True)
        filepath = os.path.join(upload_dir, filename)
        file.save(filepath)

        ocr_text = extract_text(filepath)
        extracted_fields = {}
        compliance_result = validate_compliance(ocr_text, extracted_fields)

        product_name = extracted_fields.get("product_name", "")
        manufacturer = extracted_fields.get("manufacturer", "")

        scan = Scan(
            user_id=user_id,
            image_path=filepath,
            ocr_text=ocr_text,
            extracted_fields=extracted_fields,
            compliance_result=compliance_result,
            overall_status=compliance_result.get("overall_status", "unknown"),
            product_name=product_name,
            manufacturer=manufacturer,
        )
        db.session.add(scan)
        db.session.commit()

        return jsonify({
            "message": "Scan uploaded and processed successfully",
            "scan": scan.to_dict(),
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


@scan_bp.route("/<int:scan_id>", methods=["GET"])
@jwt_required()
def get_scan(scan_id):
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        scan = Scan.query.get(scan_id)
        if not scan:
            return jsonify({"error": "Scan not found"}), 404

        if user.role not in ("admin", "officer") and scan.user_id != user_id:
            return jsonify({"error": "Access denied"}), 403

        return jsonify({"scan": scan.to_dict()}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to fetch scan: {str(e)}"}), 500


@scan_bp.route("/<int:scan_id>/report", methods=["GET"])
@jwt_required()
def get_report(scan_id):
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        scan = Scan.query.get(scan_id)
        if not scan:
            return jsonify({"error": "Scan not found"}), 404

        if user.role not in ("admin", "officer") and scan.user_id != user_id:
            return jsonify({"error": "Access denied"}), 403

        report_path = generate_pdf_report(scan)
        if not report_path or not os.path.exists(report_path):
            return jsonify({"error": "Failed to generate report"}), 500

        return send_file(
            report_path,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"compliscan_report_{scan_id}.pdf",
        )

    except Exception as e:
        return jsonify({"error": f"Report generation failed: {str(e)}"}), 500
