import os
from ocr.aadhaar_ocr import extract_aadhaar_info

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
image_path = os.path.join(BASE_DIR, "aadhaar_sample.png")

print("[DEBUG] BASE_DIR:", BASE_DIR)
print("[DEBUG] Image full path:", image_path)

result = extract_aadhaar_info(image_path)

print("\n=== Extracted Aadhaar Info ===")
for k, v in result["user_info"].items():
    print(f"{k}: {v}")

print("\nLocation Used:", result["location_used"])
