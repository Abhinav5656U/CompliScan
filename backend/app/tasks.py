from app.celery_app import celery
from app import db
from app.models import Scan, ScanImage
from app.services.ocr_service import process_image_pipeline
from app.services.validation_service import validate_compliance
from app.services.mismatch_service import cross_check
from app.services.cloudinary_service import upload_to_cloudinary
import traceback
import os
from flask import current_app

@celery.task
def process_scan_task(scan_id, image_paths, listing_url):
    try:
        scan = Scan.query.get(scan_id)
        if not scan:
            return "Scan not found"
            
        uploaded_urls = []
        for path in image_paths:
            cloud_url = upload_to_cloudinary(path)
            final_url = cloud_url if cloud_url else path
            uploaded_urls.append(final_url)
            
            scan_img = ScanImage(scan_id=scan.id, image_url=final_url)
            db.session.add(scan_img)
            
        if scan.image_path == "processing" and uploaded_urls:
            scan.image_path = uploaded_urls[0]
            
        db.session.commit()
            
        pipeline_data = process_image_pipeline(image_paths, scan_mode=scan.scan_mode)
        extracted_fields = {}
        compliance_result = validate_compliance(pipeline_data, extracted_fields)
        ocr_text = pipeline_data.get("full_text", "")
        mismatch_result = cross_check(listing_url, extracted_fields) if listing_url else None
        
        product_name = extracted_fields.get("product_name", "")
        manufacturer = extracted_fields.get("manufacturer", "")

        scan.ocr_text = ocr_text
        scan.extracted_fields = extracted_fields
        scan.compliance_result = compliance_result
        scan.mismatch_result = mismatch_result
        scan.overall_status = compliance_result.get("overall_status", "unknown")
        scan.product_name = product_name
        scan.manufacturer = manufacturer
        
        db.session.commit()
        return "Success"
    except Exception as e:
        traceback.print_exc()
        db.session.rollback()
        scan = Scan.query.get(scan_id)
        if scan:
            scan.overall_status = "error"
            db.session.commit()
        return str(e)
