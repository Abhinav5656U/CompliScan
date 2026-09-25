import cv2
import json
import os
from groq import Groq
from app.services.ocr_service import extract_structured_data_gemini_vision
from app.services.authenticity.barcode_service import decode_barcode

def calculate_risk(layer_results):
    score = 0
    
    # Layer 1: Image Quality
    if layer_results.get("layer_1_quality", {}).get("status") == "fail":
        score += 30
        
    # Layer 3: Barcode
    barcode_res = layer_results.get("layer_3_barcode", {})
    if barcode_res.get("status") == "fail":
        score += 30
    elif barcode_res.get("status") == "mismatch":
        score += 25
        
    # Layer 4: Semantic / Cross-Modal
    semantic = layer_results.get("layer_4_semantic", {})
    if semantic.get("status") == "fail":
        score += 35
        
    if score <= 20:
        return score, "LOW"
    elif score <= 50:
        return score, "MEDIUM"
    elif score <= 75:
        return score, "HIGH"
    else:
        return score, "CRITICAL"

def check_image_quality(image_path):
    # Layer 1
    try:
        img = cv2.imread(image_path)
        if img is None:
            return {"status": "fail", "details": "Could not read image."}
        
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        fm = cv2.Laplacian(gray, cv2.CV_64F).var()
        
        if fm < 100:
            return {"status": "fail", "details": f"Image is too blurry (focus measure {fm:.2f}). Please capture a clearer image."}
        return {"status": "pass", "details": f"Image quality is good (focus measure {fm:.2f})."}
    except Exception as e:
        return {"status": "error", "details": str(e)}

def evaluate_semantic_consistency(ocr_data, barcode_data):
    # Layer 7 style LLM check
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return {"status": "pass", "details": "No LLM key for consistency check."}

    prompt = f"""
    You are an AI Authenticity Risk Assessor.
    Compare the data printed on the package (OCR) with the decoded barcode/QR data.
    
    OCR Data: {ocr_data}
    Barcode Data: {barcode_data}
    
    Determine if there is a mismatch indicating forgery.
    
    Return ONLY JSON:
    {{
        "status": "pass" | "fail",
        "evidence": "string explaining the mismatch if any"
    }}
    """
    
    try:
        client = Groq(api_key=api_key)
        chat_completion = client.chat.completions.create(
            messages=[{"role": "system", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0,
            max_tokens=300,
            response_format={"type": "json_object"},
            timeout=15
        )
        
        res = json.loads(chat_completion.choices[0].message.content.strip())
        return {"status": res.get("status", "pass"), "details": res.get("evidence", "Consistent")}
    except Exception as e:
        return {"status": "error", "details": str(e)}

def analyze_product_authenticity(image_path):
    layer_results = {}
    
    # 1. Quality
    layer_results["layer_1_quality"] = check_image_quality(image_path)
    
    # 2. OCR (we use gemini)
    ocr_result = extract_structured_data_gemini_vision([image_path])
    layer_results["layer_2_ocr"] = {
        "status": "pass" if ocr_result else "fail",
        "details": ocr_result if ocr_result else "Failed to extract text."
    }
    
    # 3. Barcode / QR
    barcode_result = decode_barcode(image_path)
    if not barcode_result:
        layer_results["layer_3_barcode"] = {"status": "fail", "details": "No barcode detected or decoding failed."}
    else:
        layer_results["layer_3_barcode"] = {"status": "pass", "details": f"Decoded {len(barcode_result)} barcodes.", "data": barcode_result}
    
    # 4. Semantic / LLM Cross Modal
    layer_results["layer_4_semantic"] = evaluate_semantic_consistency(
        ocr_result,
        barcode_result
    )
    
    score, level = calculate_risk(layer_results)
    
    return {
        "score": score,
        "level": level,
        "layers": layer_results
    }
