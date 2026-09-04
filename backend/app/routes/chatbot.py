"""
Chatbot routes for MeteroLens
Handles multilingual chat, scan summaries, and complaint filing
"""

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.chatbot_service import ChatbotService
from app.models import db, Scan, Complaint

chatbot_bp = Blueprint('chatbot', __name__)

# Single shared instance
chatbot = ChatbotService()

# In-memory conversation store for prototype (keyed by user_id)
_conversations = {}


def _scan_to_context(scan):
    """
    Convert Scan model to dictionary for chatbot context.
    Safely parses compliance_result and checks.
    """
    violations = []
    warnings = []
    is_compliant = scan.overall_status == 'compliant' if scan.overall_status else True

    if scan.compliance_result and isinstance(scan.compliance_result, dict):
        checks = scan.compliance_result.get('checks', [])
        for c in checks:
            status = (c.get('status') or '').lower()
            rule_name = c.get('rule_name', 'Rule')
            msg = c.get('message', '')
            entry = f"{rule_name}: {msg}" if msg else rule_name

            if status in ('fail', 'violation'):
                violations.append(entry)
            elif status in ('warn', 'warning'):
                warnings.append(entry)

        if not violations and 'violations' in scan.compliance_result:
            raw_v = scan.compliance_result.get('violations', [])
            if isinstance(raw_v, list):
                violations = raw_v

        if not warnings and 'warnings' in scan.compliance_result:
            raw_w = scan.compliance_result.get('warnings', [])
            if isinstance(raw_w, list):
                warnings = raw_w

    return {
        'product_name': scan.product_name or 'Unknown Product',
        'manufacturer': scan.manufacturer or 'Unknown Manufacturer',
        'is_compliant': is_compliant,
        'overall_status': scan.overall_status or 'unknown',
        'violations': violations,
        'warnings': warnings,
        'gtin': scan.gtin,
        'state': scan.state,
        'created_at': scan.created_at.isoformat() if scan.created_at else None,
    }


# ---------------------------------------------------------------------
# GET /api/chatbot/languages
# ---------------------------------------------------------------------
@chatbot_bp.route('/languages', methods=['GET'])
def get_languages():
    return jsonify({
        'languages': [
            {'code': code, 'name': name}
            for code, name in chatbot.languages.items()
        ]
    }), 200


# ---------------------------------------------------------------------
# POST /api/chatbot/start
# ---------------------------------------------------------------------
@chatbot_bp.route('/start', methods=['POST'])
@jwt_required()
def start_chat():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    language = data.get('language', 'en')

    if language not in chatbot.languages:
        return jsonify({'error': 'Unsupported language'}), 400

    _conversations[user_id] = []

    return jsonify({
        'greeting': chatbot.get_greeting(language),
        'language': language
    }), 200


# ---------------------------------------------------------------------
# POST /api/chatbot/message
# ---------------------------------------------------------------------
@chatbot_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    message = (data.get('message') or '').strip()
    language = data.get('language', 'en')
    scan_id = data.get('scan_id')

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    scan_context = None
    if scan_id:
        try:
            scan = Scan.query.filter_by(id=int(scan_id), user_id=user_id).first()
            if scan:
                scan_context = _scan_to_context(scan)
        except (ValueError, TypeError):
            pass

    history = _conversations.get(user_id, [])

    result = chatbot.chat(
        user_message=message,
        language=language,
        conversation_history=history,
        scan_context=scan_context
    )

    history.append({'user': message, 'bot': result.get('response', '')})
    _conversations[user_id] = history[-20:]

    return jsonify(result), 200


# ---------------------------------------------------------------------
# POST /api/chatbot/summarize
# ---------------------------------------------------------------------
@chatbot_bp.route('/summarize', methods=['POST'])
@jwt_required()
def summarize_scan():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    scan_id = data.get('scan_id')
    language = data.get('language', 'en')

    if not scan_id:
        return jsonify({'error': 'scan_id is required'}), 400

    try:
        scan = Scan.query.filter_by(id=int(scan_id), user_id=user_id).first()
    except (ValueError, TypeError):
        scan = None

    if not scan:
        return jsonify({'error': 'Scan not found'}), 404

    scan_data = _scan_to_context(scan)
    summary = chatbot.summarize_scan_result(scan_data, language)

    return jsonify({
        'scan_id': scan_id,
        'language': language,
        'summary': summary,
        'is_compliant': scan_data['is_compliant'],
        'violation_count': len(scan_data['violations'])
    }), 200


# ---------------------------------------------------------------------
# POST /api/chatbot/complaint/draft
# ---------------------------------------------------------------------
@chatbot_bp.route('/complaint/draft', methods=['POST'])
@jwt_required()
def draft_complaint():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    scan_id = data.get('scan_id')
    language = data.get('language', 'en')

    if not scan_id:
        return jsonify({'error': 'scan_id is required'}), 400

    try:
        scan = Scan.query.filter_by(id=int(scan_id), user_id=user_id).first()
    except (ValueError, TypeError):
        scan = None

    if not scan:
        return jsonify({'error': 'Scan not found'}), 404

    user_details = {
        'shop_name': data.get('shop_name', ''),
        'shop_address': data.get('shop_address', ''),
        'user_phone': data.get('user_phone', '')
    }

    draft = chatbot.generate_complaint_template(
        scan_data=_scan_to_context(scan),
        user_details=user_details,
        language=language
    )

    return jsonify(draft), 200


# ---------------------------------------------------------------------
# POST /api/chatbot/complaint/submit
# ---------------------------------------------------------------------
@chatbot_bp.route('/complaint/submit', methods=['POST'])
@jwt_required()
def submit_complaint():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}

    required = ['scan_id', 'complaint_id', 'subject', 'body']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    try:
        scan_id_val = int(data['scan_id'])
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid scan_id'}), 400

    # Verify scan belongs to user
    scan = Scan.query.filter_by(id=scan_id_val, user_id=user_id).first()
    if not scan:
        return jsonify({'error': 'Scan not found'}), 404

    complaint = Complaint(
        complaint_id=data['complaint_id'],
        user_id=user_id,
        scan_id=scan_id_val,
        shop_name=data.get('shop_name', ''),
        shop_address=data.get('shop_address', ''),
        user_phone=data.get('user_phone', ''),
        subject=data['subject'],
        body=data['body'],
        language=data.get('language', 'en'),
        status='SUBMITTED',
        created_at=datetime.now(timezone.utc)
    )

    db.session.add(complaint)
    db.session.commit()

    return jsonify({
        'success': True,
        'complaint_id': complaint.complaint_id,
        'status': complaint.status,
        'message': 'Complaint submitted successfully'
    }), 201


# ---------------------------------------------------------------------
# GET /api/chatbot/complaint/my
# ---------------------------------------------------------------------
@chatbot_bp.route('/complaint/my', methods=['GET'])
@jwt_required()
def my_complaints():
    user_id = int(get_jwt_identity())
    complaints = Complaint.query.filter_by(user_id=user_id)\
                                .order_by(Complaint.created_at.desc()).all()
    return jsonify({
        'complaints': [c.to_dict() for c in complaints]
    }), 200
