import re
import cv2
import numpy as np
import os
import json
import tempfile
import google.generativeai as genai

# --- YOLOv8 Integration ---
try:
    from ultralytics import YOLO
    # Since run.py is in the backend directory, 'best.pt' is in the current working directory
    model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "best.pt")
    if os.path.exists(model_path):
        print(f"Loading YOLO model from {model_path}...")
        vision_model = YOLO(model_path)
    else:
        # Fallback to current working directory
        if os.path.exists("best.pt"):
            print("Loading YOLO model from best.pt...")
            vision_model = YOLO("best.pt")
        else:
            print("WARNING: best.pt not found. YOLO object detection will be skipped.")
            vision_model = None
except ImportError:
    print("WARNING: ultralytics not installed. YOLO object detection will be skipped.")
    vision_model = None
# -------------------------

def _get_reader():
    pass

def preprocess_image_for_ocr(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return image_path
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    denoised = cv2.fastNlMeansDenoising(enhanced, None, h=10, searchWindowSize=21, templateWindowSize=7)
    
    fd, temp_path = tempfile.mkstemp(suffix=".jpg")
    os.close(fd)
    cv2.imwrite(temp_path, denoised)
    return temp_path

def extract_structured_data_gemini_vision(image_paths):
    """
    Primary Multimodal extraction. Feeds images directly to Gemini Flash.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("WARNING: GEMINI_API_KEY not found. Skipping Gemini Vision.")
        return None
        
    genai.configure(api_key=api_key)
    
    prompt = """
You are a compliance extraction AI. Given these product packaging image crops, extract the required compliance fields.
If a field is not found, leave it as null.
Also, accurately transcribe ALL text you see on the packaging into the 'raw_text_detected' field so we can run compliance regex checks on it.

CRITICAL INSTRUCTIONS FOR raw_text_detected:
- You MUST preserve any Hindi/Devanagari script text EXACTLY as-is in Unicode (e.g., एफएसएसएआई, आलू चिप्स). Do NOT transliterate Hindi into English.
- Include ALL text visible on the packaging, including nutritional tables, addresses, barcodes, and regulatory marks.
- If you see the FSSAI logo, transcribe its text including any Devanagari characters.
- Include text like "MRP", "Rs.", "₹", tax inclusive statements, net weight, batch numbers, dates, addresses etc.
- Be extremely thorough — every single piece of text matters for compliance checking.

CRITICAL INSTRUCTIONS FOR structured fields:
- For 'mrp': Extract the full MRP string including currency symbol and any "incl. of all taxes" text nearby (e.g., "₹10/- (Incl. of all taxes)")
- For 'manufacturer': Extract the full company name (e.g., "Nestle India Limited")
- For 'address': Extract the FULL address including city, state, pin code, and country (e.g., "Plot 4, Meerut Road, Ghaziabad, UP 201003, India")
- For 'net_quantity': Include the value AND unit (e.g., "70g", "200 ml")
- For 'manufacturing_date': Any date format is fine (e.g., "MFG: 05/2026", "Best Before: 12 months from packaging")
- For 'batch_number': Any batch/lot identifier (e.g., "Batch No: A123", "L/N: 456")
- For 'unit_sale_price': Per-unit price if mentioned

Provide a 'confidence_score' from 0 to 100 representing how confident you are in the extracted values.

Return ONLY valid JSON matching this schema, without any markdown formatting:
{
  "raw_text_detected": "string containing all visible text including Hindi/Devanagari",
  "product_name": "string or null",
  "mrp": "string or null",
  "unit_sale_price": "string or null",
  "manufacturer": "string or null",
  "address": "string or null",
  "net_quantity": "string or null",
  "manufacturing_date": "string or null",
  "batch_number": "string or null",
  "confidence_score": integer
}
"""
    try:
        import PIL.Image
        imgs = [PIL.Image.open(p) for p in image_paths]
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(
                [prompt] + imgs,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json"
                ),
                request_options={"timeout": 60}
            )
        except Exception as e:
            raise e
                
        text = response.text
        if not text:
            print("Gemini returned empty response (possible safety filter).")
            return None
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        result = json.loads(text.strip())
        print(f"Gemini Vision extracted fields: {list(k for k,v in result.items() if v and str(v).lower() not in ('none','null',''))}")
        return result
    except Exception as e:
        print(f"Gemini Vision Error: {e}")
        return None

def extract_text(image_path):
    temp_path = None
    try:
        temp_path = preprocess_image_for_ocr(image_path)
        
        if not hasattr(np, 'long'):
            np.long = np.int64
        if not hasattr(np, 'ulong'):
            np.ulong = np.uint64
            
        from paddleocr import PaddleOCR
        ocr = PaddleOCR(use_textline_orientation=True, lang='devanagari')
        result = ocr.ocr(temp_path)
        extracted = []
        
        if result and result[0]:
            for line in result[0]:
                bbox = line[0]
                text_info = line[1]
                word_text = text_info[0]
                prob = text_info[1]
                
                extracted.append({
                    "text": word_text,
                    "bbox": bbox,
                    "confidence": float(prob),
                    "zone": "unknown"
                })
        return extracted
    except Exception as e:
        print(f"PaddleOCR Error: {e}")
        return []
    finally:
        if temp_path and temp_path != image_path:
            try:
                os.remove(temp_path)
            except OSError:
                pass

def extract_structured_data_llm(ocr_text):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"confidence_score": 0}
        
    genai.configure(api_key=api_key)
    
    prompt = f"""
You are a compliance extraction AI. Given the following raw OCR text from a product packaging, extract the required compliance fields.
If a field is not found, leave it as null.
Provide a 'confidence_score' from 0 to 100.

Raw OCR Text:
{ocr_text}

Return ONLY valid JSON matching this schema, without any markdown formatting:
{{
  "product_name": "string or null",
  "mrp": "string or null",
  "unit_sale_price": "string or null",
  "manufacturer": "string or null",
  "address": "string or null",
  "net_quantity": "string or null",
  "manufacturing_date": "string or null",
  "batch_number": "string or null",
  "confidence_score": integer
}}
"""
    try:
        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    response_mime_type="application/json"
                ),
                request_options={"timeout": 60}
            )
        except Exception as e:
            raise e
                
        text = response.text
        if not text:
            print("Gemini returned empty response in PaddleOCR fallback (possible safety filter).")
            return {"confidence_score": 0}
        text = text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        print(f"Gemini LLM Error: {e}")
        return {"confidence_score": 0}

def assign_heuristic_zones(extracted_data, image_height):
    # Pass 1: Text-based heuristics
    for item in extracted_data:
        text = item["text"].lower()
        y_coords = [p[1] for p in item["bbox"]]
        center_y = sum(y_coords) / len(y_coords)

        if "mrp" in text or "₹" in text or "rs" in text or "price" in text:
            item["zone"] = "mrp_zone"
        elif "care" in text or "helpline" in text or "email" in text or "contact" in text:
            item["zone"] = "consumer_care_zone"
        elif "mfg" in text or "manufactured" in text or "marketed" in text:
            item["zone"] = "manufacturer_zone"
        elif "net" in text or "qty" in text or "weight" in text:
            item["zone"] = "net_qty_zone"
        elif center_y > image_height * 0.7:
             if item.get("zone", "unknown") == "unknown":
                 item["zone"] = "bottom_panel"

    # Pass 2: Spatial proximity assignment
    for unknown_item in [item for item in extracted_data if item.get("zone", "unknown") == "unknown"]:
        unk_y_coords = [p[1] for p in unknown_item["bbox"]]
        unk_x_coords = [p[0] for p in unknown_item["bbox"]]
        unk_center_y = sum(unk_y_coords) / len(unk_y_coords)
        unk_center_x = sum(unk_x_coords) / len(unk_x_coords)
        
        best_dist = float('inf')
        best_zone = "unknown"
        
        # Find the closest known zone
        for known_item in [item for item in extracted_data if item.get("zone", "unknown") not in ("unknown", "bottom_panel")]:
            k_y_coords = [p[1] for p in known_item["bbox"]]
            k_x_coords = [p[0] for p in known_item["bbox"]]
            k_center_y = sum(k_y_coords) / len(k_y_coords)
            k_center_x = sum(k_x_coords) / len(k_x_coords)
            
            # Simple Euclidean distance
            dist = ((unk_center_x - k_center_x) ** 2 + (unk_center_y - k_center_y) ** 2) ** 0.5
            
            if dist < best_dist and dist < (image_height * 0.15):
                best_dist = dist
                best_zone = known_item["zone"]
                
        if best_zone != "unknown":
            unknown_item["zone"] = best_zone

    return extracted_data

def detect_credit_card_reference(image_path):
    img = cv2.imread(image_path)
    if img is None:
        return None
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    target_ratio = 1.586
    tolerance = 0.20
    
    for cnt in contours:
        if cv2.contourArea(cnt) < 2000:
            continue
            
        x, y, w, h = cv2.boundingRect(cnt)
        ratio = max(w, h) / min(w, h)
        
        if abs(ratio - target_ratio) <= tolerance:
            if w > h:
                pixels_per_mm = w / 85.6
            else:
                pixels_per_mm = h / 85.6
            return pixels_per_mm
            
    return None

# Maps YOLO model class names to validation engine zone names
YOLO_CLASS_TO_ZONE = {
    "MRP": "mrp_zone",
    "FSSAI": "fssai_zone",
}

def process_image_pipeline(image_paths):
    # Hardcoding to the user's calibrated pipeline ratio to prevent random 
    # rectangles on the packaging from being falsely detected as credit cards.
    pixels_per_mm = 1 / 0.033 
    
    cropped_paths = []
    yolo_zoned_data = []
    yolo_detected_classes = set()  # Track which classes YOLO found
    
    # 1. Run YOLO to isolate critical regions (MRP, FSSAI)
    if vision_model is not None:
        try:
            for path in image_paths:
                img = cv2.imread(path)
                if img is None: continue
                
                results = vision_model(img)
                for result in results:
                    for box in result.boxes:
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])
                        class_name = vision_model.names[cls_id] if hasattr(vision_model, 'names') else str(cls_id)
                        yolo_detected_classes.add(class_name.upper())
                        
                        # Crop the detected region
                        cropped = img[y1:y2, x1:x2]
                        fd, temp_path = tempfile.mkstemp(suffix=".jpg")
                        os.close(fd)
                        cv2.imwrite(temp_path, cropped)
                        cropped_paths.append(temp_path)
                        
                        # Map YOLO class name to validation zone
                        zone_name = YOLO_CLASS_TO_ZONE.get(class_name.upper(), f"{class_name.lower()}_zone")
                        
                        # Calculate physical height
                        pixel_height = y2 - y1
                        physical_h = float(pixel_height / pixels_per_mm)
                        
                        # Add to zoned data for validation_service
                        zone_item = {
                            "text": f"[YOLO:{class_name.upper()}]",
                            "bbox": [[x1, y1], [x2, y1], [x2, y2], [x1, y2]],
                            "confidence": conf,
                            "zone": zone_name,
                            "physical_height_mm": physical_h
                        }
                            
                        yolo_zoned_data.append(zone_item)
                        print(f"Detected {class_name} with confidence {conf:.2f}. Physical height: {physical_h:.2f} mm")
        except Exception as e:
            print(f"YOLO Inference Error: {e}")

    # Send BOTH original images (for full context) AND crops (for precision on tiny text) to Gemini
    images_to_process = image_paths + cropped_paths
    
    # 2. Extract Text via Gemini Flash on the highly relevant cropped regions
    llm_data = extract_structured_data_gemini_vision(images_to_process)
    
    # Cleanup temp crops
    for p in cropped_paths:
        try:
            os.remove(p)
        except OSError:
            pass

    # Success Path with Gemini — only if we got meaningful raw text
    if llm_data and llm_data.get("raw_text_detected") and len(llm_data["raw_text_detected"].strip()) > 20:
        print("Successfully extracted using Gemini Vision!")
        full_text = llm_data["raw_text_detected"]
        print(f"Extracted text length: {len(full_text)} chars")
        print(f"First 200 chars: {full_text[:200]}")
        
        # Compute max physical height per zone from actual YOLO detections
        zone_max_heights = {}
        for item in yolo_zoned_data:
            z = item.get("zone", "unknown")
            h = item.get("physical_height_mm", 0.0)
            if z not in zone_max_heights or h > zone_max_heights[z]:
                zone_max_heights[z] = h
        
        # Inject the full text into all zones so the Validation Engine RegEx can find everything
        # Carry forward the real YOLO physical height for each zone
        for zone_name in ["any", "mrp_zone", "manufacturer_zone", "net_qty_zone", "consumer_care_zone"]:
            yolo_zoned_data.append({
                "text": full_text,
                "bbox": [[0,0],[10,0],[10,10],[0,10]],
                "confidence": 1.0,
                "zone": zone_name,
                "physical_height_mm": zone_max_heights.get(zone_name, 0.0)
            })
            
        return {
            "calibrated_pixels_per_mm": float(pixels_per_mm),
            "extracted_data": yolo_zoned_data,
            "full_text": full_text,
            "llm_extracted_data": llm_data,
            "yolo_detected_classes": list(yolo_detected_classes)
        }
        
    print("Falling back to PaddleOCR pipeline...")
    img = cv2.imread(image_paths[0])
    height, width = (0, 0)
    if img is not None:
        height, width, _ = img.shape
        
    all_raw_data = []
    # If Gemini fails, use PaddleOCR on the entire images
    for path in image_paths:
        all_raw_data.extend(extract_text(path))
        
    zoned_data = assign_heuristic_zones(all_raw_data, height)
    
    if pixels_per_mm:
        for item in zoned_data:
            y_coords = [p[1] for p in item["bbox"]]
            pixel_height = max(y_coords) - min(y_coords)
            item["physical_height_mm"] = float(pixel_height / pixels_per_mm)
            
    # Combine YOLO zones with PaddleOCR heuristic zones
    zoned_data.extend(yolo_zoned_data)
            
    sorted_data = sorted(zoned_data, key=lambda item: sum(p[1] for p in item["bbox"])/4.0)
    lines = []
    current_line = []
    last_y = -1
    
    for item in sorted_data:
        y_center = sum(p[1] for p in item["bbox"])/4.0
        if last_y != -1 and abs(y_center - last_y) < 15:
            current_line.append(item)
        else:
            if current_line:
                current_line.sort(key=lambda i: sum(p[0] for p in i["bbox"])/4.0)
                lines.append(" ".join(i["text"] for i in current_line))
            current_line = [item]
            last_y = y_center
            
    if current_line:
        current_line.sort(key=lambda i: sum(p[0] for p in i["bbox"])/4.0)
        lines.append(" ".join(i["text"] for i in current_line))
        
    full_text = "\n".join(lines)
    llm_extracted_data = extract_structured_data_llm(full_text)
    
    return {
        "calibrated_pixels_per_mm": float(pixels_per_mm) if pixels_per_mm else None,
        "extracted_data": zoned_data,
        "full_text": full_text,
        "llm_extracted_data": llm_extracted_data
    }
