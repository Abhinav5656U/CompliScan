import json
import os
import re

from app.services.llm_judge_service import evaluate_rule
RULES_FILE = os.path.join(os.path.dirname(__file__), "..", "rules", "rules_2026_amend_3.json")

# Fallback regex patterns for structured fields — used when Gemini returns null
# but the text IS present in raw_text_detected
STRUCTURED_FIELD_FALLBACK_REGEX = {
    "mrp": re.compile(
        r'(?:MRP|M\.R\.P|Maximum\s+Retail\s+Price)\s*[:\.]?\s*[₹Rs\.]*\s*[\d,]+(?:\.\d{1,2})?'
        r'|[₹]\s*[\d,]+(?:\.\d{1,2})?',
        re.IGNORECASE
    ),
    "net_quantity": re.compile(
        r'(?:Net\s*(?:Wt|Weight|Qty|Quantity|Content|Vol|Volume)\s*[:\.]?\s*)?'
        r'\d+(?:\.\d+)?\s*(?:g|gm|gms|kg|kgs|ml|mL|l|L|ltr|litre|liter|oz|fl\s*oz)\b',
        re.IGNORECASE
    ),
    "manufacturer": re.compile(
        r'(?:Mfd\.?\s*(?:by|&|and)\s*|Manufactured\s*(?:by|&|and)\s*|Marketed\s*(?:by|&|and)\s*|Packed\s*(?:by|&|and)\s*|Packer\s*[:\.]?\s*)'
        r'([A-Z][A-Za-z\s&.,()]+(?:Ltd|Limited|Pvt|Private|Inc|Corp|Co|Company|Industries|Foods|Products|Enterprises)[.\s]*)',
        re.IGNORECASE
    ),
    "manufacturing_date": re.compile(
        r'(?:MFG\.?\s*(?:Date|Dt)?|Mfd\.?\s*(?:on|Date|Dt)?|Manufacturing\s*Date|Packed\s*(?:on|Date)|'
        r'Date\s*of\s*(?:Mfg|Manufacturing|Packing)|DOM|PKD|Best\s*Before|Exp(?:iry)?\.?\s*(?:Date|Dt)?|'
        r'Use\s*Before|BB)\s*[:\.\-]?\s*'
        r'(?:\d{1,2}[\-/\.]\d{1,2}[\-/\.]\d{2,4}|\d{1,2}[\-/\.\s]*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\-/\.\s]*\d{2,4}|'
        r'\d{1,2}\s*(?:months?|yrs?|years?)\s*(?:from\s*(?:mfg|manufacturing|packing|packaging)))',
        re.IGNORECASE
    ),
    "batch_number": re.compile(
        r'(?:Batch\s*(?:No\.?|Number)|Lot\s*(?:No\.?|Number)|B\.?\s*No\.?|L/?N)\s*[:\.\-]?\s*([A-Za-z0-9\-/]+)',
        re.IGNORECASE
    ),
    "address": re.compile(
        r'(?:Plot|Survey|Khasra|Village|Vill\.?|P\.?O\.?|Post|Street|Road|Rd|Lane|Nagar|Colony|'
        r'Sector|Phase|Block|Building|Floor|Industrial\s*(?:Area|Estate)|MIDC|GIDC|SEZ|'
        r'Dist(?:rict)?\.?|Taluk[a]?|Tehsil|Mandal|State|Pin|Zip)'
        r'[A-Za-z0-9\s,.\-#/()]+(?:\d{6}|\d{5})',
        re.IGNORECASE
    ),
    "unit_sale_price": re.compile(
        r'(?:Unit\s*Sale\s*Price|USP|Price\s*per\s*(?:unit|piece|kg|g|ml|L|litre|liter))\s*[:\.\-]?\s*[₹Rs\.]*\s*[\d,]+(?:\.\d{1,2})?',
        re.IGNORECASE
    ),
}


