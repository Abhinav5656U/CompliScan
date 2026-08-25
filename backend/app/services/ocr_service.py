import re

_easyocr_reader = None


def _get_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        import easyocr
        _easyocr_reader = easyocr.Reader(["en"], gpu=False)
    return _easyocr_reader


def extract_text(image_path):
    try:
        reader = _get_reader()
        results = reader.readtext(image_path)
        texts = [res[1] for res in results if res[1]]
        full_text = " ".join(texts)
        return full_text.strip()
    except Exception:
        return ""


def extract_fields_from_text(ocr_text):
    if not ocr_text:
        return {}

    fields = {}

    mrp_match = re.search(
        r"(?:MRP|M\.R\.P|m\.r\.p|Maximum Retail Price)[:\s]*(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d*)",
        ocr_text,
        re.IGNORECASE,
    )
    if mrp_match:
        fields["mrp"] = mrp_match.group(0).strip()

    qty_match = re.search(
        r"(?:Net\s*Quantity|Net\s*Wt\.?|Net\s*Wt|Qty)[:\s]*(\d+\.?\d*)\s*(g|kg|ml|l|ltr|litre|liters|gm|kgs|ms?l)\b",
        ocr_text,
        re.IGNORECASE,
    )
    if qty_match:
        fields["net_quantity"] = qty_match.group(0).strip()

    mfg_date_match = re.search(
        r"(?:Date\s*of\s*(?:Packaging|Manufacturing|Mfg\.?|Production))[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
        ocr_text,
        re.IGNORECASE,
    )
    if not mfg_date_match:
        mfg_date_match = re.search(
            r"(?:Mfg\.?\s*Date|Manufacturing\s*Date|Packed\s*on)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})",
            ocr_text,
            re.IGNORECASE,
        )
    if mfg_date_match:
        fields["manufacturing_date"] = mfg_date_match.group(0).strip()

    manufacturer_match = re.search(
        r"(?:Manufacturer|Manufactured\s*by|Marketed\s*by|Imported\s*by|Importer)[:\s]*(.{10,120}?)(?:\n|,|\.)",
        ocr_text,
        re.IGNORECASE,
    )
    if manufacturer_match:
        fields["manufacturer"] = manufacturer_match.group(0).strip()

    country_match = re.search(
        r"(?:Country\s*of\s*Origin|Origin[:\s]*(India|China|USA|UK|Germany|Japan|[A-Za-z ]+))",
        ocr_text,
        re.IGNORECASE,
    )
    if country_match:
        fields["country_of_origin"] = country_match.group(0).strip()

    return fields
