import os
import re

# Feature flag: when true (default for demo mode), listing data is simulated
# for a small set of known URLs instead of scraping the live page. Set
# COMPLISCAN_MOCK_SCRAPER=0 to require a real scraper backend.
MOCK_SCRAPER = os.getenv("COMPLISCAN_MOCK_SCRAPER", "1").lower() in ("1", "true", "yes", "on")


def _normalise_number(value):
    """Extract a comparable float from strings like 'Rs. 299', '₹1,250.50', '500g'."""
    # Commas are thousands separators; drop them. Keep the first decimal dot,
    # and strip leading/trailing dots left over from abbreviations like 'Rs.'.
    cleaned = re.sub(r"[^\d.]", "", value.replace(",", "")).strip(".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _normalise_unit_quantity(value):
    """Return a comparable (number, unit) tuple from '500 g' / '500g' / '1.5 L'."""
    m = re.search(r"(\d+\.?\d*)\s*(g|kg|ml|l|ltr|litre|liters|gm|kgs|mg)", value, re.IGNORECASE)
    if not m:
        return None
    return (float(m.group(1)), m.group(2).lower())


def fetch_listing_data(url):
    """
    Fetch product listing facts for a given e-commerce URL.

    Returns a dict like:
        {"mrp": "Rs. 299", "net_quantity": "500g",
         "country_of_origin": "China", "manufacturer": "Acme Corp"}
    or None if the listing could not be retrieved.

    TODO(scraper): Replace the mock with a real scraper (e.g. BeautifulSoup or
    Scrapy against Amazon/Flipkart). Implement a parser keyed on the URL's
    hostname and populate the same fields so `cross_check` is unchanged.

    This is the single place that talks to the network; keep it behind the
    MOCK_SCRAPER flag so demo mode stays offline and deterministic.
    """
    if MOCK_SCRAPER:
        return _mock_parse_ecommerce_url(url)

    # --- Scraper interface (to be implemented) -----------------------------
    # Example:
    #   hostname = urllib.parse.urlparse(url).netloc
    #   if hostname.endswith("amazon.in") or hostname.endswith("flipkart.com"):
    #       return _parse_amazon(requests.get(url, timeout=10).text)
    #   return None
    # -----------------------------------------------------------------------
    try:
        import requests  # noqa: F401 (only needed when the flag is off)
    except ImportError:
        return None
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
    except Exception:
        return None
    # NOTE: parsing the HTML into structured fields is not implemented yet,
    # so we conservatively return a structure with no data.
    return None


def _mock_parse_ecommerce_url(url):
    """Deterministic mock scraper for demo mode (no network access)."""
    if "example.com/product/123" in url:
        return {
            "mrp": "Rs. 299",
            "net_quantity": "500g",
            "country_of_origin": "China",
            "manufacturer": "Acme Corp"
        }
    elif "example.com/product/compliant" in url:
        return {
            "mrp": "Rs. 50.00",
            "net_quantity": "100g",
            "country_of_origin": "India",
            "manufacturer": "Desi Naturals"
        }
    return None


def _compare_field(label, physical, listing, mismatches, normalize=None):
    """Append a mismatch description when physical and listing values disagree."""
    if not physical or not listing:
        return
    if normalize:
        p, l = normalize(physical), normalize(listing)
        if p is not None and l is not None and p != l:
            mismatches.append(
                f"{label} Mismatch: Physical is {physical}, Listing says {listing}"
            )
    elif physical.lower().strip() != listing.lower().strip():
        mismatches.append(
            f"{label} Mismatch: Physical is {physical}, Listing says {listing}"
        )


def cross_check(listing_url, extracted_fields):
    """
    Compares scraped listing data against physical OCR facts.

    extracted_fields should be populated by the OCR field-extraction step
    (see services/field_extraction.py) so that MRP, net quantity, country of
    origin, manufacturer and product name are real values rather than blanks.
    """
    if not listing_url:
        return {"status": "skipped", "message": "No listing URL provided."}

    listing_data = fetch_listing_data(listing_url)
    if not listing_data:
        return {"status": "error", "message": "Failed to scrape listing URL."}

    mismatches = []

    _compare_field(
        "MRP",
        extracted_fields.get("mrp"),
        listing_data.get("mrp"),
        mismatches,
        lambda v: _normalise_number(v),
    )
    _compare_field(
        "Net Quantity",
        extracted_fields.get("net_quantity"),
        listing_data.get("net_quantity"),
        mismatches,
        _normalise_unit_quantity,
    )
    _compare_field(
        "Country of Origin",
        extracted_fields.get("country_of_origin"),
        listing_data.get("country_of_origin"),
        mismatches,
        lambda v: re.sub(r"[^a-z ]", "", v.lower()).strip(),
    )
    _compare_field(
        "Manufacturer",
        extracted_fields.get("manufacturer"),
        listing_data.get("manufacturer"),
        mismatches,
    )

    if mismatches:
        return {
            "status": "mismatch_found",
            "mismatches": mismatches,
            "listing_data": listing_data,
        }

    return {
        "status": "match",
        "mismatches": [],
        "listing_data": listing_data,
    }
