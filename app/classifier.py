import os, joblib
from typing import Optional, Tuple
MODEL_PATH = "models/promptshield_model.joblib"
_model = None

def predict_injection(text: str) -> Tuple[Optional[float], bool]:
    global _model
    if _model is None and os.path.exists(MODEL_PATH):
        try:
            _model = joblib.load(MODEL_PATH)
        except Exception:
            return None, False
    if _model is None:
        return None, False
    try:
        prob = float(_model.predict_proba([text])[0][1])
        return round(prob, 3), True
    except Exception:
        return None, False
