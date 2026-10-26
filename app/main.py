import os
import datetime
from fastapi import FastAPI, HTTPException, Body, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.database import db
from app.engine import engine
from app.pdf_generator import generate_round2_submission_pdf, generate_audit_certificate_pdf

app = FastAPI(
    title="TechFusion — Intelligent Brand Governance API",
    description="Automated guardrails, claim verification, tone compliance, and role-based editorial workflow.",
    version="2.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class AuditRequest(BaseModel):
    title: Optional[str] = "Untitled Content"
    content: str
    metadata: Optional[Dict[str, Any]] = None

class GuidelineModel(BaseModel):
    id: str
    category: str
    name: str
    description: str
    rules: List[str]
    severity: str = "warning"
    version: str = "v1.0"
    status: str = "active"

class FactModel(BaseModel):
    id: str
    topic: str
    verified_claim: str
    keywords: List[str]
    approved_by: str
    last_verified: str
    evidence_doc: str

class WorkflowActionModel(BaseModel):
    action: str  # APPROVE, REQUEST_CHANGES, OVERRIDE
    role: str
    user_name: str
    note: Optional[str] = ""
    override_reason: Optional[str] = None

class CommentModel(BaseModel):
    author: str
    role: str
    text: str

# Endpoints
@app.post("/api/audit")
def audit_content(req: AuditRequest):
    if not req.content or not req.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty.")
    result = engine.review_content(req.content, req.title, req.metadata)
    return result

@app.get("/api/guidelines")
def get_guidelines():
    return db.get_guidelines()

@app.post("/api/guidelines")
def create_guideline(gl: GuidelineModel):
    created = db.add_guideline(gl.dict())
    return {"status": "success", "guideline": created}

@app.get("/api/facts")
def get_facts():
    return db.get_facts()

@app.post("/api/facts")
def create_fact(fact: FactModel):
    created = db.add_fact(fact.dict())
    return {"status": "success", "fact": created}

@app.get("/api/drafts")
def list_drafts():
    return db.get_drafts()

@app.get("/api/drafts/{draft_id}")
def get_draft(draft_id: str):
    draft = db.get_draft(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft

@app.post("/api/drafts")
def save_draft(payload: Dict[str, Any] = Body(...)):
    draft_id = payload.get("id") or f"DRAFT-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')}"
    title = payload.get("title", "Untitled Draft")
    content = payload.get("content", "")
    author = payload.get("author", "Current User")
    
    # Audit content automatically upon saving
    audit_res = engine.review_content(content, title)
    
    draft = db.get_draft(draft_id)
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if draft:
        draft["title"] = title
        draft["content"] = content
        draft["score"] = audit_res["overall_score"]
        draft["findings_count"] = audit_res["findings_count"]
        draft["history"].append({
            "timestamp": now_str,
            "user": author,
            "action": f"Updated Draft (Audit score: {audit_res['overall_score']}/100)"
        })
        saved = db.save_draft(draft)
    else:
        new_draft = {
            "id": draft_id,
            "title": title,
            "content": content,
            "author": author,
            "created_at": now_str,
            "status": "DRAFT",
            "score": audit_res["overall_score"],
            "findings_count": audit_res["findings_count"],
            "history": [
                {"timestamp": now_str, "user": author, "action": f"Created Draft (Audit score: {audit_res['overall_score']}/100)"}
            ],
            "comments": []
        }
        saved = db.save_draft(new_draft)

    db.log_action(author, f"Saved document draft {draft_id} ('{title}')")
    return {"status": "success", "draft": saved, "audit": audit_res}

@app.post("/api/drafts/{draft_id}/action")
def update_draft_status(draft_id: str, action_data: WorkflowActionModel):
    draft = db.get_draft(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    action_type = action_data.action.upper()

    if action_type == "APPROVE":
        draft["status"] = "APPROVED"
        log_msg = f"{action_data.user_name} ({action_data.role}) Approved content for syndication."
        if action_data.note:
            log_msg += f" Note: {action_data.note}"
    elif action_type == "REQUEST_CHANGES":
        draft["status"] = "CHANGES_REQUESTED"
        log_msg = f"{action_data.user_name} ({action_data.role}) Requested Revisions."
        if action_data.note:
            log_msg += f" Reason: {action_data.note}"
    elif action_type == "OVERRIDE":
        if not action_data.override_reason:
            raise HTTPException(status_code=400, detail="Override reason is mandatory for governance exceptions.")
        draft["status"] = "APPROVED_WITH_OVERRIDE"
        log_msg = f"OVERRIDE APPROVED by {action_data.user_name} ({action_data.role}). Rationale: {action_data.override_reason}"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported action {action_data.action}")

    draft["history"].append({
        "timestamp": now_str,
        "user": action_data.user_name,
        "action": log_msg
    })

    db.log_action(action_data.user_name, f"Workflow Action on {draft_id}: {action_type}")
    return {"status": "success", "draft": draft}

@app.post("/api/drafts/{draft_id}/comments")
def add_comment(draft_id: str, comment: CommentModel):
    draft = db.get_draft(draft_id)
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    new_c = {
        "id": f"c-{len(draft['comments']) + 1}",
        "author": comment.author,
        "role": comment.role,
        "timestamp": now_str,
        "text": comment.text
    }
    draft["comments"].append(new_c)
    db.log_action(comment.author, f"Added comment on {draft_id}")
    return {"status": "success", "comment": new_c, "all_comments": draft["comments"]}

@app.get("/api/insights")
def get_insights():
    return db.get_insights()

@app.get("/api/audit-log")
def get_audit_log():
    return db.get_audit_log()

@app.get("/api/download/submission-pdf")
def download_submission_pdf():
    pdf_bytes = generate_round2_submission_pdf()
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=TechFusion_Round2_Submission_Report.pdf"}
    )

@app.post("/api/download/certificate")
def download_certificate(payload: Dict[str, Any] = Body(...)):
    draft_data = payload.get("draft", {"id": "DOC-EXPORT", "title": "Brand Audit Report", "author": "Reviewer"})
    audit_data = payload.get("audit") or engine.review_content(draft_data.get("content", ""), draft_data.get("title", ""))
    pdf_bytes = generate_audit_certificate_pdf(draft_data, audit_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=TechFusion_Brand_Certificate_{draft_data.get('id', 'DOC')}.pdf"}
    )

# Static files mounting
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(static_dir, "index.html")
    return FileResponse(index_file)
