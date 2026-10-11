import re
import uuid
from typing import List, Optional
from pydantic import BaseModel, Field

# Common leak patterns
SECRET_PATTERNS = {
    "openai_api_key": re.compile(r"sk-[a-zA-Z0-9]{20,48}"),
    "generic_api_key": re.compile(r"(?:api[_-]?key|access[_-]?token|secret[_-]?key)[\s:=]+(['\"]?[a-zA-Z0-9_\-]{16,64}['\"]?)", re.IGNORECASE),
    "aws_access_key": re.compile(r"(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}"),
    "jwt_token": re.compile(r"eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}"),
    "private_key_header": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "email_address": re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
}


class EgressScanRequest(BaseModel):
    content: str
    canary_tokens: List[str] = Field(default_factory=list, description="Tokens embedded in system instructions to detect leaks")
    protected_values: List[str] = Field(default_factory=list, description="Explicit secrets/credentials to shield")
    context: str = "model_output"


class EgressScanResponse(BaseModel):
    action: str  # ALLOW, BLOCK, SANITIZE, ESCALATE
    risk_level: str  # low, medium, high, critical
    reasons: List[str]
    evidence: List[str]
    sanitized_content: Optional[str] = None
    request_id: str


def scan_egress(
    content: str,
    canary_tokens: Optional[List[str]] = None,
    protected_values: Optional[List[str]] = None
) -> EgressScanResponse:
    canary_tokens = canary_tokens or []
    protected_values = protected_values or []

    reasons: List[str] = []
    evidence: List[str] = []
    sanitized = content
    action = "ALLOW"
    risk_level = "low"

    # 1. Canary Token Detection (Critical Threat - System Prompt Leak)
    for canary in canary_tokens:
        if canary and canary in content:
            action = "BLOCK"
            risk_level = "critical"
            reasons.append("Canary token leak detected; system prompt compromised.")
            evidence.append(f"Leaked canary token match: {canary[:4]}***")

    # 2. Explicit Protected Values Leakage
    for secret in protected_values:
        if secret and secret in sanitized:
            reasons.append("Explicit protected value detected in model output.")
            evidence.append(f"Secret matched: {secret[:3]}***")
            # Redact the secret
            sanitized = sanitized.replace(secret, "[REDACTED_SECRET]")
            if action != "BLOCK":
                action = "SANITIZE"
                risk_level = "high"

    # 3. Deterministic Secret & Key Regex Inspection
    for pattern_name, regex in SECRET_PATTERNS.items():
        matches = regex.findall(sanitized)
        if matches:
            reasons.append(f"Potential sensitive credential detected: {pattern_name}")
            for m in matches:
                match_val = m if isinstance(m, str) else m[0]
                evidence.append(f"{pattern_name} pattern match: {match_val[:4]}***")
                sanitized = sanitized.replace(match_val, f"[REDACTED_{pattern_name.upper()}]")
            
            if pattern_name in ["openai_api_key", "aws_access_key", "jwt_token", "private_key_header"]:
                action = "BLOCK"
                risk_level = "critical"
            elif action not in ["BLOCK", "SANITIZE"]:
                action = "SANITIZE"
                risk_level = "medium"

    req_id = f"egress_{uuid.uuid4().hex[:8]}"

    return EgressScanResponse(
        action=action,
        risk_level=risk_level,
        reasons=reasons or ["Egress content cleared firewall checks."],
        evidence=evidence,
        sanitized_content=sanitized if action == "SANITIZE" else (content if action == "ALLOW" else None),
        request_id=req_id
    )