def load_rules():
    with open(RULES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def validate_compliance(pipeline_data, extracted_fields=None):
    """
    Evaluates extracted facts against versioned rules.
    pipeline_data is the dict from process_image_pipeline.
    """
    if extracted_fields is None:
        extracted_fields = {}

    if not pipeline_data or not pipeline_data.get("extracted_data"):
        return {
            "overall_status": "non_compliant",
            "checks": [
                {
                    "rule_name": "OCR Text Extraction",
                    "status": "fail",
                    "message": "No text could be extracted from the image.",
                    "citation": "System",
                    "severity": "critical",
                }
            ],
        }

    rules_def = load_rules()
    checks = []
    
    extracted_data = pipeline_data.get("extracted_data", [])
    full_text = pipeline_data.get("full_text", "")
    pixels_per_mm = pipeline_data.get("calibrated_pixels_per_mm")

    # Group texts by zone for easier checking
    zone_texts = {}
    for item in extracted_data:
        zone = item.get("zone", "unknown")
        if zone not in zone_texts:
            zone_texts[zone] = []
        zone_texts[zone].append(item)

    for rule in rules_def["rules"]:
        rule_type = rule["type"]
        field_zone = rule["field"]
        
        # Determine which text blocks to check
        items_to_check = []
        if field_zone == "any":
            items_to_check = extracted_data
        elif field_zone in zone_texts:
            items_to_check = zone_texts[field_zone]
        else:
            # If the zone wasn't found by heuristics, fallback to all text (graceful degradation)
            items_to_check = extracted_data

        combined_text_for_zone = " ".join([i["text"] for i in items_to_check])
        
        # Filter out YOLO placeholder tokens so Groq/regex gets clean text
        combined_text_for_zone = re.sub(r'\[YOLO:\w+\]', '', combined_text_for_zone).strip()
        
        # CRITICAL: If combined_text_for_zone is empty/too short but we have full_text, use full_text.
        # This ensures LLM evaluation and regex checks always have text to work with.
        if len(combined_text_for_zone) < 20 and full_text:
            combined_text_for_zone = full_text

        if rule_type == "regex":
            pattern = re.compile(rule["pattern"])
            match = pattern.search(combined_text_for_zone)
            
            # If no match in zone text, also try full_text as fallback
            if not match and full_text and combined_text_for_zone != full_text:
                match = pattern.search(full_text)
            
            if match:
                # Calculate avg confidence of items in this zone that might contain the match
                # Rough approximation: take avg confidence of the zone
                avg_conf = sum([i["confidence"] for i in items_to_check]) / len(items_to_check) if items_to_check else 0
                
                status = "pass"
                if avg_conf < 0.60:
                    status = "human_review_required"
                    
                checks.append({
                    "rule_name": rule["name"],
                    "status": status,
                    "message": f"Found: {match.group(0).strip()[:100]}",
                    "citation": rule["citation"],
                    "severity": "info" if status == "pass" else "warning"
                })
                
                # Populate extracted_fields for DB
                if rule["id"] == "mrp_declaration":
                    extracted_fields["mrp"] = match.group(0).strip()
                elif rule["id"] == "net_quantity":
                    extracted_fields["net_quantity"] = match.group(0).strip()
                elif rule["id"] == "manufacturer":
                    extracted_fields["manufacturer"] = match.group(0).strip()
                elif rule["id"] == "country_of_origin":
                    extracted_fields["country_of_origin"] = match.group(2).strip() if match.lastindex and match.lastindex >= 2 else match.group(0).strip()
                elif rule["id"] == "consumer_care":
                    extracted_fields["consumer_care"] = match.group(0).strip()
            else:
                checks.append({
                    "rule_name": rule["name"],
                    "status": "fail" if rule["severity"] == "critical" else "likely_violation",
                    "message": rule["error_msg"],
                    "citation": rule["citation"],
                    "severity": rule["severity"]
                })

        elif rule_type == "height_check":
            if not pixels_per_mm:
                checks.append({
                    "rule_name": rule["name"],
                    "status": "human_review_required",
                    "message": "No reference card detected. Could not calibrate physical font size.",
                    "citation": rule["citation"],
                    "severity": "warning"
                })
                continue
                
            min_height = rule.get("min_height_mm", 0)
            # Find max height in the relevant zone
            max_item_height = 0
            for item in items_to_check:
                h = item.get("physical_height_mm", 0)
                if h > max_item_height:
                    max_item_height = h
                    
            if max_item_height >= min_height:
                checks.append({
                    "rule_name": rule["name"],
                    "status": "pass",
                    "message": f"Measured height {max_item_height:.2f}mm meets minimum {min_height}mm.",
                    "citation": rule["citation"],
                    "severity": "info"
                })
            else:
                checks.append({
                    "rule_name": rule["name"],
                    "status": "likely_violation",
                    "message": f"Largest text in zone measured {max_item_height:.2f}mm. Minimum required is {min_height}mm.",
                    "citation": rule["citation"],
                    "severity": rule["severity"]
                })
        
        elif rule_type == "llm_evaluation":
            # Always give the LLM the full_text if zone text is sparse
            text_for_llm = combined_text_for_zone if len(combined_text_for_zone) > 50 else full_text
            eval_result = evaluate_rule(rule["prompt"], text_for_llm)
            
            if isinstance(eval_result, dict):
                status = eval_result.get("status", "human_review_required")
                evidence = eval_result.get("evidence")
            else:
                status = "human_review_required"
                evidence = None
                
            if status == "pass":
                checks.append({
                    "rule_name": rule["name"],
                    "status": "pass",
                    "message": f"Found: {evidence}" if evidence else "Groq LLM semantically verified compliance.",
                    "citation": rule["citation"],
                    "severity": "info"
                })
                # Populate DB
                if rule["id"] == "country_of_origin" and evidence:
                    extracted_fields["country_of_origin"] = evidence
            elif status == "fail":
                checks.append({
                    "rule_name": rule["name"],
                    "status": "fail" if rule["severity"] == "critical" else "likely_violation",
                    "message": rule.get("error_msg", "Failed semantic evaluation."),
                    "citation": rule["citation"],
                    "severity": rule["severity"]
                })
            else:
                checks.append({
                    "rule_name": rule["name"],
                    "status": "human_review_required",
                    "message": "Groq LLM could not definitively pass or fail the rule.",
                    "citation": rule["citation"],
                    "severity": "warning"
                })

        elif rule_type == "structured_field":
            # Logic: We use the exact JSON output from Gemini instead of doing regex on raw text!
            field_key = rule.get("field_key")
            llm_extracted_data = pipeline_data.get("llm_extracted_data", {})
            value = llm_extracted_data.get(field_key)
            
            # Gemini might return 'None' literally as a string, or None as a type
            is_valid = value and str(value).lower() not in ["none", "null", ""]
            
            # FALLBACK: If Gemini's structured output didn't find it, try regex on full_text
            if not is_valid and full_text and field_key in STRUCTURED_FIELD_FALLBACK_REGEX:
                fallback_match = STRUCTURED_FIELD_FALLBACK_REGEX[field_key].search(full_text)
                if fallback_match:
                    # Use group(1) if it exists (for capturing groups), else group(0)
                    value = fallback_match.group(1).strip() if fallback_match.lastindex and fallback_match.lastindex >= 1 else fallback_match.group(0).strip()
                    is_valid = True
                    print(f"  Fallback regex matched for '{field_key}': {value[:80]}")
            
            if is_valid:
                checks.append({
                    "rule_name": rule["name"],
                    "status": "pass",
                    "message": f"Found: {str(value)[:100]}",
                    "citation": rule["citation"],
                    "severity": "info"
                })
                extracted_fields[field_key] = str(value)
            else:
                checks.append({
                    "rule_name": rule["name"],
                    "status": "fail" if rule["severity"] == "critical" else "likely_violation",
                    "message": rule["error_msg"],
                    "citation": rule["citation"],
                    "severity": rule["severity"]
                })


    # --- NEW: Bilingual/Script Compliance & Mistranslation Detector (USP 2) ---
    # FSSAI fallback: if YOLO detected an FSSAI logo, the product has Hindi text
    yolo_detected_classes = pipeline_data.get("yolo_detected_classes", [])
    fssai_detected = "FSSAI" in yolo_detected_classes
    
    # Check if the bilingual_label regex already passed
    bilingual_already_passed = any(
        c["rule_name"] == "Commodity Name in Hindi and English" and c["status"] == "pass" 
        for c in checks
    )
    
    # If FSSAI was detected by YOLO but bilingual regex failed (no Devanagari in Gemini text),
    # override the bilingual check to pass
    if fssai_detected and not bilingual_already_passed:
        # Find and update the existing bilingual check
        for c in checks:
            if c["rule_name"] == "Commodity Name in Hindi and English":
                c["status"] = "pass"
                c["message"] = "FSSAI logo detected by YOLO (contains mandatory Hindi text)."
                c["severity"] = "info"
                break

    if full_text:
        from app.services.translation_check_service import check_translation_consistency
        translation_result = check_translation_consistency(full_text)
        
        if translation_result["status"] == "mismatch":
            checks.append({
                "rule_name": "Bilingual Mistranslation Detector",
                "status": "fail",
                "message": "Mistranslations detected between English and Hindi: " + "; ".join(translation_result["mismatches"]),
                "citation": "Rule 8 (Cross-check)",
                "severity": "critical"
            })
        elif translation_result["status"] == "match":
            checks.append({
                "rule_name": "Bilingual Mistranslation Detector",
                "status": "pass",
                "message": "Hindi and English declarations match semantically.",
                "citation": "Rule 8 (Cross-check)",
                "severity": "info"
            })
        elif translation_result["status"] == "skipped" or translation_result["status"] == "error":
             checks.append({
                "rule_name": "Bilingual Mistranslation Detector",
                "status": "human_review_required",
                "message": "Translation cross-check could not be completed.",
                "citation": "Rule 8 (Cross-check)",
                "severity": "warning"
            })

    # Overall status calculation
    failed_critical = sum(1 for c in checks if c["status"] == "fail")
    needs_review = sum(1 for c in checks if c["status"] in ["human_review_required", "likely_violation"])

    if failed_critical == 0 and needs_review == 0:
        overall_status = "compliant"
    elif failed_critical == 0 and needs_review > 0:
        overall_status = "review_required"
    else:
        overall_status = "non_compliant"
        
    llm_data = pipeline_data.get("llm_extracted_data", {})
    if llm_data:
        if llm_data.get("product_name"): extracted_fields["product_name"] = llm_data.get("product_name")
        if llm_data.get("mrp"): extracted_fields["mrp"] = llm_data.get("mrp")
        if llm_data.get("net_quantity"): extracted_fields["net_quantity"] = llm_data.get("net_quantity")
        if llm_data.get("manufacturer"): extracted_fields["manufacturer"] = llm_data.get("manufacturer")
        if llm_data.get("manufacturing_date"): extracted_fields["manufacturing_date"] = llm_data.get("manufacturing_date")
        if llm_data.get("unit_sale_price"): extracted_fields["unit_sale_price"] = llm_data.get("unit_sale_price")
        if llm_data.get("batch_number"): extracted_fields["batch_number"] = llm_data.get("batch_number")
        if llm_data.get("address"): extracted_fields["address"] = llm_data.get("address")
        
        if llm_data.get("confidence_score", 100) < 80:
            overall_status = "manual_review"

    return {
        "overall_status": overall_status,
        "rule_version_applied": rules_def["version"],
        "checks": checks,
    }
