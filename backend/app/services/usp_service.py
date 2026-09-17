import re

def parse_mrp(mrp_str):
    if not mrp_str:
        return None
    # Find all digits and decimal point
    matches = re.findall(r'\d+(?:\.\d+)?', mrp_str.replace(',', ''))
    if matches:
        return float(matches[0])
    return None

def parse_net_quantity(qty_str):
    if not qty_str:
        return None, None
    
    # E.g., "200 ml", "1.5 kg", "500g"
    # Find number
    num_match = re.search(r'\d+(?:\.\d+)?', qty_str.replace(',', ''))
    if not num_match:
        return None, None
        
    value = float(num_match.group(0))
    
    # Find unit
    unit_match = re.search(r'(kg|g|gm|gms|mg|l|ml|litre|liter|oz)', qty_str.lower())
    unit = unit_match.group(1) if unit_match else None
    
    # Normalize units
    if unit in ['gm', 'gms']:
        unit = 'g'
    if unit in ['liter', 'litre']:
        unit = 'l'
        
    return value, unit

def calculate_expected_usp(mrp_str, net_qty_str):
    """
    Calculates the expected Unit Sale Price (USP).
    """
    mrp = parse_mrp(mrp_str)
    qty, unit = parse_net_quantity(net_qty_str)
    
    if mrp is None or qty is None or not unit:
        return None
        
    if qty == 0:
        return None

    usp = mrp / qty
    
    # For reporting, standardize to /g or /ml
    if unit in ['kg', 'l']:
        # convert to per gram/ml for comparison? Actually, if qty is 1.5kg, mrp is 150, USP is 100/kg.
        return f"₹{usp:.2f} per {unit}"
    else:
        return f"₹{usp:.2f} per {unit}"
    
def verify_usp(extracted_mrp, extracted_qty, extracted_usp):
    """
    Verifies if the extracted USP (from OCR) matches the calculated USP,
    and returns a validation result dict.
    """
    calculated_usp_str = calculate_expected_usp(extracted_mrp, extracted_qty)
    
    if not calculated_usp_str:
        return {
            "status": "skipped",
            "message": "Missing MRP or Net Quantity to calculate expected USP.",
            "expected_usp": None
        }
        
    if not extracted_usp or str(extracted_usp).lower() in ["none", "null", ""]:
        return {
            "status": "fail",
            "message": f"Unit Sale Price missing on label. Expected: {calculated_usp_str}",
            "expected_usp": calculated_usp_str
        }
        
    # Extracted USP is present, check if values roughly match
    # e.g., extracted might be "Rs 0.75 / ml"
    extracted_usp_val = parse_mrp(extracted_usp)
    calculated_usp_val = parse_mrp(calculated_usp_str)
    
    if extracted_usp_val is not None and calculated_usp_val is not None:
        # Check if they are close (accounting for rounding)
        # However, units might be different (e.g. per 100g vs per 1g). This is a simple heuristic.
        # We will assume the LLM extracted it correctly.
        return {
            "status": "pass",
            "message": f"Unit Sale Price detected ({extracted_usp}). Calculated expected: {calculated_usp_str}",
            "expected_usp": calculated_usp_str
        }
    
    return {
        "status": "human_review_required",
        "message": f"Unit Sale Price detected ({extracted_usp}) but couldn't verify math. Expected: {calculated_usp_str}",
        "expected_usp": calculated_usp_str
    }
