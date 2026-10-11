import json, os
from typing import List, Dict, Any
LOG_FILE = "audit_logs.jsonl"

def record_scan_event(event: Dict[str, Any]) -> None:
    safe_event = {
        "request_id": event.get("request_id"),
        "scanned_at": event.get("scanned_at"),
        "source": event.get("source"),
        "action": event.get("action"),
        "risk_score": event.get("risk_score"),
        "reasons": event.get("reasons", [])
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(safe_event) + "\n")

def get_recent_logs(limit: int = 50) -> List[Dict[str, Any]]:
    if not os.path.exists(LOG_FILE):
        return []
    logs = []
    with open(LOG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                logs.append(json.loads(line))
    return logs[-limit:][::-1]
