import json
import os
from pathlib import Path
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.schemas import (
    ScanRequest, ScanResponse, PolicyConfig, PolicyUpdateRequest, BenchmarkResult
)
from app.scanner import scan_text
from app.classifier import predict_injection
from app.policy import get_policy, update_policy
from app.audit import record_scan_event, get_recent_logs

app = FastAPI(
    title="PromptShield API",
    description="Local Prompt Injection & Data Exfiltration Detection Middleware",
    version="1.0.0"
)

# Open CORS configuration for teammate's React/Vite/Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "PromptShield",
        "version": "1.0.0",
        "inference_engine": "100% Local (scikit-learn + deterministic rules)"
    }


@app.post("/scan", response_model=ScanResponse)
def scan_endpoint(req: ScanRequest):
    """
    Main middleware inspection endpoint.
    Takes incoming text, source type, and optional protected secrets.
    """
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
        raise HTTPException(status_code=403, detail="Invalid admin authorization token")
    return {"status": "policy_updated", "policy": get_policy()}


@app.get("/logs")
def read_logs(limit: int = 50):
    return {"logs": get_recent_logs(limit=limit)}


@app.post("/benchmark", response_model=BenchmarkResult)
def run_benchmark():
    dataset_path = "data/examples.jsonl"
    if not os.path.exists(dataset_path):
        raise HTTPException(status_code=400, detail="Evaluation dataset not found")

    policy = get_policy()
    tp, tn, fp, fn = 0, 0, 0, 0
    total = 0

    with open(dataset_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            actual_attack = item["label"] == 1
            total += 1

            ml_score, _ = predict_injection(item["text"])
            res = scan_text(
                content=item["text"],
                source="user",
                sensitivity_threshold=policy.sensitivity_threshold,
                classifier_score=ml_score
            )

            predicted_attack = res.action in ["BLOCK", "SANITIZE", "ESCALATE"]
            if actual_attack and predicted_attack:
                tp += 1
            elif not actual_attack and not predicted_attack:
                tn += 1
            elif not actual_attack and predicted_attack:
                fp += 1
            elif actual_attack and not predicted_attack:
                fn += 1

    acc = (tp + tn) / total if total > 0 else 0.0
    prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

    return BenchmarkResult(
        dataset_size=total,
        true_positives=tp,
        true_negatives=tn,
        false_positives=fp,
        false_negatives=fn,
        accuracy=round(acc, 3),
        precision=round(prec, 3),
        recall=round(rec, 3),
        f1_score=round(f1, 3),
        executed_at=datetime.now(timezone.utc).isoformat()
    )


@app.get("/", response_class=HTMLResponse)
def serve_dashboard():
    template_path = Path(__file__).parent / "templates" / "index.html"
    if not template_path.exists():
        raise HTTPException(status_code=404, detail="Dashboard template not found")
    return template_path.read_text(encoding="utf-8")