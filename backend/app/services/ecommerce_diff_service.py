import json
import os
import google.generativeai as genai
import traceback

def evaluate_compliance_diff(physical_data: dict, digital_data: dict):
    """
    Uses Gemini to perform semantic diffing between physical label data and
    digital listing data, outputting a compliance report.
    """
    try:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            print("[EcommerceDiffService] Error: GEMINI_API_KEY not found.")
            return None
            
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"""
        You are an expert Legal Metrology compliance auditor.
        You are given two JSON objects representing extracted data for a product:
        1. physical_data (Ground Truth from the physical package label)
        2. digital_data (Extracted from the E-commerce website listing)
        
        Your task is to compare them semantically and identify violations.
        A violation occurs if a mandatory field present on the physical_data is missing on the digital_data, 
        or if there is a material discrepancy (e.g., Physical MRP is 500, Digital MRP is 600 - digital cannot be higher).
        Semantic matches should be considered valid (e.g., "1kg" and "1000g", or "XYZ Corp" and "XYZ Corporation").
        
        Return ONLY valid JSON. Do not include markdown blocks like ```json.
        Schema:
        {{
            "overall_status": "COMPLIANT" | "NON_COMPLIANT",
            "fields": [
                {{
                    "field_name": "mrp",
                    "physical_value": "...",
                    "digital_value": "...",
                    "status": "MATCH" | "VIOLATION" | "MISSING_IN_DIGITAL",
                    "reason": "..."
                }},
                ... (repeat for net_quantity, manufacturer_name_address, country_of_origin, customer_care, mfg_date)
            ]
        }}
        
        Physical Data:
        {json.dumps(physical_data)}
        
        Digital Data:
        {json.dumps(digital_data)}
        """
        
        print("[EcommerceDiffService] Sending data for diffing...")
        generation_config = genai.GenerationConfig(response_mime_type="application/json")
        result = model.generate_content(prompt, generation_config=generation_config)
        
        if not result.text:
            print("[EcommerceDiffService] Gemini returned empty text.")
            return None
            
        text = result.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
            
        parsed_data = json.loads(text.strip())
        return parsed_data
        
    except Exception as e:
        print(f"[EcommerceDiffService] Diff Error: {e}")
        traceback.print_exc()
        return None
