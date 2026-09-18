from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Scan

history_bp = Blueprint("history", __name__)


@history_bp.route("", methods=["GET"])
@jwt_required()
def get_history():
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        per_page = min(per_page, 100)
        q = request.args.get("q", "").strip()

        query = Scan.query.filter_by(user_id=user_id)
        
        if q:
            from sqlalchemy import cast, String, func
            
            search_vector_name = func.to_tsvector('english', func.coalesce(Scan.product_name, ''))
            search_vector_json = func.to_tsvector('english', func.coalesce(cast(Scan.extracted_fields, String), ''))
            ts_query = func.plainto_tsquery('english', q)
            
            filters = [
                Scan.product_name.ilike(f"%{q}%"),
                cast(Scan.extracted_fields, String).ilike(f"%{q}%"),
                search_vector_name.op('@@')(ts_query),
                search_vector_json.op('@@')(ts_query)
            ]
            
            if q.isdigit():
                filters.append(Scan.id == int(q))
            query = query.filter(db.or_(*filters))

        query = query.order_by(Scan.created_at.desc())
        pagination = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            "scans": [s.to_dict() for s in pagination.items],
            "pagination": {
                "page": pagination.page,
                "per_page": pagination.per_page,
                "total_pages": pagination.pages,
                "total_items": pagination.total,
            }
        }), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch history due to an internal error"}), 500


@history_bp.route("/<int:scan_id>", methods=["DELETE"])
@jwt_required()
def delete_scan(scan_id):
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        scan = Scan.query.get(scan_id)
        if not scan:
            return jsonify({"error": "Scan not found"}), 404

        if scan.user_id != user_id and user.role != "admin":
            return jsonify({"error": "Access denied. You can only delete your own scans."}), 403

        db.session.delete(scan)
        db.session.commit()

        return jsonify({"message": "Scan deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete scan due to an internal error"}), 500
