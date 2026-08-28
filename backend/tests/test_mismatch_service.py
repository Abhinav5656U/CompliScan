import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services import mismatch_service


# Real OCR-style extracted fields.
SAMPLE_FIELDS = {
    "mrp": "MRP Rs. 299/-",
    "net_quantity": "500 g",
    "country_of_origin": "China",
    "manufacturer": "Manufactured by Acme Corp",
}


class MismatchServiceTest(unittest.TestCase):
    def test_skipped_when_no_url(self):
        result = mismatch_service.cross_check(None, SAMPLE_FIELDS)
        self.assertEqual(result["status"], "skipped")

    def test_match_when_physical_equals_listing(self):
        result = mismatch_service.cross_check(
            "https://example.com/product/compliant",
            {
                "mrp": "Rs. 50.00",
                "net_quantity": "100g",
                "country_of_origin": "India",
                "manufacturer": "Desi Naturals",
            },
        )
        self.assertEqual(result["status"], "match")
        self.assertEqual(result["mismatches"], [])

    def test_mismatch_detected(self):
        result = mismatch_service.cross_check(
            "https://example.com/product/123",
            {
                "mrp": "MRP Rs. 199/-",
                "net_quantity": "500 g",
                "country_of_origin": "India",
                "manufacturer": "Acme Corp",
            },
        )
        self.assertEqual(result["status"], "mismatch_found")
        texts = " | ".join(result["mismatches"]).lower()
        self.assertIn("mrp", texts)
        self.assertIn("origin", texts)

    def test_real_scraper_dispatched_when_mock_off(self):
        # With mock disabled, fetch_listing_data should attempt a real fetch
        # rather than returning mocked data. If `requests` is unavailable the
        # result must be a clean error (no crash).
        with patch("app.services.mismatch_service.MOCK_SCRAPER", False):
            result = mismatch_service.cross_check(
                "https://example.com/product/123", SAMPLE_FIELDS
            )
            # No scraper parser implemented / no network -> returns error.
            self.assertEqual(result["status"], "error")

    def test_normalise_number(self):
        self.assertEqual(mismatch_service._normalise_number("Rs. 1,250.50"), 1250.5)

    def test_normalise_unit_quantity(self):
        self.assertEqual(mismatch_service._normalise_unit_quantity("500g"), (500.0, "g"))


if __name__ == "__main__":
    unittest.main()
