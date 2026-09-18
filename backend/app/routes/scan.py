import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db
from app.models import User, Scan
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

        if "images" not in request.files:
            return jsonify({"error": "No image files provided"}), 400

        files = request.files.getlist("images")
        listing_url = request.form.get("listing_url")
        gtin = request.form.get("gtin")
        state = request.form.get("state")
        lat_str = request.form.get("latitude")
        lng_str = request.form.get("longitude")
        lat = float(lat_str) if lat_str else None
        lng = float(lng_str) if lng_str else None
        
        if not files or all(f.filename == "" for f in files):
            return jsonify({"error": "No files selected"}), 400

        image_paths = []
        upload_dir = current_app.config["UPLOAD_FOLDER"]
        os.makedirs(upload_dir, exist_ok=True)
        
        import mimetypes
        for file in files:
            if file and allowed_file(file.filename):
                mime_type, _ = mimetypes.guess_type(file.filename)
                if mime_type and mime_type.startswith('image/'):
                    ext = file.filename.rsplit(".", 1)[1].lower()
                    filename = secure_filename(f"{uuid.uuid4().hex}.{ext}")
                    filepath = os.path.join(upload_dir, filename)
                    file.save(filepath)
                    image_paths.append(filepath)

        if not image_paths:
            return jsonify({
                "error": f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400

        try:
            from app.services.image_grouping_service import group_images_by_product
            grouped_indices = group_images_by_product(image_paths)
        except Exception as e:
            print(f"Grouping failed: {e}")
            grouped_indices = [[i] for i in range(len(image_paths))]

        from PIL import Image
        import hashlib
        from app.services.cloudinary_service import upload_to_cloudinary
        from app.tasks import process_scan_task
        
        created_scans = []
        
        for group in grouped_indices:
            group_paths = [image_paths[i] for i in group]
            if not group_paths:
                continue

            try:
                imgs = [Image.open(p) for p in group_paths]
                target_height = 800
                resized_imgs = []
                for img in imgs:
                    w_percent = (target_height / float(img.size[1]))
                    h_size = int((float(img.size[0]) * float(w_percent)))
                    resized = img.resize((h_size, target_height), Image.Resampling.LANCZOS)
                    resized_imgs.append(resized)
                
                total_width = sum(i.size[0] for i in resized_imgs)
                max_height = max(i.size[1] for i in resized_imgs)
                
                stitched = Image.new('RGB', (total_width, max_height))
                x_offset = 0
                for img in resized_imgs:
                    stitched.paste(img, (x_offset, 0))
                    x_offset += img.size[0]
                    
                stitched_path = os.path.join(upload_dir, f"stitched_{uuid.uuid4().hex}.jpg")
                stitched.save(stitched_path, format="JPEG", quality=85)
            except Exception as e:
                print(f"Stitching failed: {e}")
                stitched_path = group_paths[0]

            try:
                with open(stitched_path, "rb") as f:
                    image_hash = hashlib.sha256(f.read()).hexdigest()
            except Exception as e:
                print(f"Hashing failed: {e}")
                image_hash = None

            cloud_url = upload_to_cloudinary(stitched_path)
            final_image_path = cloud_url if cloud_url else stitched_path

            scan = Scan(
                user_id=user_id,
                image_path=final_image_path,
                gtin=gtin if len(grouped_indices) == 1 else None, # Only apply GTIN if single product
                state=state,
                latitude=lat,
                longitude=lng,
                overall_status="processing",
                image_hash=image_hash,
            )  # type: ignore
            db.session.add(scan)
            db.session.commit()

            process_scan_task.delay(scan.id, group_paths, listing_url if len(grouped_indices) == 1 else None)
            created_scans.append(scan.to_dict())

        return jsonify({
            "message": f"Successfully queued {len(created_scans)} product scan(s).",
            "scans": created_scans,
            "scan": created_scans[0] if created_scans else None, # For backward compatibility
        }), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"error": "Upload failed due to an internal error"}), 500


from app import db, limiter

@scan_bp.route("/<int:scan_id>/status", methods=["GET"])
@jwt_required(optional=True)
@limiter.exempt
def get_scan_status(scan_id):
    try:
        scan = Scan.query.get(scan_id)
        if not scan:
            return jsonify({"error": "Scan not found"}), 404
            
        return jsonify({
            "scan_id": scan.id,
            "status": scan.overall_status,
            "scan": scan.to_dict() if scan.overall_status != "processing" else None
        }), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch status"}), 500


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
        return jsonify({"error": "Failed to fetch scan due to an internal error"}), 500


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
            os.path.abspath(report_path),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"meterolens_report_{scan_id}.pdf",
        )

    except Exception as e:
        return jsonify({"error": "Report generation failed due to an internal error"}), 500


