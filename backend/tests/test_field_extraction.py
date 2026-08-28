import os
import sys
import unittest

# Allow `python -m unittest` from the backend directory to import `app`.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.field_extraction import extract_fields


def _items(zone, text, height_mm=None, conf=0.85):
    item = {
        "text": text,
        "bbox": [[0.0, 0.0], [100.0, 0.0], [100.0, 12.0], [0.0, 12.0]],
        "confidence": conf,
        "zone": zone,
    }
    if height_mm is not None:
        item["physical_height_mm"] = height_mm
    return item


class FieldExtractionTest(unittest.TestCase):
    def test_extracts_standard_fields_from_zoned_text(self):
        pipeline = {
            "extracted_data": [
                _items("mrp_zone", "MRP Rs. 299/- (Inclusive of all taxes)"),
                _items("net_qty_zone", "Net Weight 500 g"),
                _items("manufacturer_zone", "Manufactured by Agro Foods Pvt. Ltd., Mumbai"),
                _items("consumer_care_zone", "Consumer Care: 1800-123-4567 care@agrofoods.com"),
                _items("any", "Made in India"),
                _items("any", "Mfg Date: 01/04/2026"),
            ],
            "full_text": "MRP Rs. 299 Net Weight 500 g Manufactured by Agro Foods Pvt. Ltd. Made in India Mfg Date: 01/04/2026",
        }

        fields = extract_fields(pipeline)

        self.assertIn("Rs", fields["mrp"])
        self.assertIn("299", fields["mrp"])
        self.assertIn("500", fields["net_quantity"])
        # manufacturer should include the keyword and the following entity
        self.assertTrue("Manufactured" in fields["manufacturer"])
        self.assertTrue("Agro" in fields["manufacturer"])
        self.assertEqual(fields["country_of_origin"].lower(), "india")
        self.assertTrue(fields["consumer_care"])
        self.assertEqual(fields["mfg_date"], "01/04/2026")

    def test_product_name_not_metadata(self):
        pipeline = {
            "extracted_data": [
                _items("manufacturer_zone", "Manufactured by Acme Corp"),
                _items("mrp_zone", "MRP Rs. 50"),
                _items("any", "Premium Basmati Rice 5kg"),
            ],
            "full_text": "Premium Basmati Rice Acme Corp MRP Rs. 50",
        }
        fields = extract_fields(pipeline)
        self.assertEqual(fields["product_name"], "Premium Basmati Rice 5kg")

    def test_missing_fields_default_to_empty_string(self):
        fields = extract_fields({
            "extracted_data": [],
            "full_text": "",
        })
        for key in (
            "product_name", "manufacturer", "mrp", "net_quantity",
            "country_of_origin", "consumer_care", "mfg_date",
        ):
            self.assertIn(key, fields)
            self.assertEqual(fields[key], "")

    def test_mfg_date_variants(self):
        cases = [
            "MRP... Mfg. Date: 12.2025",
            "Manufactured on 15-08-2026",
            "Made ... Best Before 12/2027 Mfg Date 01/2026",
        ]
        pipeline = {
            "extracted_data": [_items("any", c) for c in cases],
            "full_text": " ".join(cases),
        }
        fields = extract_fields(pipeline)
        self.assertTrue(fields["mfg_date"])


if __name__ == "__main__":
    unittest.main()
