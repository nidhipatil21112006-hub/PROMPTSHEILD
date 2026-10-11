import re
from typing import List, Dict, Any

SECURITY_RULES = [
    {
        "id": "instruction_override",
        "description": "Attempt to override system boundaries or disregard instructions",
        "pattern": r"\b(ignore|disregard|override|forget|bypass)\b.{0,60}\b(previous|above|prior|all|system|developer)\b.{0,40}\b(instructions?|rules?|prompts?|constraints?)\b",
        "severity": "high",
        "weight": 0.85
    },
    {
        "id": "secret_extraction",
        "description": "Attempt to reveal internal system prompts or confidential secrets",
        "pattern": r"\b(reveal|print|show|disclose|leak|output|repeat|echo)\b.{0,60}\b(hidden|system|developer|secret|confidential|private)\b.{0,40}\b(prompt|instructions?|keys?|tokens?|passwords?)\b",
        "severity": "high",
        "weight": 0.85
    },
    {
        "id": "indirect_system_injection",
        "description": "System directive or boundary spoofing marker in document",
        "pattern": r"(\[system\]|\[developer\]|###\s*(instruction|system)|system\s*directive:|assistant:\s*you\s*must)",
        "severity": "critical",
        "weight": 0.95
    },
    {
        "id": "jailbreak_persona",
        "description": "Jailbreak framing attempt (DAN, Developer Mode)",
        "pattern": r"\b(you are now dan|stay in developer mode|unfiltered assistant|do anything now|ignore all guardrails)\b",
        "severity": "critical",
        "weight": 0.95
    },
    {
        "id": "data_exfiltration",
        "description": "Attempt to exfiltrate data via webhooks or markdown image links",
        "pattern": r"(!\[.*?\]\(https?://[^\s\)]+(\?|&)[^\s\)]+)|(\b(curl|wget|fetch|post|send)\b.{0,50}\b(https?://|http://)\b.{0,40}\b(secret|token|password|data)\b)",
        "severity": "critical",
        "weight": 0.90
    }
]

BENIGN_DEFENSIVE = [
    r"\b(how\s+to|how\s+(do|can|developers|we))\s+(prevent|mitigate|stop|defend|detect)\b.{0,40}\b(prompt injection|jailbreak|data leakage|attacks?)\b",
    r"\b(explain|describe|understand)\s+(what|how)\s+(to\s+prevent\s+)?(prompt injection|a jailbreak|llm security)\b",
    r"\bprevent(ing)?\s+prompt\s+injection\b"
]

def evaluate_rules(normalized_text: str, raw_text: str) -> List[Dict[str, Any]]:
    # Defensive & educational inquiries should not trigger security rules
    for b_pat in BENIGN_DEFENSIVE:
        if re.search(b_pat, normalized_text) or re.search(b_pat, raw_text, re.IGNORECASE):
            return []

    matches = []
    for rule in SECURITY_RULES:
        found = re.search(rule["pattern"], normalized_text, re.IGNORECASE) or re.search(rule["pattern"], raw_text, re.IGNORECASE)
        if found:
            matches.append({
                "rule_id": rule["id"],
                "reason": rule["description"],
                "severity": rule["severity"],
                "weight": rule["weight"],
                "evidence": found.group(0)[:120]
            })
    return matches
