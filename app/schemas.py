from typing import Literal, List, Optional, Dict, Any
from pydantic import BaseModel, Field

SecurityAction = Literal["ALLOW", "BLOCK", "SANITIZE", "ESCALATE"]
SourceType = Literal["user", "document", "webpage", "tool_output"]

class ScanRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=50000)
    source: SourceType = Field(default="user")
    context: Optional[str] = Field(default="direct_input")
    protected_values: List[str] = Field(default_factory=list)

class ScanResponse(BaseModel):
    request_id: str
    action: SecurityAction
    source: SourceType
    context: Optional[str] = None
    risk_score: float
    reasons: List[str]
    evidence: List[str]
    sanitized_content: Optional[str] = None
    scanned_at: str
    model_prediction: Optional[Dict[str, Any]] = None

class PolicyConfig(BaseModel):
    sensitivity_threshold: float = Field(default=0.65, ge=0.1, le=0.99)
    untrusted_source_escalate: bool = True
    sanitize_high_confidence: bool = True

class PolicyUpdateRequest(BaseModel):
    config: PolicyConfig
    admin_token: str

class BenchmarkResult(BaseModel):
    dataset_size: int
    true_positives: int
    true_negatives: int
    false_positives: int
    false_negatives: int
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    executed_at: str