import cv2
from pyzbar.pyzbar import decode

def decode_barcode(image_path):
    """
    Decodes barcode and QR codes from the given image using pyzbar and OpenCV.
    """
    try:
        image = cv2.imread(image_path)
        if image is None:
            return []
            
        decoded_objects = decode(image)
        results = []
        for obj in decoded_objects:
            results.append({
                "type": obj.type,
                "data": obj.data.decode("utf-8")
            })
            
        # Fallback to OpenCV QR detector if pyzbar fails
        if not results:
            qr_decoder = cv2.QRCodeDetector()
            data, bbox, _ = qr_decoder.detectAndDecode(image)
            if data:
                results.append({
                    "type": "QRCODE",
                    "data": data
                })
                
        return results
    except Exception as e:
        print(f"Barcode decoding error: {e}")
        return []
