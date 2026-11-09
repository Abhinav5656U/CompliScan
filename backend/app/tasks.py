from app.celery_app import celery
from app import db
from app.models import Scan, ScanImage
from app.services.ocr_service import process_image_pipeline
from app.services.validation_service import validate_compliance
from app.services.mismatch_service import cross_check
from app.services.cloudinary_service import upload_to_cloudinary
import traceback
import os
import threading
from flask import current_app

def task_decorator(fn):
    if celery:
        return celery.task(fn)
    return fn

@task_decorator
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
        user_allergies = scan.user.allergies if scan.user else None
        user_diet = scan.user.diet_preferences if scan.user else None
        compliance_result = validate_compliance(pipeline_data, extracted_fields, user_allergies, user_diet, scan.product_category)
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


def dispatch_scan_task(scan_id, image_paths, listing_url, app=None):
    """
    Attempts to enqueue the scan processing task to Celery/Redis.
    If Celery or Redis is unavailable or raises an exception (e.g. invalid host,
    connection refused, etc.), automatically falls back to executing the task
    in a background thread inside the Flask application context.
    """
    if app is None:
        try:
            from flask import current_app
            app = current_app._get_current_object()
        except Exception:
            app = None

    enqueued = False
    redis_url = os.environ.get("REDIS_URL", "")

    # If Celery is installed and REDIS_URL is configured and not the known dead Upstash host, try Celery first
    if celery and redis_url and "liberal-thrush-176899" not in redis_url:
        try:
            # apply_async without retry to fail fast if the broker is unreachable
            process_scan_task.apply_async(
                args=[scan_id, image_paths, listing_url],
                retry=False
            )
            print(f"[Dispatcher] Successfully enqueued scan_id={scan_id} to Celery worker.")
            enqueued = True
        except Exception as e:
            print(f"[Dispatcher] Celery/Redis enqueue failed ({e}). Falling back to background thread.")

    if not enqueued:
        def _worker(flask_app, s_id, paths, url):
            if flask_app:
                with flask_app.app_context():
                    try:
                        process_scan_task(s_id, paths, url)
                    except Exception as err:
                        print(f"[Dispatcher Thread] Error processing scan_id={s_id}: {err}")
                        traceback.print_exc()
                    finally:
                        db.session.remove()
            else:
                try:
                    process_scan_task(s_id, paths, url)
                except Exception as err:
                    print(f"[Dispatcher Thread] Error processing scan_id={s_id}: {err}")
                    traceback.print_exc()
                finally:
                    db.session.remove()

        thread = threading.Thread(
            target=_worker,
            args=(app, scan_id, image_paths, listing_url),
            daemon=True
        )
        thread.start()
        print(f"[Dispatcher] Started background worker thread for scan_id={scan_id}.")

