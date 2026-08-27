from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func
from app import db
from app.models import User, Scan

dashboard_bp = Blueprint("dashboard", __name__)


def require_officer_or_admin():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return None, (jsonify({"error": "User not found"}), 404)
    if user.role not in ("admin", "officer", "inspector", "viewer"):
        return None, (jsonify({"error": "Access denied. Officer, admin, inspector, or viewer role required."}), 403)
    return user, None


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    try:
        user, error = require_officer_or_admin()
        if error:
            return error

        total_scans = Scan.query.count()
        compliant = Scan.query.filter_by(overall_status="compliant").count()
        non_compliant = Scan.query.filter_by(overall_status="non_compliant").count()
        partially_compliant = Scan.query.filter_by(overall_status="partially_compliant").count()
        manual_review = Scan.query.filter_by(overall_status="manual_review").count()

        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_scans = (
            Scan.query.filter(Scan.created_at >= seven_days_ago)
            .order_by(Scan.created_at.desc())
            .limit(10)
            .all()
        )

        compliance_trend = []
        for i in range(6, -1, -1):
            day = datetime.now(timezone.utc).date() - timedelta(days=i)
            day_start = datetime.combine(day, datetime.min.time()).replace(tzinfo=timezone.utc)
            day_end = day_start + timedelta(days=1)
            
            compliant_c = Scan.query.filter(Scan.created_at >= day_start, Scan.created_at < day_end, Scan.overall_status == 'compliant').count()
            non_c = Scan.query.filter(Scan.created_at >= day_start, Scan.created_at < day_end, Scan.overall_status == 'non_compliant').count()
            partial_c = Scan.query.filter(Scan.created_at >= day_start, Scan.created_at < day_end, Scan.overall_status == 'partially_compliant').count()
            review_c = Scan.query.filter(Scan.created_at >= day_start, Scan.created_at < day_end, Scan.overall_status == 'manual_review').count()
            
            compliance_trend.append({
                "date": day.strftime("%b %d"),
                "compliant": compliant_c,
                "non_compliant": non_c,
                "partial": partial_c,
                "manual_review": review_c
            })

        violation_rows = (
            db.session.query(
                Scan.compliance_result,
            )
            .filter(Scan.compliance_result.isnot(None))
            .all()
        )
        violation_counts = {}
        for (result,) in violation_rows:
            if isinstance(result, dict):
                checks = result.get("checks", [])
                for check in checks:
                    if check.get("status") == "fail":
                        rule = check.get("rule_name", "Unknown")
                        violation_counts[rule] = violation_counts.get(rule, 0) + 1

        top_violations = sorted(
            violation_counts.items(), key=lambda x: x[1], reverse=True
        )[:10]
        top_violations_list = [
            {"type": rule, "count": count} for rule, count in top_violations
        ]

        return jsonify({
            "total_scans": total_scans,
            "compliant": compliant,
            "non_compliant": non_compliant,
            "partial": partially_compliant,
            "manual_review": manual_review,
            "recent_scans": [s.to_dict() for s in recent_scans],
            "compliance_trend": compliance_trend,
            "violations_by_type": top_violations_list,
        }), 200

    except Exception as e:
        return jsonify({"error": f"Failed to fetch stats: {str(e)}"}), 500


@dashboard_bp.route("/scans", methods=["GET"])
@jwt_required()
def get_all_scans():
    try:
        user, error = require_officer_or_admin()
        if error:
            return error

        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        per_page = min(per_page, 100)

        status = request.args.get("status")
        date_from = request.args.get("date_from")
        date_to = request.args.get("date_to")
        manufacturer = request.args.get("manufacturer")

        query = Scan.query

        if status:
            query = query.filter_by(overall_status=status)
        if date_from:
            try:
                df = datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc)
                query = query.filter(Scan.created_at >= df)
            except ValueError:
                return jsonify({"error": "Invalid date_from format. Use ISO 8601."}), 400
        if date_to:
            try:
                dt = datetime.fromisoformat(date_to).replace(tzinfo=timezone.utc)
                query = query.filter(Scan.created_at <= dt)
            except ValueError:
                return jsonify({"error": "Invalid date_to format. Use ISO 8601."}), 400
        if manufacturer:
            query = query.filter(
                Scan.manufacturer.ilike(f"%{manufacturer}%")
            )

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
        return jsonify({"error": f"Failed to fetch scans: {str(e)}"}), 500
