import os
from app.schemas import PolicyConfig

_active = PolicyConfig()

def get_policy() -> PolicyConfig:
    return _active

def update_policy(config: PolicyConfig, token: str) -> bool:
    global _active
    if token != os.getenv("PROMPTSHIELD_ADMIN_TOKEN", "vortexa-admin-secret"):
        return False
    _active = config.model_copy()
    return True