@scan_bp.route("/gtin/<string:gtin>/risk", methods=["GET"])
@jwt_required()
def gtin_risk(gtin):
    try:
        scans = Scan.query.filter_by(gtin=gtin).all()
        if not scans:
            return jsonify({"risk_score": 0, "message": "No history found for this GTIN", "history": []}), 200

        failed_count = sum(1 for s in scans if s.overall_status == "non_compliant")
        review_count = sum(1 for s in scans if s.overall_status == "review_required")
        total = len(scans)

        # Simple heuristic for risk out of 100
        risk_score = min(100, int(((failed_count * 1.0) + (review_count * 0.5)) / total * 100))

        risk_tier = "LOW"
        if risk_score > 60:
            risk_tier = "HIGH"
        elif risk_score > 30:
            risk_tier = "MEDIUM"

        return jsonify({
            "gtin": gtin,
            "risk_score": risk_score,
            "risk_tier": risk_tier,
            "total_scans": total,
            "history": [{"scan_id": s.id, "status": s.overall_status, "date": s.created_at.isoformat()} for s in scans]
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to calculate risk due to an internal error"}), 500


@scan_bp.route("/public-upload", methods=["POST"])
def public_upload_scan():
    try:
        user = User.query.filter_by(username="anonymous_citizen").first()
        if not user:
            return jsonify({"error": "System not ready for public submissions"}), 500

        user_id = user.id

        if "images" not in request.files:
            return jsonify({"error": "No image files provided"}), 400

        files = request.files.getlist("images")
        gtin = request.form.get("gtin")
        latitude_str = request.form.get("latitude")
        longitude_str = request.form.get("longitude")

        latitude = float(latitude_str) if latitude_str else None
        longitude = float(longitude_str) if longitude_str else None
        
        if not files or all(f.filename == "" for f in files):
            return jsonify({"error": "No files selected"}), 400

        image_paths = []
        upload_dir = current_app.config["UPLOAD_FOLDER"]
        os.makedirs(upload_dir, exist_ok=True)
        
        import mimetypes
        for file in files:
            if file and allowed_file(file.filename):
                mime_type, _ = mimetypes.guess_type(file.filename)
                if mime_type and mime_type.startswith('image/'):
                    ext = file.filename.rsplit(".", 1)[1].lower()
                    filename = secure_filename(f"{uuid.uuid4().hex}.{ext}")
                    filepath = os.path.join(upload_dir, filename)
                    file.save(filepath)
                    image_paths.append(filepath)

        if not image_paths:
            return jsonify({
                "error": f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            }), 400

        try:
            from PIL import Image
            imgs = [Image.open(p) for p in image_paths]
            target_height = 800
            resized_imgs = []
            for img in imgs:
                w_percent = (target_height / float(img.size[1]))
                h_size = int((float(img.size[0]) * float(w_percent)))
                resized = img.resize((h_size, target_height), Image.Resampling.LANCZOS)
                resized_imgs.append(resized)
            
            total_width = sum(i.size[0] for i in resized_imgs)
            max_height = max(i.size[1] for i in resized_imgs)
            
            stitched = Image.new('RGB', (total_width, max_height))
            x_offset = 0
            for img in resized_imgs:
                stitched.paste(img, (x_offset, 0))
                x_offset += img.size[0]
                
            stitched_path = os.path.join(upload_dir, f"stitched_{uuid.uuid4().hex}.jpg")
            stitched.save(stitched_path, format="JPEG", quality=85)
        except Exception as e:
            print(f"Stitching failed: {e}")
            stitched_path = image_paths[0]

        import hashlib
        try:
            with open(stitched_path, "rb") as f:
                image_hash = hashlib.sha256(f.read()).hexdigest()
        except Exception as e:
            print(f"Hashing failed: {e}")
            image_hash = None

        from app.services.cloudinary_service import upload_to_cloudinary
        cloud_url = upload_to_cloudinary(stitched_path)
        final_image_path = cloud_url if cloud_url else stitched_path

        scan = Scan(
            user_id=user_id,
            image_path=final_image_path,
            gtin=gtin,
            source="citizen",
            latitude=latitude,
            longitude=longitude,
            overall_status="processing",
            image_hash=image_hash,
        )
        db.session.add(scan)
        db.session.commit()

        from app.tasks import process_scan_task
        process_scan_task.delay(scan.id, image_paths, None)

        return jsonify({
            "message": "Scan uploaded successfully. Thank you for your report.",
            "scan": scan.to_dict(),
        }), 201

    except Exception as e:
        import traceback
        traceback.print_exc()
        db.session.rollback()
        return jsonify({"error": "Upload failed due to an internal error"}), 500
