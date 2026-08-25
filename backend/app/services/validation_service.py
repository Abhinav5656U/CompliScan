import re


def validate_compliance(ocr_text, extracted_fields=None):
    if not ocr_text:
        return {
            "overall_status": "non_compliant",
            "checks": [
                {
                    "rule_name": "OCR Text Extraction",
                    "status": "fail",
                    "message": "No text could be extracted from the image.",
                    "severity": "critical",
                }
            ],
        }

    checks = []

    mrp_pattern = re.compile(
        r"(?:MRP|M\.R\.P|m\.r\.p|Maximum\s*Retail\s*Price)[:\s]*(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)",
        re.IGNORECASE,
    )
    mrp_match = mrp_pattern.search(ocr_text)
    if mrp_match:
        checks.append({
            "rule_name": "MRP (Maximum Retail Price)",
            "status": "pass",
            "message": f"MRP found: {mrp_match.group(0).strip()}",
            "severity": "info",
        })
    else:
        checks.append({
            "rule_name": "MRP (Maximum Retail Price)",
            "status": "fail",
            "message": "MRP not found. Must be present in format 'Rs. X/-' or '₹X'.",
            "severity": "critical",
        })

    qty_pattern = re.compile(
        r"(?:Net\s*Quantity|Net\s*Wt\.?|Net\s*Weight|Qty\.?)[:\s]*(\d+\.?\d*)\s*(g|kg|ml|l|ltr|litre|liters|gm|kgs|ms?l)\b",
        re.IGNORECASE,
    )
    qty_match = qty_pattern.search(ocr_text)
    if qty_match:
        checks.append({
            "rule_name": "Net Quantity",
            "status": "pass",
            "message": f"Net quantity found: {qty_match.group(0).strip()}",
            "severity": "info",
        })
    else:
        checks.append({
            "rule_name": "Net Quantity",
            "status": "fail",
            "message": "Net quantity with unit (g, kg, ml, L) not found.",
            "severity": "critical",
        })

    mfr_pattern = re.compile(
        r"(?:Manufacturer|Manufactured\s*by|Marketed\s*by|Imported\s*by|Importer|Packed\s*by)[:\s]*(.{5,150}?)(?:\n|,|\.|$)",
        re.IGNORECASE,
    )
    mfr_match = mfr_pattern.search(ocr_text)
    if mfr_match:
        checks.append({
            "rule_name": "Manufacturer/Importer Name and Address",
            "status": "pass",
            "message": f"Manufacturer details found: {mfr_match.group(0).strip()[:100]}",
            "severity": "info",
        })
    else:
        checks.append({
            "rule_name": "Manufacturer/Importer Name and Address",
            "status": "fail",
            "message": "Manufacturer or importer name and address not found.",
            "severity": "critical",
        })

    date_pattern = re.compile(
        r"(?:Date\s*of\s*(?:Packaging|Manufacturing|Mfg\.?|Production)|Mfg\.?\s*Date|Manufacturing\s*Date|Packed\s*on|Best\s*before)[:\s]*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
        re.IGNORECASE,
    )
    date_match = date_pattern.search(ocr_text)
    if date_match:
        checks.append({
            "rule_name": "Date of Packaging / Manufacturing Date",
            "status": "pass",
            "message": f"Manufacturing/packaging date found: {date_match.group(0).strip()}",
            "severity": "info",
        })
    else:
        checks.append({
            "rule_name": "Date of Packaging / Manufacturing Date",
            "status": "fail",
            "message": "Date of packaging or manufacturing date not found.",
            "severity": "critical",
        })

    consumer_care_pattern = re.compile(
        r"(?:Consumer\s*Care|Customer\s*Care|Helpline|Toll[\s-]*Free|Contact\s*(?:Us|No|Number)|Email|E[\-\s]*mail)[:\s]*(.*?)(?:\n|,|\.|$)",
        re.IGNORECASE,
    )
    care_match = consumer_care_pattern.search(ocr_text)
    phone_pattern = re.compile(r"[\+]?[\d\-\s]{7,15}")
    email_pattern = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")

    if care_match:
        care_text = care_match.group(0)
        has_contact = phone_pattern.search(care_text) or email_pattern.search(care_text)
        if has_contact:
            checks.append({
                "rule_name": "Consumer Care Details",
                "status": "pass",
                "message": f"Consumer care with contact info found: {care_text.strip()[:100]}",
                "severity": "info",
            })
        else:
            checks.append({
                "rule_name": "Consumer Care Details",
                "status": "warning",
                "message": "Consumer care section found but no phone number or email detected.",
                "severity": "warning",
            })
    else:
        phone_in_text = phone_pattern.search(ocr_text)
        email_in_text = email_pattern.search(ocr_text)
        if phone_in_text or email_in_text:
            checks.append({
                "rule_name": "Consumer Care Details",
                "status": "warning",
                "message": "No explicit consumer care section, but contact info found in text.",
                "severity": "warning",
            })
        else:
            checks.append({
                "rule_name": "Consumer Care Details",
                "status": "fail",
                "message": "Consumer care details with contact information not found.",
                "severity": "critical",
            })

    origin_pattern = re.compile(
        r"(?:Country\s*of\s*Origin|Origin\s*:?\s*)([A-Za-z][A-Za-z ]{2,30})",
        re.IGNORECASE,
    )
    origin_match = origin_pattern.search(ocr_text)
    if origin_match:
        checks.append({
            "rule_name": "Country of Origin",
            "status": "pass",
            "message": f"Country of origin found: {origin_match.group(0).strip()}",
            "severity": "info",
        })
    else:
        checks.append({
            "rule_name": "Country of Origin",
            "status": "fail",
            "message": "Country of origin not found.",
            "severity": "critical",
        })

    tax_pattern = re.compile(
        r"(?:MRP\s*(?:inclusive|includes?)\s*(?:of\s*)?all\s*tax(?:es|ation)?|Inclusive\s*of\s*all\s*tax(?:es)?|Price\s*inclusive|Tax\s*inclusive)",
        re.IGNORECASE,
    )
    tax_match = tax_pattern.search(ocr_text)
    if tax_match:
        checks.append({
            "rule_name": "MRP Inclusive of All Taxes",
            "status": "pass",
            "message": f"MRP inclusive of all taxes statement found: {tax_match.group(0).strip()}",
            "severity": "info",
        })
    else:
        checks.append({
            "rule_name": "MRP Inclusive of All Taxes",
            "status": "warning",
            "message": "Statement 'MRP inclusive of all taxes' not found.",
            "severity": "warning",
        })

    lang_pattern = re.compile(
        r"[\u0900-\u097F]+",
    )
    has_hindi = bool(lang_pattern.search(ocr_text))
    has_english = bool(re.search(r"[a-zA-Z]{3,}", ocr_text))

    if has_hindi and has_english:
        checks.append({
            "rule_name": "Commodity Name in Hindi and English",
            "status": "pass",
            "message": "Text in both Hindi and English detected.",
            "severity": "info",
        })
    elif has_english:
        checks.append({
            "rule_name": "Commodity Name in Hindi and English",
            "status": "warning",
            "message": "Only English text detected. Hindi or local language text not found.",
            "severity": "warning",
        })
    else:
        checks.append({
            "rule_name": "Commodity Name in Hindi and English",
            "status": "fail",
            "message": "Unable to detect text in required languages (Hindi and English).",
            "severity": "warning",
        })

    failed_critical = sum(
        1 for c in checks
        if c["status"] == "fail" and c["severity"] == "critical"
    )
    failed_warning = sum(
        1 for c in checks
        if c["status"] == "fail" or c["status"] == "warning"
    )
    total = len(checks)

    if failed_critical == 0 and failed_warning == 0:
        overall_status = "compliant"
    elif failed_critical == 0 and failed_warning <= 2:
        overall_status = "partially_compliant"
    else:
        overall_status = "non_compliant"

    return {
        "overall_status": overall_status,
        "checks": checks,
    }
