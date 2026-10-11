import re
import base64
import unicodedata
from typing import Tuple, List

def remove_zero_width_chars(text: str) -> str:
    return re.sub(r'[\u200B-\u200D\uFEFF\u00AD]', '', text)

def decode_base64_fragments(text: str) -> Tuple[str, List[str]]:
    decoded = []
    def replacer(match: re.Match) -> str:
        token = match.group(0)
        if len(token) < 16:
            return token
        try:
            raw = base64.b64decode(token, validate=True).decode('utf-8')
            if raw.isprintable() and len(raw.strip()) > 4:
                decoded.append(raw.strip())
                return f"{token} [DECODED: {raw.strip()}]"
        except Exception:
            pass
        return token
    return re.sub(r'[A-Za-z0-9+/=]{16,}', replacer, text), decoded

def normalize_text(text: str) -> Tuple[str, List[str]]:
    transforms = []
    processed = unicodedata.normalize('NFKD', text)
    
    clean_zw = remove_zero_width_chars(processed)
    if clean_zw != processed:
        transforms.append("zero_width_removal")
        processed = clean_zw

    processed, b64 = decode_base64_fragments(processed)
    if b64:
        transforms.append("base64_decoded")

    collapsed = re.sub(r'\b(?:[a-zA-Z]\s+){2,}[a-zA-Z]\b', lambda m: m.group(0).replace(" ", ""), processed)
    if collapsed != processed:
        transforms.append("collapsed_character_spacing")
        processed = collapsed

    canonical = re.sub(r'\s+', ' ', processed.lower()).strip()
    return canonical, transforms
