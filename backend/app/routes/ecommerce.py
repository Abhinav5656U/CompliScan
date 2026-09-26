import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from app.services.ocr_service import extract_structured_data_gemini_vision
from app.services.scraper_service import extract_digital_listing_data
from app.services.ecommerce_diff_service import evaluate_compliance_diff

ecommerce_bp = Blueprint('ecommerce', __name__)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@ecommerce_bp.route('/api/ecommerce/analyze', methods=['POST'])
def analyze_ecommerce_listing():
    """
    Accepts an E-commerce URL and a Physical Product image.
    Extracts data from both and returns a semantic compliance diff.
    """
    url = request.form.get('url')
    if not url:
        return jsonify({'error': 'URL is required'}), 400
        
    if 'image' not in request.files:
        return jsonify({'error': 'Physical product image is required'}), 400
        
    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({'error': 'No image selected'}), 400
        
    try:
        # Save image temporarily
        filename = secure_filename(image_file.filename)
        temp_image_path = os.path.join(UPLOAD_FOLDER, f"ecommerce_temp_{filename}")
        image_file.save(temp_image_path)
        
        # 1. Get Physical Data
        from app.services.ocr_service import process_image_pipeline
        pipeline_result = process_image_pipeline([temp_image_path], scan_mode="deep")
        physical_data = pipeline_result.get("llm_extracted_data") if pipeline_result else None
        
        if not physical_data:
            return jsonify({'error': 'Failed to extract physical data from image. Please ensure image is clear.'}), 500
            
        # 2. Get Digital Data
        digital_data = extract_digital_listing_data(url)
        if not digital_data:
            return jsonify({'error': 'Failed to extract digital listing data from URL. Ensure the URL is accessible.'}), 500
            
        # 3. Diff Data
        diff_report = evaluate_compliance_diff(physical_data, digital_data)
        if not diff_report:
            return jsonify({'error': 'Failed to generate compliance diff report.'}), 500
            
        # Clean up temp file
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)
            
        return jsonify({
            'success': True,
            'url': url,
            'physical_extracted': physical_data,
            'digital_extracted': digital_data,
            'diff_report': diff_report
        })
        
    except Exception as e:
        print(f"Ecommerce Analyze Error: {e}")
        return jsonify({'error': str(e)}), 500
