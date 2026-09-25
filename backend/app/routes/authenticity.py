import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app.models import db, AuthenticityScan
from app.services.authenticity.authenticity_service import analyze_product_authenticity

authenticity_bp = Blueprint('authenticity', __name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@authenticity_bp.route('/scan', methods=['POST'])
@jwt_required()
def run_authenticity_scan():
    user_id = int(get_jwt_identity())
    
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, f"auth_{user_id}_{filename}")
    file.save(filepath)
    
    try:
        # Run the pipeline
        result = analyze_product_authenticity(filepath)
        
        # Save to DB
        scan = AuthenticityScan(
            user_id=user_id,
            image_path=filepath,
            layer_results=result['layers'],
            risk_score=result['score'],
            risk_level=result['level'],
            product_name=result['layers'].get('layer_2_ocr', {}).get('details', {}).get('product_name') if isinstance(result['layers'].get('layer_2_ocr', {}).get('details'), dict) else None,
            barcode=result['layers'].get('layer_3_barcode', {}).get('data', [{}])[0].get('data') if result['layers'].get('layer_3_barcode', {}).get('status') == 'pass' else None
        )
        db.session.add(scan)
        db.session.commit()
        
        return jsonify(scan.to_dict()), 201
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@authenticity_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    user_id = int(get_jwt_identity())
    scans = AuthenticityScan.query.filter_by(user_id=user_id).order_by(AuthenticityScan.created_at.desc()).all()
    return jsonify({'scans': [s.to_dict() for s in scans]}), 200
