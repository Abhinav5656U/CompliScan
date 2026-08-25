import re
import cv2
import numpy as np

_easyocr_reader = None

def _get_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        import easyocr
        import torch
        torch.set_num_threads(1)
        _easyocr_reader = easyocr.Reader(["en"], gpu=False, quantize=False)
    return _easyocr_reader


def extract_text(image_path):
    """
    Unified OCR interface. Currently uses EasyOCR, but can be swapped to PaddleOCR easily.
    Returns: list of dicts with text, bbox, confidence, and zone
    """
    try:
        reader = _get_reader()
        results = reader.readtext(image_path)
        extracted = []
        for bbox, text, prob in results:
            if not text:
                continue
            # Convert numpy types to python native for JSON serialization
            clean_bbox = [[float(c) for c in pt] for pt in bbox]
            extracted.append({
                "text": text,
                "bbox": clean_bbox,
                "confidence": float(prob),
                "zone": "unknown"
            })
        return extracted
    except Exception as e:
        print(f"OCR Error: {e}")
        return []

def assign_heuristic_zones(extracted_data, image_height):
    """
    Assigns 'zone' to extracted text blocks based on heuristics.
    """
    for item in extracted_data:
        text = item["text"].lower()
        y_coords = [p[1] for p in item["bbox"]]
        center_y = sum(y_coords) / len(y_coords)

        # MRP Zone heuristic
        if "mrp" in text or "₹" in text or "rs" in text or "price" in text:
            item["zone"] = "mrp_zone"
        # Consumer Care heuristic (usually bottom third)
        elif "care" in text or "helpline" in text or "email" in text or "contact" in text:
            item["zone"] = "consumer_care_zone"
        elif center_y > image_height * 0.7:
             if item["zone"] == "unknown":
                 item["zone"] = "bottom_panel"
        # Manufacturer
        elif "mfg" in text or "manufactured" in text or "marketed" in text:
            item["zone"] = "manufacturer_zone"
        # Net Quantity
        elif "net" in text or "qty" in text or "weight" in text:
            item["zone"] = "net_qty_zone"

    return extracted_data

def detect_credit_card_reference(image_path):
    """
    Detects a standard credit card (ISO 7810 ID-1: 85.6x53.98mm, aspect ratio ~1.586)
    Returns: pixels_per_mm or None
    """
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
            # The shorter side is 53.98mm, longer is 85.6mm
            if w > h:
                pixels_per_mm = w / 85.6
            else:
                pixels_per_mm = h / 85.6
            return pixels_per_mm
            
    return None

def process_image_pipeline(image_path):
    """
    Main pipeline to run OCR, apply heuristics, and find calibration.
    """
    img = cv2.imread(image_path)
    height, width = (0, 0)
    if img is not None:
        height, width, _ = img.shape
        
    raw_data = extract_text(image_path)
    zoned_data = assign_heuristic_zones(raw_data, height)
    pixels_per_mm = detect_credit_card_reference(image_path)
    
    # Calculate physical heights if calibration found
    if pixels_per_mm:
        for item in zoned_data:
            y_coords = [p[1] for p in item["bbox"]]
            pixel_height = max(y_coords) - min(y_coords)
            item["physical_height_mm"] = float(pixel_height / pixels_per_mm)
            
    # Combine text for backward compatibility during transition
    full_text = " ".join([item["text"] for item in zoned_data])
    
    return {
        "calibrated_pixels_per_mm": float(pixels_per_mm) if pixels_per_mm else None,
        "extracted_data": zoned_data,
        "full_text": full_text
    }
