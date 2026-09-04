"""
Chatbot routes for MeteroLens
Handles multilingual chat, scan summaries, and complaint filing
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from app.services.chatbot_service import ChatbotService
from app.models import db, Scan, Complaint   # Complaint model added in Step 5

chatbot_bp = Blueprint('chatbot', __name__)

# Single shared instance (Gemini client is reused)
chatbot = ChatbotService()

# In-memory conversation store for the prototype.
# Key = user_id, Value = list of {'user': ..., 'bot': ...}
# (Move this to DB/Redis later if needed)
_conversations = {}


# ---------------------------------------------------------------------
# GET /api/chatbot/languages  -> list supported languages
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
# POST /api/chatbot/start  -> greeting in chosen language
# body: { "language": "hi" }
# ---------------------------------------------------------------------
@chatbot_bp.route('/start', methods=['POST'])
@jwt_required()
def start_chat():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    language = data.get('language', 'en')

    if language not in chatbot.languages:
        return jsonify({'error': 'Unsupported language'}), 400

    # reset conversation for this user
    _conversations[user_id] = []

    return jsonify({
        'greeting': chatbot.get_greeting(language),
        'language': language
    }), 200


# ---------------------------------------------------------------------
# POST /api/chatbot/message  -> send a chat message
# body: { "message": "...", "language": "en", "scan_id": 12 (optional) }
# ---------------------------------------------------------------------
@chatbot_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    message = (data.get('message') or '').strip()
    language = data.get('language', 'en')
    scan_id = data.get('scan_id')

    if not message:
        return jsonify({'error': 'Message is required'}), 400

    # Optional: give the bot context about a specific scan
    scan_context = None
    if scan_id:
        scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()
        if scan:
            scan_context = _scan_to_context(scan)

    history = _conversations.get(user_id, [])

    result = chatbot.chat(
        user_message=message,
        language=language,
        conversation_history=history,
        scan_context=scan_context
    )

    # save to history (keep last 20 turns)
    history.append({'user': message, 'bot': result['response']})
    _conversations[user_id] = history[-20:]

    return jsonify(result), 200


# ---------------------------------------------------------------------
# POST /api/chatbot/summarize  -> plain-language summary of a scan
# body: { "scan_id": 12, "language": "hi" }
# ---------------------------------------------------------------------
@chatbot_bp.route('/summarize', methods=['POST'])
@jwt_required()
def summarize_scan():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    scan_id = data.get('scan_id')
    language = data.get('language', 'en')

    if not scan_id:
        return jsonify({'error': 'scan_id is required'}), 400

    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()
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
# POST /api/chatbot/complaint/draft  -> generate complaint text
# body: { "scan_id": 12, "language": "en",
#         "shop_name": "...", "shop_address": "...", "user_phone": "..." }
# ---------------------------------------------------------------------
@chatbot_bp.route('/complaint/draft', methods=['POST'])
@jwt_required()
def draft_complaint():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    scan_id = data.get('scan_id')
    language = data.get('language', 'en')

    if not scan_id:
        return jsonify({'error': 'scan_id is required'}), 400

    scan = Scan.query.filter_by(id=scan_id, user_id=user_id).first()
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
# POST /api/chatbot/complaint/submit  -> save complaint to DB
# body: { "scan_id", "complaint_id", "subject", "body", "language",
#         "shop_name", "shop_address", "user_phone" }
# ---------------------------------------------------------------------
@chatbot_bp.route('/complaint/submit', methods=['POST'])
@jwt_required()
def submit_complaint():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    required = ['scan_id', 'complaint_id', 'subject', 'body']
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    complaint = Complaint(
        complaint_id=data['complaint_id'],
        user_id=user_id,
        scan_id=data['scan_id'],
        shop_name=data.get('shop_name', ''),
        shop_address=data.get('shop_address', ''),
        user_phone=data.get('user_phone', ''),
        subject=data['subject'],
        body=data['body'],
        language=data.get('language', 'en'),
        status='SUBMITTED',
        created_at=datetime.utcnow()
    )

    db.session.add(complaint)
    db.session.commit()

    # TODO (later step): send email to Legal Metrology dept here

    return jsonify({
        'success': True,
        'complaint_id': complaint.complaint_id,
        'status': complaint.status,
        'message': 'Complaint submitted successfully'
    }), 201


# ---------------------------------------------------------------------
# GET /api/chatbot/complaint/my  -> list user's complaints
# ---------------------------------------------------------------------
@chatbot_bp.route('/complaint/my', methods=['GET'])
@jwt_required()
def my_complaints():
    user_id = get_jwt_identity()
    complaints = Complaint.query.filter_by(user_id=user_id)\
                                .order_by(Complaint.created_at.desc()).all()
    return jsonify({
        'complaints': [c.to_dict() for c in complaints]
    }), 200


# ---------------------------------------------------------------------
# Helper: convert your Scan model -> dict the chatbot understands
# ADJUST THE FIELD NAMES to match your actual Scan model in models.py
# ---------------------------------------------------------------------
# ---------------------------------------------------------------------
# Helper: convert your Scan model -> dict the chatbot understands
# ---------------------------------------------------------------------
def _scan_to_context(scan):
    """
    Convert Scan model to dictionary for chatbot context
    Matches your actual Scan model structure
    """
    # Extract violations from compliance_result JSON
    violations = []
    warnings = []
    is_compliant = True
    
    if scan.compliance_result:
        # Your compliance_result structure (adjust if different)
        violations = scan.compliance_result.get('violations', [])
        warnings = scan.compliance_result.get('warnings', [])
        is_compliant = scan.overall_status == 'compliant' if scan.overall_status else True
    
    return {
        'product_name': scan.product_name or 'Unknown Product',
        'manufacturer': scan.manufacturer or 'Unknown Manufacturer',
        'is_compliant': is_compliant,
        'overall_status': scan.overall_status,
        'violations': violations,
        'warnings': warnings,
        'gtin': scan.gtin,
        'state': scan.state,
        'created_at': scan.created_at.isoformat()
    }