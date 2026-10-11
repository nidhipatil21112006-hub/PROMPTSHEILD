import re
import base64
import urllib.parse
import unicodedata
from typing import Tuple, List


def strip_zero_width(text: str) -> str:
    """Removes zero-width and invisible formatting characters."""
    return re.sub(r'[\u200B-\u200D\uFEFF\u00AD\u200E\u200F]', '', text)


def decode_url_and_hex(text: str) -> Tuple[str, List[str]]:
    """Decodes URL percent-encoding and standard escape hex characters."""
    transforms = []
    try:
        url_decoded = urllib.parse.unquote(text)
        if url_decoded != text and any(c.isalnum() for c in url_decoded):
            transforms.append("url_decoded")
            text = url_decoded
    except Exception:
        pass
    return text, transforms


def decode_base64_fragments(text: str) -> Tuple[str, List[str]]:
    """Identifies base64 payload tokens (length >= 16) and decodes printable strings."""
    decoded_fragments = []

    def replacer(match: re.Match) -> str:
        token = match.group(0)
        if len(token) < 16:
            return token
        try:
            raw = base64.b64decode(token, validate=True).decode('utf-8')
            if raw.isprintable() and len(raw.strip()) > 4:
                decoded_fragments.append(raw.strip())
                return f"{token} [DECODED_B64: {raw.strip()}]"
        except Exception:
            pass
        return token

    text = re.sub(r'[A-Za-z0-9+/=]{16,}', replacer, text)
    if decoded_fragments:
        return text, ["base64_decoded"]
    return text, []


def collapse_adversarial_spacing(text: str) -> Tuple[str, List[str]]:
    """Collapses spaced-out attack sequences like 'i g n o r e' into 'ignore'."""
    pattern = r'\b(?:[a-zA-Z]\s+){2,}[a-zA-Z]\b'
    matched = False

    def replacer(match: re.Match) -> str:
        nonlocal matched
        matched = True
        return match.group(0).replace(" ", "")

    processed = re.sub(pattern, replacer, text)
    return processed, (["collapsed_spacing"] if matched else [])


def normalize_text(text: str) -> Tuple[str, List[str]]:
    """
    Applies multi-stage normalization against evasion techniques.
    Returns: (canonical_normalized_text, list_of_transform_names)
    """
    transforms = []

    # 1. Unicode normalization (NFKD decomposes ligatures and accents)
    processed = unicodedata.normalize('NFKD', text)

    # 2. Strip hidden/zero-width evasion tokens
    clean_zw = strip_zero_width(processed)
    if clean_zw != processed:
        transforms.append("zero_width_removed")
        processed = clean_zw

    # 3. URL and hex percent-decode
    processed, hex_t = decode_url_and_hex(processed)
    transforms.extend(hex_t)

    # 4. Base64 payload detection
    processed, b64_t = decode_base64_fragments(processed)
    transforms.extend(b64_t)

    # 5. Spaced-out character collapse
    processed, space_t = collapse_adversarial_spacing(processed)
    transforms.extend(space_t)

    # 6. Canonical whitespace collapse & lowercasing for pattern matching
    canonical = re.sub(r'\s+', ' ', processed.lower()).strip()

    return canonical, transforms
