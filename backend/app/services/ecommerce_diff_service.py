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
        import os
        from groq import Groq
        import google.generativeai as genai
        
        prompt = f"""
        You are an expert Legal Metrology compliance auditor.
        You are given two JSON objects representing extracted data for a product:
        1. physical_data (Ground Truth from the physical package label)
        2. digital_data (Extracted from the E-commerce website listing)
        
        Your task is to compare them semantically and identify violations.
        A violation occurs if a mandatory field present on the physical_data is missing on the digital_data, 
        or if there is a material discrepancy (e.g., Physical MRP is 500, Digital MRP is 600 - digital cannot be higher).
        Semantic matches should be considered valid (e.g., "1kg" and "1000g", or "XYZ Corp" and "XYZ Corporation").
        
        IMPORTANT: Your output MUST contain an entry in the 'fields' array for EVERY SINGLE mandatory field extracted from the physical or digital data, including (but not limited to): mrp, net_quantity, manufacturer_name_address, country_of_origin, customer_care, mfg_date, ingredients, product_name.
        
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
                {{
                    "field_name": "net_quantity",
                    "physical_value": "...",
                    "digital_value": "...",
                    "status": "MATCH" | "VIOLATION" | "MISSING_IN_DIGITAL",
                    "reason": "..."
                }}
            ]
        }}
        
        Physical Data:
        {json.dumps(physical_data)}
        
        Digital Data:
        {json.dumps(digital_data)}
        """
        
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        if gemini_api_key:
            try:
                print("[EcommerceDiffService] Sending data for diffing to Gemini...")
                genai.configure(api_key=gemini_api_key)
                model = genai.GenerativeModel("gemini-2.5-flash")
                generation_config = genai.GenerationConfig(response_mime_type="application/json")
                result = model.generate_content(prompt, generation_config=generation_config, request_options={"timeout": 30})
                if result.text:
                    text = result.text.strip()
                    if text.startswith("```json"): text = text[7:]
                    if text.startswith("```"): text = text[3:]
                    if text.endswith("```"): text = text[:-3]
                    parsed_data = json.loads(text.strip())
                    return parsed_data
            except Exception as e:
                print(f"[EcommerceDiffService] Gemini failed ({e}), falling back to Groq...")
                
        groq_api_key = os.environ.get("GROQ_API_KEY")
        if groq_api_key:
            try:
                print("[EcommerceDiffService] Sending data for diffing to Groq...")
                client = Groq(api_key=groq_api_key)
                chat_completion = client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model="qwen/qwen3.8-27b",
                    temperature=0,
                    max_tokens=800,
                    response_format={"type": "json_object"},
                    timeout=30
                )
                response_text = chat_completion.choices[0].message.content.strip()
                parsed_data = json.loads(response_text)
                return parsed_data
            except Exception as e:
                print(f"[EcommerceDiffService] Groq failed ({e})")
                
        print("[EcommerceDiffService] All extractors failed.")
        return None
        
    except Exception as e:
        print(f"[EcommerceDiffService] Diff Error: {e}")
        traceback.print_exc()
        return None
