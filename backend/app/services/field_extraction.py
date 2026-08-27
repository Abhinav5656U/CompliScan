"""
Field extraction from zoned OCR text.

Takes the output of process_image_pipeline (a dict with "extracted_data" and
"full_text") plus the loaded rule definitions, and populates a flat
extracted_fields dict with the standard label facts:

    product_name, manufacturer, mrp, net_quantity,
    country_of_origin, consumer_care, mfg_date

The rule regex patterns from rules_2026_amend_3.json are reused as the single
source of truth for the fields the rule engine also checks, so the extracted
facts and the compliance checks stay in sync.
"""
import re


# Regexes for facts that post-date or are not matched by the rule engine.
_MFG_DATE_PATTERNS = [
    re.compile(
        r"(?i)(?:mfg(?:\.|\s+date)?|manufactured(?:\s+date)?|date\s+of\s+"
        r"manufactur(?:e|ing))\s*[:.\-]?\s*(?:dt\.?\s*)?"
        r"(?P<date>\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}|\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2})"
    ),
    re.compile(r"(?i)manufactured\s+(?:on\s+)?(?P<date>\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4})"),
    re.compile(r"\b(?P<date>(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})\b"),
]

# Keywords that indicate a line is metadata rather than the brand/product name.
_METADATA_WORDS = re.compile(
    r"(?i)\b(manufacturer|manufactured|marketed|imported|importer|mrp|max|retail|price|"
    r"net|quantity|qty|weight|gross|mfg|mfg\.|exp|expiry|best\s*before|consumer\s*care|"
    r"helpline|care\s*line|country\s*of\s*origin|made\s*in|product\s*of|inclusive|taxes?|"
    r"regd\.?|customer|call|toll\s*free|phone|email|www|website|customer\s*care)\b"
)


def _group_by_zone(extracted_data):
    zones = {}
    for item in extracted_data or []:
        zone = item.get("zone", "unknown")
        zones.setdefault(zone, []).append(item)
    return zones


def _join_text(texts):
    return " ".join((t.get("text") or "").strip() for t in texts if (t.get("text") or "").strip())


def _clean(value):
    if not value:
        return ""
    value = re.sub(r"\s+", " ", value).strip(" -:;|,.")
    return value


def _extract_with_rules(zone_texts, rules):
    """Populate standard facts from the rule engine's own regex patterns."""
    fields = {}
    for rule in rules:
        field_zone = rule.get("field", "any")
        if rule.get("type") != "regex":
            continue
        texts = zone_texts.get(field_zone) if field_zone in zone_texts else None
        combined = _join_text(texts) if texts is not None else None
        if combined is None:
            # fallback: search the whole label for 'any'-scoped or unzoned rules
            combined = _join_text(zone_texts.get("any", []) or [])
            if field_zone not in ("any",) and not combined:
                combined = _join_text(
                    [t for zone in zone_texts.values() for t in zone]
                )
        if not combined:
            continue
        try:
            pattern = re.compile(rule["pattern"])
        except re.error:
            continue
        m = pattern.search(combined)
        if not m:
            continue
        rid = rule["id"]
        if rid == "mrp_declaration":
            fields["mrp"] = _clean(m.group(0))
        elif rid == "net_quantity":
            fields["net_quantity"] = _clean(m.group(0))
        elif rid == "manufacturer":
            # capture content following the keyword for a more useful value
            value = m.group(0)
            rest = combined[m.end():]
            value = _capture_tail(value, rest, 8)
            fields["manufacturer"] = _clean(value)
        elif rid == "country_of_origin":
            value = m.group(2).strip() if m.lastindex and m.lastindex >= 2 else m.group(1).strip()
            fields["country_of_origin"] = _clean(value)
        elif rid == "consumer_care":
            fields["consumer_care"] = _clean(m.group(0))
    return fields


def _capture_tail(prefix, rest, word_limit=8):
    """Return prefix + the next few words after it, to enrich values like
    'Manufacturer XX Pvt Ltd'."""
    words = []
    for token in re.split(r"[\s,;]+", rest):
        if not token:
            continue
        words.append(token)
        if len(words) >= word_limit:
            break
    tail = " ".join(words)
    if not tail:
        return prefix
    return f"{prefix} {tail}"


def _extract_product_name(extracted_data):
    """Heuristic: the product/brand name is usually the most prominent (largest
    or first) text block that is not metadata."""

    def text_height(item):
        ys = [p[1] for p in item.get("bbox", [])]
        if len(ys) < 2:
            return 0
        return max(ys) - min(ys)

    candidates = []
    for item in extracted_data or []:
        text = (item.get("text") or "").strip()
        if len(text) < 2:
            continue
        if _METADATA_WORDS.search(text):
            continue
        # skip lines that are mostly digits (GTINs, dates, prices)
        if re.fullmatch(r"[\d\s./:₹Rs.,-]+", text):
            continue
        candidates.append((text_height(item), len(text), item.get("confidence", 0), text))

    if not candidates:
        return ""
    # tallest wins; ties broken by text length then confidence
    candidates.sort(key=lambda c: (c[0], c[1], c[2]), reverse=True)
    return _clean(candidates[0][3])


def _extract_mfg_date(combined_text):
    for pattern in _MFG_DATE_PATTERNS:
        m = pattern.search(combined_text)
        if m:
            return _clean(m.group("date"))
    return ""


def extract_fields(pipeline_data):
    """
    Extract a flat dict of label facts from process_image_pipeline output.

    Returns:
        extracted_fields (dict) with product_name, manufacturer, mrp,
        net_quantity, country_of_origin, consumer_care, mfg_date ('' when not
        found).
    """
    extracted_data = pipeline_data.get("extracted_data", [])
    full_text = pipeline_data.get("full_text", "")

    zone_texts = _group_by_zone(extracted_data)
    all_texts = [t for zone in zone_texts.values() for t in zone]
    combined_all = _join_text(all_texts)

    # Reuse rule definitions for the standard facts.
    from app.services.validation_service import load_rules

    try:
        rules = load_rules()["rules"]
    except Exception:
        rules = []

    fields = _extract_with_rules(zone_texts, rules)

    fields.setdefault("product_name", _extract_product_name(extracted_data))
    fields.setdefault("mfg_date", _extract_mfg_date(full_text or combined_all))

    # Ensure all keys exist with a default empties where missing.
    defaults = {
        "product_name": "",
        "manufacturer": "",
        "mrp": "",
        "net_quantity": "",
        "country_of_origin": "",
        "consumer_care": "",
        "mfg_date": "",
    }
    for key, default in defaults.items():
        fields.setdefault(key, default)

    return fields
