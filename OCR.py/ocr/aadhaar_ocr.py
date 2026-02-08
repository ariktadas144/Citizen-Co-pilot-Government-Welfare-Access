import re
import easyocr
import cv2
import os
from utils.helpers import extract_location

reader = easyocr.Reader(['en', 'hi'], gpu=False)

def extract_raw_text(image_path: str):
    print("\n[DEBUG] Image path received:", image_path)
    print("[DEBUG] File exists:", os.path.exists(image_path))

    img = cv2.imread(image_path)

    if img is None:
        print("[DEBUG] cv2.imread FAILED — image is None")
        return []

    print("[DEBUG] Image loaded successfully. Shape:", img.shape)

    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    text = reader.readtext(img_rgb, detail=0)
    print("\n[DEBUG] RAW OCR TEXT:", text)

    return text


def extract_aadhaar_info(image_path: str):
    raw_text = extract_raw_text(image_path)

    user_info = {
        "name": None,
        "gender": None,
        "dob": None,
        "aadhaar_number": None,
        "address": None
    }

    IGNORE_WORDS = [
        "government", "india", "aadhaar", "unique",
        "identification", "authority", "your"
    ]

    for line in raw_text:
        clean = line.strip()
        lower = clean.lower()

        # Skip junk headers
        if any(word in lower for word in IGNORE_WORDS):
            continue

        # Aadhaar number
        if re.search(r"\b\d{4}\s\d{4}\s\d{4}\b", clean):
            user_info["aadhaar_number"] = clean
            continue

        # DOB (extract only date)
        dob_match = re.search(r"\b\d{2}/\d{2}/\d{4}\b", clean)
        if dob_match:
            user_info["dob"] = dob_match.group()
            continue

        # Gender (cleaned)
        if any(g in lower for g in ["male", "female", "other"]):
            user_info["gender"] = clean.split(":")[-1].strip()
            continue

        # Name (alphabetic, 2+ words)
        if (
            user_info["name"] is None
            and clean.replace(" ", "").isalpha()
            and len(clean.split()) >= 2
        ):
            user_info["name"] = clean
            continue

        # Address (exclude DOB-like strings)
        if (
            user_info["address"] is None
            and "," in clean
            and not re.search(r"\d{2}/\d{2}/\d{4}", clean)
        ):
            user_info["address"] = clean

    return {
        "user_info": user_info,
        "location_used": extract_location(raw_text)
    }
