import uuid
import re
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from app.normalizer import normalize_text
from app.rules import evaluate_rules
from app.schemas import ScanResponse, SourceType, SecurityAction


def sanitize_isolated_regions(content: str, evidence_list: List[str]) -> Tuple[Optional[str], bool]:
    """
    Surgically redacts isolated injection directives from documents.
    Preserves legitimate context so downstream LLMs can still function.
    """
    if not evidence_list:
        return None, False

    sanitized = content
    redactions = 0

    # Redact explicit injection tags and trailing line directives
    tag_pattern = r"((\[system\]|\[developer\]|###\s*(instruction|system)|system\s*directive:)[^\n]*(\n|$)?)"
    new_text, count = re.subn(tag_pattern, "[SECURITY_REDACTED_DIRECTIVE]\n", sanitized, flags=re.IGNORECASE)
    if count > 0:
        sanitized = new_text
        redactions += count

    # Redact captured rule evidence substrings
    for ev in evidence_list:
        if ev and len(ev.strip()) > 6:
            new_text, count = re.subn(re.escape(ev.strip()), "[SECURITY_REDACTED]", sanitized, flags=re.IGNORECASE)
            if count > 0:
                sanitized = new_text
                redactions += count

    # Ensure legitimate content remains (do not sanitize empty or purely malicious payloads)
    cleaned_residual = sanitized.replace("[SECURITY_REDACTED]", "").replace("[SECURITY_REDACTED_DIRECTIVE]", "").strip()
    has_legitimate_content = len(cleaned_residual) > 20

    if redactions > 0 and has_legitimate_content:
        return sanitized.strip(), True

    return None, False


def scan_text(
    content: str,
    source: SourceType = "user",
    context: Optional[str] = "direct_input",
    protected_values: Optional[List[str]] = None,
    sensitivity_threshold: float = 0.65,
    untrusted_source_escalate: bool = True,
    sanitize_high_confidence: bool = True,
    classifier_score: Optional[float] = None
) -> ScanResponse:
    """
    Core inspection engine executing source-aware policy arbitration.
    """
    request_id = str(uuid.uuid4())
    scanned_at = datetime.now(timezone.utc).isoformat()
    protected_values = protected_values or []

    # 1. Multi-stage normalization
    normalized, transforms = normalize_text(content)

    # 2. Rule evaluation
    findings = evaluate_rules(normalized, content)

    # 3. Protected secret value detection (checks canonical and spaced variations)
    for val in protected_values:
        if not val:
            continue
        val_clean = val.lower().strip()
        val_no_space = val_clean.replace(" ", "")
        content_no_space = content.lower().replace(" ", "")

        if (val_clean in content.lower()) or (val_clean in normalized) or (val_no_space in content_no_space):
            findings.append({
                "rule_id": "protected_value_leak",
                "reason": "Input contains configured protected secret value",
                "severity": "critical",
                "weight": 1.0,
                "evidence": val
            })

    # 4. Hybrid arbitration: max(rule severity weight, ML probability)
    rule_score = max([f["weight"] for f in findings], default=0.0)
    risk_score = max(rule_score, classifier_score or 0.0)

    reasons = [f["reason"] for f in findings]
    evidence = [f.get("evidence", "") for f in findings if f.get("evidence")]
    sanitized_content = None

    # 5. Source-aware decision logic
    if risk_score < sensitivity_threshold:
        action: SecurityAction = "ALLOW"
    else:
        # Untrusted sources (RAG documents, tool returns, web scrapes) attempt surgical sanitization
        if sanitize_high_confidence and source in ["document", "webpage", "tool_output"]:
            candidate, success = sanitize_isolated_regions(content, evidence)
            if success:
                action = "SANITIZE"
                sanitized_content = candidate
                reasons.append("Malicious instruction regions surgically isolated and neutralized")
            elif untrusted_source_escalate:
                action = "ESCALATE"
                reasons.append(f"Untrusted source '{source}' contains threats that could not be safely sanitized")
            else:
                action = "BLOCK"
        elif source in ["document", "webpage", "tool_output"] and untrusted_source_escalate:
            action = "ESCALATE"
            reasons.append(f"Untrusted source '{source}' flagged for manual analyst review")
        else:
            action = "BLOCK"

    return ScanResponse(
        request_id=request_id,
        action=action,
        source=source,
        context=context,
        risk_score=round(risk_score, 2),
        reasons=reasons,
        evidence=evidence,
        sanitized_content=sanitized_content,
        scanned_at=scanned_at,
        model_prediction={"classifier_score": classifier_score, "transforms_applied": transforms} if classifier_score is not None else None
    )