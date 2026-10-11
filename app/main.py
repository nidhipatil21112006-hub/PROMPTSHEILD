import json, os
from pathlib import Path
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.schemas import ScanRequest, ScanResponse, PolicyConfig, PolicyUpdateRequest, BenchmarkResult
from app.scanner import scan_text
from app.classifier import predict_injection
from app.policy import get_policy, update_policy
from app.audit import record_scan_event, get_recent_logs

app = FastAPI(title="PromptShield API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "PromptShield", "mode": "local_inference_only"}

@app.post("/scan", response_model=ScanResponse)
def scan_endpoint(req: ScanRequest):
    policy = get_policy()
    ml_score, _ = predict_injection(req.content)
    res = scan_text(
        content=req.content,
        source=req.source,
        context=req.context,
        protected_values=req.protected_values,
        sensitivity_threshold=policy.sensitivity_threshold,
        untrusted_source_escalate=policy.untrusted_source_escalate,
        sanitize_high_confidence=policy.sanitize_high_confidence,
        classifier_score=ml_score
    )
    record_scan_event(res.model_dump())
    return res

@app.get("/policy", response_model=PolicyConfig)
def read_policy():
    return get_policy()

@app.put("/policy")
def modify_policy(req: PolicyUpdateRequest):
    if not update_policy(req.config, req.admin_token):
        raise HTTPException(status_code=403, detail="Invalid admin token")
    return {"status": "updated", "policy": get_policy()}

@app.get("/logs")
def read_logs():
    return {"logs": get_recent_logs()}

@app.post("/benchmark", response_model=BenchmarkResult)
def run_benchmark():
    if not os.path.exists("data/examples.jsonl"):
        raise HTTPException(status_code=400, detail="Dataset missing")
    policy = get_policy()
    tp, tn, fp, fn = 0, 0, 0, 0
    total = 0
    with open("data/examples.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            if not line.strip(): continue
            item = json.loads(line)
            actual = item["label"] == 1
            total += 1
            ml_score, _ = predict_injection(item["text"])
            res = scan_text(item["text"], source="user", sensitivity_threshold=policy.sensitivity_threshold, classifier_score=ml_score)
            pred = res.action in ["BLOCK", "SANITIZE", "ESCALATE"]
            if actual and pred: tp += 1
            elif not actual and not pred: tn += 1
            elif not actual and pred: fp += 1
            elif actual and not pred: fn += 1

    acc = (tp + tn) / total if total else 0.0
    prec = tp / (tp + fp) if (tp + fp) else 0.0
    rec = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) else 0.0
    return BenchmarkResult(
        dataset_size=total, true_positives=tp, true_negatives=tn, false_positives=fp, false_negatives=fn,
        accuracy=round(acc, 3), precision=round(prec, 3), recall=round(rec, 3), f1_score=round(f1, 3),
        executed_at=datetime.now(timezone.utc).isoformat()
    )

@app.get("/", response_class=HTMLResponse)
def serve_dashboard():
    tmpl = Path(__file__).parent / "templates" / "index.html"
    return tmpl.read_text(encoding="utf-8")
