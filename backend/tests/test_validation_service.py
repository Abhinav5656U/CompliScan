import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.validation_service import validate_compliance


def _item(zone, text, height_mm):
    return {
        "text": text,
        "bbox": [[0.0, 0.0], [100.0, 0.0], [100.0, 12.0], [0.0, 12.0]],
        "confidence": 0.9,
        "zone": zone,
        "physical_height_mm": height_mm,
    }


class ValidationServiceTest(unittest.TestCase):
    def test_font_size_check_passes_when_large_enough(self):
        pipeline = {
            "calibrated_pixels_per_mm": 3.0,
            "extracted_data": [
                _item("mrp_zone", "MRP Rs. 50/-", height_mm=3.0),
                _item("net_qty_zone", "Net Weight 100 g", height_mm=4.0),
            ],
            "full_text": "MRP Rs. 50 Net Weight 100 g",
        }
        checks = validate_compliance(pipeline, {})["checks"]
        by_name = {c["rule_name"]: c for c in checks}
        self.assertEqual(by_name["MRP Font Legibility"]["status"], "pass")
        self.assertEqual(by_name["Net Quantity Font Legibility"]["status"], "pass")

    def test_font_size_check_flags_small_text(self):
        pipeline = {
            "calibrated_pixels_per_mm": 3.0,
            "extracted_data": [
                _item("mrp_zone", "MRP Rs. 50/-", height_mm=1.0),
                _item("net_qty_zone", "Net Weight 100 g", height_mm=4.0),
            ],
            "full_text": "MRP Rs. 50 Net Weight 100 g",
        }
        checks = validate_compliance(pipeline, {})["checks"]
        by_name = {c["rule_name"]: c for c in checks}
        self.assertEqual(by_name["MRP Font Legibility"]["status"], "likely_violation")

    def test_font_size_check_uncalibrated_goes_to_review(self):
        pipeline = {
            "calibrated_pixels_per_mm": None,
            "extracted_data": [
                _item("net_qty_zone", "Net Weight 100 g", height_mm=0),
            ],
            "full_text": "Net Weight 100 g",
        }
        checks = validate_compliance(pipeline, {})["checks"]
        by_name = {c["rule_name"]: c for c in checks}
        self.assertEqual(
            by_name["Net Quantity Font Legibility"]["status"],
            "human_review_required",
        )


if __name__ == "__main__":
    unittest.main()
