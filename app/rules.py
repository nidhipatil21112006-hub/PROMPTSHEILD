import re
from typing import List, Dict, Any

# Primary threat vectors defined by VORTEXA 3.0 (C-03)
SECURITY_RULES = [
    {
        "id": "instruction_override",
        "description": "Attempt to override system boundaries or disregard developer instructions",
        "pattern": r"\b(ignore|disregard|override|forget|bypass)\b.{0,60}\b(previous|above|prior|all|system|developer)\b.{0,40}\b(instructions?|rules?|prompts?|constraints?)\b",
        "severity": "high",
        "weight": 0.85
    },
    {
        "id": "secret_extraction",
        "description": "Attempt to extract internal prompt boundaries or confidential secrets",
        "pattern": r"\b(reveal|print|show|disclose|leak|output|repeat|echo)\b.{0,60}\b(hidden|system|developer|secret|confidential|private)\b.{0,40}\b(prompt|instructions?|keys?|tokens?|passwords?)\b",
        "severity": "high",
        "weight": 0.85
    },
    {
        "id": "indirect_system_injection",
        "description": "System directive marker or prompt injection spoofing tag in document",
        "pattern": r"(\[system\]|\[developer\]|###\s*(instruction|system)|system\s*directive:|assistant:\s*you\s*must)",
        "severity": "critical",
        "weight": 0.95
    },
    {
        "id": "jailbreak_persona",
        "description": "Adversarial jailbreak framing attempt (DAN, Developer Mode, Unrestricted)",
        "pattern": r"\b(you are now dan|stay in developer mode|unfiltered assistant|do anything now|ignore all guardrails|act as an unrestricted)\b",
        "severity": "critical",
        "weight": 0.95
    },
    {
        "id": "data_exfiltration_webhook",
        "description": "Attempt to exfiltrate private data to outside destination via URL or webhook",
        "pattern": r"(!\[.*?\]\(https?://[^\s\)]+(\?|&)[^\s\)]+)|(\b(curl|wget|fetch|post|send|transmit)\b.{0,50}\bhttps?://[^\s]+\b.{0,40}\b(secret|token|password|data|records?)\b)",
        "severity": "critical",
        "weight": 0.90
    },
    {
        "id": "policy_tampering_or_filter_bypass",
        "description": "Attempt to tamper with system policy, threshold parameters, or bypass safety filters",
        "pattern": r"\b(bypass\s+all\s+(safety|security|content)\s+filters|set\s+sensitivity_threshold|disable\s+(guardrails|filters|rules))\b",
        "severity": "high",
        "weight": 0.85
    }
]

# Educational or defensive research queries that must NOT trigger false positives
BENIGN_DEFENSIVE_PATTERNS = [
    r"\b(how\s+to|how\s+(do|can|developers|we))\s+(prevent|mitigate|stop|defend|detect)\b.{0,40}\b(prompt injection|jailbreak|data leakage|attacks?)\b",
    r"\b(explain|describe|understand)\s+(what|how)\s+(to\s+prevent\s+)?(prompt injection|a jailbreak|llm security)\b",
    r"\bprevent(ing)?\s+prompt\s+injection\b",
    r"\bexplain\s+what\s+a\s+sql\s+injection\b"
]


def evaluate_rules(normalized_text: str, raw_text: str) -> List[Dict[str, Any]]:
    """Evaluates input against deterministic security signatures with false-positive suppression."""
    # Suppress benign defensive questions
    for b_pat in BENIGN_DEFENSIVE_PATTERNS:
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