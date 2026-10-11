"""
Explicit, tamper-resistant security policy engine for PromptShield.
Untrusted content can never modify this policy. Only authenticated administrators can.
"""
from typing import Dict, Any
from app.schemas import PolicyConfig

DEFAULT_POLICY = PolicyConfig(
    sensitivity_threshold=0.65,
    untrusted_source_escalate=True,
    sanitize_high_confidence=True,
    block_data_exfiltration=True
)

CURRENT_POLICY = DEFAULT_POLICY.model_copy()
ADMIN_SECRET_KEY = "promptshield-admin-key-vortexa"


def get_policy() -> PolicyConfig:
    """Returns a copy of the active security policy."""
    return CURRENT_POLICY.model_copy()


def update_policy(new_config: PolicyConfig, admin_token: str) -> bool:
    """
    Updates the operational security policy.
    Requires strict authentication token verification to prevent prompt injection tampering.
    """
    global CURRENT_POLICY
    if admin_token != ADMIN_SECRET_KEY:
        return False

    CURRENT_POLICY = new_config.model_copy()
    return True