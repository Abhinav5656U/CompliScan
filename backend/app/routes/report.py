import os
from flask import Blueprint, jsonify, send_file
from flask_jwt_extended import jwt_required
from app.models import Scan
from app.services.report_service import generate_pdf_report

report_bp = Blueprint("report", __name__)

@report_bp.route("/generate/<int:scan_id>", methods=["GET"])
@jwt_required()
def generate_report(scan_id):
    try:
        scan = Scan.query.get(scan_id)
        if not scan:
            return jsonify({"error": "Scan not found"}), 404
        
        pdf_path = generate_pdf_report(scan)
        if not pdf_path or not os.path.exists(pdf_path):
            return jsonify({"error": "Failed to generate report"}), 500
            
        return send_file(pdf_path, as_attachment=True, download_name=f"compliscan_report_{scan_id}.pdf")
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to generate report"}), 500
