def extract_location(text_lines):
    """
    Extract location like: City, State, Country
    """
    for line in text_lines:
        if "," in line:
            parts = [p.strip() for p in line.split(",")]
            if len(parts) >= 2:
                return line
    return None
