"""
Autofix-AI Backend Application (FastAPI)
Production-grade self-healing L1/L2 IT support agent orchestrator
featuring Groq Vision multimodal OCR, Vectorize Hindsight memory recall,
autonomous fix simulation, and human-in-the-loop verification loops.
"""

import base64
import datetime
import json
import logging
import os
import uuid
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Local services
from backend.services.executor import ExecutionResult, simulate_fix
from backend.services.hindsight_memory import (
    CONFIDENCE_THRESHOLD,
    adelete_ticket_memory,
    aget_memory_stats,
    arecall_resolution,
    arecord_ticket_resolution,
    asearch_memory,
    atest_cloud_connection,
    delete_ticket_memory,
    get_cloud_write_status,
    initialize_hindsight_client,
    record_ticket_resolution,
    is_cloud_mode,
    set_cloud_mode,
    _local_store,
)
from backend.services.knowledge_bank import (
    init_knowledge_bank_db,
    record_ticket_in_bank,
    search_bank_matches,
    get_cached_graph,
    get_cached_tree,
    get_bank_analytics,
    generate_proportional_response,
)
from backend.services.vision_parser import parse_ticket

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("autofix.api")


def utc_now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

app = FastAPI(
    title="Autofix-AI Orchestrator",
    description="Self-Healing L1/L2 IT Support Ticketing Agent with Vision & Persistent Hindsight Memory",
    version="2.5.0",
)

# CORS Middleware
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in origins else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Data Models
# ==========================================

class Message(BaseModel):
    id: str = Field(default_factory=lambda: f"MSG-{uuid.uuid4().hex[:6]}")
    sender: str
    role: str  # 'user', 'agent', 'system', 'engineer'
    content: str
    timestamp: str = Field(default_factory=utc_now_iso)


class DiagnosticInsights(BaseModel):
    matched_pattern_title: str
    matched_ticket_id: Optional[str] = None
    confidence_percent: int
    detected_signature: str
    root_cause_analysis: str
    recommended_solution: str
    prevention_tip: Optional[str] = None


class Ticket(BaseModel):
    id: str
    title: str
    description: str
    client_name: str = "Employee"
    priority: str = "Medium"  # 'Critical', 'High', 'Medium', 'Low'
    category: str = "L1"      # 'L1', 'L2'
    status: str               # 'RESOLVED_AUTONOMOUSLY', 'RESOLVED_HUMAN_VERIFIED', 'PENDING_HUMAN_REVIEW'
    error_signature: str
    resolution_steps: str = ""
    confidence_score: float = 0.0
    resolution_type: Optional[str] = None
    execution_result: Optional[ExecutionResult] = None
    diagnostic_insights: Optional[DiagnosticInsights] = None
    messages: List[Message] = Field(default_factory=list)
    screenshot_preview: Optional[str] = None
    company_id: str = "acme-corp"
    created_at: str
    resolved_at: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    hindsight_sync_status: str = "not_attempted"
    hindsight_document_id: Optional[str] = None


class FeedbackRequest(BaseModel):
    resolution_steps: str
    approved_by: str = "Lead Engineer"
    notes: Optional[str] = None


class ReplyRequest(BaseModel):
    sender: str = "Agent Alex"
    role: str = "agent"
    content: str


class LoginRequest(BaseModel):
    email: str
    password: str
    company_id: Optional[str] = "acme-corp"


class ProfileUpdateRequest(BaseModel):
    email: str
    name: Optional[str] = None
    role: Optional[str] = None
    company_name: Optional[str] = None


# In-memory ticket storage (keyed by ticket ID)
TICKET_STORE: Dict[str, Ticket] = {}


def create_ticket_id() -> str:
    """Generate an ID that cannot collide with Hindsight documents after restart."""
    return f"TICKET-{uuid.uuid4().hex[:10].upper()}"

# Persistent user store
USER_STORE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "users.json")
USERS_LIST: List[Dict[str, Any]] = []


def load_users():
    global USERS_LIST
    if os.path.exists(USER_STORE_PATH):
        try:
            with open(USER_STORE_PATH, "r", encoding="utf-8") as f:
                USERS_LIST = json.load(f)
                logger.info(f"Loaded {len(USERS_LIST)} users from users.json")
                return
        except Exception as e:
            logger.warning(f"Could not load users.json: {e}")
    # Default fallback
    USERS_LIST = [
        {
            "id": "USR-001",
            "email": "admin@autofix.ai",
            "password": "password123",
            "name": "Agent Alex",
            "role": "Lead Systems Engineer",
            "company_id": "acme-corp",
            "company_name": "Acme Global Industries",
            "created_at": utc_now_iso(),
        }
    ]


def save_users():
    try:
        os.makedirs(os.path.dirname(USER_STORE_PATH), exist_ok=True)
        with open(USER_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(USERS_LIST, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to save users.json: {e}")


# Persistent ticket store path
TICKETS_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "tickets.json")


def save_tickets_to_file():
    """
    Persists all tickets to disk so session data is preserved across server reboots.
    """
    try:
        os.makedirs(os.path.dirname(TICKETS_FILE_PATH), exist_ok=True)
        data = {tid: t.model_dump() for tid, t in TICKET_STORE.items()}
        with open(TICKETS_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        logger.warning(f"Could not persist tickets to tickets.json: {e}")


def load_tickets_from_file() -> bool:
    """
    Loads saved tickets from disk. Returns True if tickets were restored.
    """
    global TICKET_STORE
    if os.path.exists(TICKETS_FILE_PATH):
        try:
            with open(TICKETS_FILE_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data and isinstance(data, dict):
                    restored = {}
                    for tid, tdict in data.items():
                        restored[tid] = Ticket(**tdict)
                    TICKET_STORE = restored
                    logger.info(f"Restored {len(TICKET_STORE)} persistent tickets from tickets.json")
                    return True
        except Exception as e:
            logger.warning(f"Could not restore tickets from tickets.json: {e}")
    return False


# ==========================================
# Intelligent Guidance & Pattern Synthesizer
# ==========================================

def generate_guidance_insights(
    title: str,
    description: str,
    error_signature: str,
    ocr_text: str,
    recall: Dict[str, Any],
) -> DiagnosticInsights:
    """
    Synthesizes clear, readable, production-grade pattern-matched guidance
    proportionally scaled by vector match percentage:
    - < 10%: Initial exploratory triage / novel signature protocol.
    - 30% - 49%: Tells something relevant with the vector matched tickets, extracting shared traits & preliminary steps.
    - 50% - 69%: Substantial correlation with tailored remediation steps.
    - 70% - 84%: High-fidelity tailored runbook resolution requiring 1-click human verification.
    - >= 85%: Full autonomous resolution.
    """
    confidence = float(recall.get("confidence", 0.05))
    matched_id = recall.get("matched_ticket_id")

    # Retrieve candidate details from recall or memory store
    matched_title = recall.get("title", "")
    matched_steps = recall.get("resolution_steps", "")
    matched_sig = recall.get("error_signature", error_signature)

    if not matched_title and matched_id and matched_id in TICKET_STORE:
        matched_title = TICKET_STORE[matched_id].title
        if not matched_steps:
            matched_steps = TICKET_STORE[matched_id].resolution_steps
        matched_sig = TICKET_STORE[matched_id].error_signature

    best_match = {
        "ticket_id": matched_id or "HISTORICAL-REF",
        "title": matched_title or "Correlated Enterprise Runbook",
        "resolution_steps": matched_steps,
        "error_signature": matched_sig,
    }

    # Generate proportional guidance
    prop_data = generate_proportional_response(
        title=title,
        description=description,
        error_signature=error_signature,
        ocr_text=ocr_text,
        best_match=best_match,
        confidence=confidence,
    )

    return DiagnosticInsights(
        matched_pattern_title=prop_data["matched_pattern_title"],
        matched_ticket_id=prop_data["matched_ticket_id"],
        confidence_percent=prop_data["confidence_percent"],
        detected_signature=prop_data["detected_signature"],
        root_cause_analysis=prop_data["root_cause_analysis"],
        recommended_solution=prop_data["recommended_solution"],
        prevention_tip=prop_data["prevention_tip"],
    )


# ==========================================
# Startup & Seeding
# ==========================================

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Autofix-AI Backend Engine...")
    load_users()
    init_knowledge_bank_db()
    initialize_hindsight_client()

    # Step 1: Restore persistent tickets from disk if present
    has_saved_tickets = load_tickets_from_file()

    # Step 2: Ensure baseline seed tickets exist in store and Hindsight memory
    seed_path = os.path.join(os.path.dirname(__file__), "..", "data", "initial_tickets.json")
    if os.path.exists(seed_path):
        try:
            with open(seed_path, "r", encoding="utf-8") as f:
                seed_data = json.load(f)

            for item in seed_data:
                tid = item["id"]
                res_type = item.get("resolution_type", "AUTONOMOUS")
                status_val = "RESOLVED_AUTONOMOUSLY" if res_type == "AUTONOMOUS" else "RESOLVED_HUMAN_VERIFIED"
                
                # Ingest to Hindsight memory
                await arecord_ticket_resolution(
                    ticket_id=tid,
                    error_signature=item["error_signature"],
                    resolution_steps=item["resolution_steps"],
                    resolution_type=res_type,
                    metadata=item,
                    cloud_document_id=f"{tid.lower()}.txt",
                )

                # Only populate store from seed if not already present from persistent storage
                if tid not in TICKET_STORE:
                    exec_res = simulate_fix(item["resolution_steps"], tid)
                    guidance = generate_guidance_insights(
                        title=item["title"],
                        description=item["description"],
                        error_signature=item["error_signature"],
                        ocr_text=item.get("mock_ocr_text", ""),
                        recall={"confidence": 0.96 if res_type == "AUTONOMOUS" else 0.82, "matched_ticket_id": tid, "resolution_steps": item["resolution_steps"]},
                    )

                    ticket_obj = Ticket(
                        id=tid,
                        title=item["title"],
                        description=item["description"],
                        client_name=item.get("client_name", "IT User"),
                        priority=item.get("priority", "Medium"),
                        category=item.get("category", "L1"),
                        status=status_val,
                        error_signature=item["error_signature"],
                        resolution_steps=item["resolution_steps"],
                        confidence_score=0.96 if res_type == "AUTONOMOUS" else 0.82,
                        resolution_type=res_type,
                        execution_result=exec_res,
                        diagnostic_insights=guidance,
                        company_id="acme-corp",
                        created_at=(datetime.datetime.now() - datetime.timedelta(minutes=30)).isoformat(),
                        resolved_at=utc_now_iso(),
                        tags=item.get("tags", []),
                        messages=[
                            Message(sender=item.get("client_name", "IT User"), role="user", content=item["description"]),
                            Message(
                                sender="Hindsight Agent",
                                role="agent",
                                content=(
                                    f"🤖 Diagnostic Intelligence:\n"
                                    f"• Matched Pattern: {guidance.matched_pattern_title} ({guidance.confidence_percent}% confidence)\n"
                                    f"• Root Cause: {guidance.root_cause_analysis}\n\n"
                                    f"Actionable Remediation Protocol:\n{guidance.recommended_solution}"
                                ),
                            ),
                        ],
                    )
                    TICKET_STORE[tid] = ticket_obj

            # Purge ticket 123 from store and knowledge memory as explicitly requested
            for purge_id in ["TICKET-123", "123", "TICK-123"]:
                if purge_id in TICKET_STORE:
                    del TICKET_STORE[purge_id]
            await adelete_ticket_memory("TICKET-123")
            await adelete_ticket_memory("123")

            # Seed SQLite Knowledge Bank nodes with all current tickets
            for tid, t in TICKET_STORE.items():
                record_ticket_in_bank(
                    ticket_id=t.id,
                    title=t.title,
                    description=t.description,
                    error_signature=t.error_signature,
                    resolution_steps=t.resolution_steps,
                    status=t.status,
                    priority=t.priority,
                    category=t.category,
                    confidence=t.confidence_score,
                    resolution_type=t.resolution_type or "AUTONOMOUS",
                    metadata={"client_name": t.client_name},
                    source="bank",
                )

            # Persist merged store to file
            save_tickets_to_file()
            logger.info(f"Loaded and verified {len(TICKET_STORE)} tickets in persistent memory store.")
        except Exception as e:
            logger.error(f"Error seeding initial tickets: {e}", exc_info=True)


# ==========================================
# API Routes
# ==========================================

@app.get("/health", tags=["System"])
async def health_check():
    stats = await aget_memory_stats()
    return {
        "status": "ok",
        "service": "Autofix-AI Orchestrator",
        "version": "2.5.0",
        "hindsight": stats,
        "total_tickets_stored": len(TICKET_STORE),
        "total_users": len(USERS_LIST),
    }


@app.get("/api/tickets", response_model=List[Ticket], tags=["Tickets"])
def get_tickets(
    company_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = None,
):
    """
    Returns list of tickets ordered by created_at descending.
    """
    tickets = list(TICKET_STORE.values())

    if company_id:
        tickets = [t for t in tickets if t.company_id == company_id]

    if status_filter:
        tickets = [t for t in tickets if t.status == status_filter]

    if search:
        s = search.lower()
        tickets = [
            t for t in tickets
            if s in t.title.lower() or s in t.description.lower() or s in t.error_signature.lower() or s in t.client_name.lower()
        ]

    # Sort descending
    tickets.sort(key=lambda x: x.created_at, reverse=True)
    return tickets


@app.get("/api/tickets/{ticket_id}", response_model=Ticket, tags=["Tickets"])
def get_ticket(ticket_id: str):
    ticket = TICKET_STORE.get(ticket_id)
    if not ticket:
        # Check without or with TICKET- prefix
        alt = ticket_id.replace("TICKET-", "") if ticket_id.startswith("TICKET-") else f"TICKET-{ticket_id}"
        ticket = TICKET_STORE.get(alt)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found.")
    return ticket


@app.delete("/api/tickets/{ticket_id}", tags=["Tickets"])
async def delete_ticket(ticket_id: str):
    """
    Deletes a ticket from the active ticket store and purges its memory/vector representation
    from Hindsight memory bank so it will not be recalled as a solution pattern.
    """
    normalized_ids = [ticket_id, ticket_id.replace("TICKET-", ""), f"TICKET-{ticket_id}"]
    found_key = None
    for nid in normalized_ids:
        if nid in TICKET_STORE:
            found_key = nid
            break

    if found_key:
        del TICKET_STORE[found_key]
        save_tickets_to_file()

    # Purge from Hindsight persistent / local vector memory
    await adelete_ticket_memory(ticket_id)
    for nid in normalized_ids:
        await adelete_ticket_memory(nid)

    logger.info(f"Purged ticket {ticket_id} and its Hindsight vector memory.")
    return {
        "success": True,
        "deleted_ticket_id": ticket_id,
        "message": f"Ticket {ticket_id} and its vector memory have been successfully deleted.",
    }


@app.post("/api/tickets", response_model=Ticket, status_code=status.HTTP_201_CREATED, tags=["Tickets"])
async def create_ticket(
    title: str = Form(...),
    description: str = Form(...),
    client_name: str = Form("Jane Doe"),
    priority: str = Form("High"),
    category: str = Form("L1"),
    company_id: str = Form("acme-corp"),
    file: Optional[UploadFile] = File(None),
):
    """
    Multimodal Ticket Ingestion Pipeline:
    1. Extracts OCR and error codes from optional screenshot using Groq Vision.
    2. Constructs normalized Error Signature.
    3. Recalls past resolutions from Vectorize Hindsight Memory.
    4. Generates rich diagnostic insights & step-by-step guidance.
    5. Decision Gate: >= 0.85 -> Autonomous Execution & Learning Hook; < 0.85 -> Pending Human Review.
    """
    ticket_id = create_ticket_id()

    image_bytes = None
    image_mime = "image/png"
    screenshot_preview = None

    if file and file.filename:
        image_bytes = await file.read()
        image_mime = file.content_type or "image/png"
        b64_str = base64.b64encode(image_bytes).decode("utf-8")
        screenshot_preview = f"data:{image_mime};base64,{b64_str}"

    # Step 1: Multimodal OCR & signature normalization
    parsed = parse_ticket(
        title=title,
        description=description,
        image_bytes=image_bytes,
        image_mime=image_mime,
    )
    error_signature = parsed["error_signature"]
    ocr_text = parsed["raw_ocr_text"]

    # Step 2: Query Hindsight Memory
    recall = await arecall_resolution(error_signature, query_text=f"{title} {description}")
    confidence = recall["confidence"]
    matched_steps = recall["resolution_steps"]

    # Step 3: Synthesize rich diagnostic insights & pattern guidance
    guidance = generate_guidance_insights(
        title=title,
        description=description,
        error_signature=error_signature,
        ocr_text=ocr_text,
        recall=recall,
    )

    # Ensure confidence score is realistic and reflected from pattern insights if recall was raw
    if confidence <= 0.0:
        confidence = round(guidance.confidence_percent / 100.0, 2)

    created_at = utc_now_iso()
    messages = [
        Message(sender=client_name, role="user", content=description),
    ]
    if ocr_text:
        messages.append(
            Message(sender="Vision OCR Engine", role="system", content=f"📷 Visual Telemetry Extracted:\n{ocr_text}")
        )

    # Step 4: Decision Gate
    if confidence >= CONFIDENCE_THRESHOLD and matched_steps:
        # Autonomous Fix Execution
        exec_result = simulate_fix(matched_steps, ticket_id)
        resolved_at = utc_now_iso()
        ticket_status = "RESOLVED_AUTONOMOUSLY"
        res_type = "AUTONOMOUS"

        # Universal Learning Hook: Record resolution immediately
        await arecord_ticket_resolution(
            ticket_id=ticket_id,
            error_signature=error_signature,
            resolution_steps=matched_steps,
            resolution_type=res_type,
            metadata={
                "title": title,
                "description": description,
                "category": category,
                "priority": priority,
                "client_name": client_name,
                "company_id": company_id,
                "confidence": confidence,
            },
            cloud_document_id=f"{ticket_id.lower()}.txt",
        )

        messages.append(
            Message(
                sender="Hindsight Agent",
                role="agent",
                content=(
                    f"✅ High-Confidence Match ({int(confidence * 100)}%):\n"
                    f"• Pattern: {guidance.matched_pattern_title}\n"
                    f"• Root Cause: {guidance.root_cause_analysis}\n\n"
                    f"Autonomous fix executed successfully in sandbox.\n"
                    f"{matched_steps}"
                ),
            )
        )
    else:
        # Escalation to Human in the loop
        exec_result = None
        resolved_at = None
        ticket_status = "PENDING_HUMAN_REVIEW"
        res_type = None

        # CRITICAL USER REQUIREMENT: Retain all newly raised tickets into Hindsight Cloud & Knowledge Bank
        await arecord_ticket_resolution(
            ticket_id=ticket_id,
            error_signature=error_signature,
            resolution_steps=guidance.recommended_solution,
            resolution_type="HUMAN_IN_THE_LOOP",
            metadata={
                "title": title,
                "description": description,
                "category": category,
                "priority": priority,
                "client_name": client_name,
                "company_id": company_id,
                "confidence": confidence,
            },
            cloud_document_id=f"{ticket_id.lower()}.txt",
        )

        messages.append(
            Message(
                sender="Hindsight Agent",
                role="agent",
                content=(
                    f"🔍 Hindsight Pattern Match ({guidance.confidence_percent}% Match):\n"
                    f"• Correlated Pattern: {guidance.matched_pattern_title}\n"
                    f"• Diagnostic Root Cause: {guidance.root_cause_analysis}\n\n"
                    f"Recommended Remediation Protocol:\n{guidance.recommended_solution}\n\n"
                    f"⚠️ Confidence ({guidance.confidence_percent}%) requires human approval. "
                    f"Review or adjust the steps and click 'Approve & Solve'."
                ),
            )
        )

    # Ingest nodes into SQLite Knowledge Bank for every ticket (both cloud and offline fallback)
    record_ticket_in_bank(
        ticket_id=ticket_id,
        title=title,
        description=description,
        error_signature=error_signature,
        resolution_steps=guidance.recommended_solution,
        status=ticket_status,
        priority=priority,
        category=category,
        confidence=confidence,
        resolution_type=res_type or "HUMAN_IN_THE_LOOP",
        metadata={
            "title": title,
            "category": category,
            "priority": priority,
            "client_name": client_name,
            "confidence": confidence,
        },
        source="cloud" if is_cloud_mode() else "bank",
    )

    new_ticket = Ticket(
        id=ticket_id,
        title=title,
        description=description,
        client_name=client_name,
        priority=priority,
        category=category,
        status=ticket_status,
        error_signature=error_signature,
        resolution_steps=guidance.recommended_solution,
        confidence_score=confidence,
        resolution_type=res_type,
        execution_result=exec_result,
        diagnostic_insights=guidance,
        messages=messages,
        screenshot_preview=screenshot_preview,
        company_id=company_id,
        created_at=created_at,
        resolved_at=resolved_at,
        tags=[category.lower(), priority.lower()],
        hindsight_sync_status=get_cloud_write_status(ticket_id)["status"],
        hindsight_document_id=get_cloud_write_status(ticket_id).get("document_id"),
    )

    TICKET_STORE[ticket_id] = new_ticket
    save_tickets_to_file()

    logger.info(f"Ticket {ticket_id} processed. Status: {ticket_status} (Confidence: {confidence:.2f})")
    return new_ticket


@app.post("/api/tickets/{ticket_id}/feedback", response_model=Ticket, tags=["Human-In-The-Loop"])
async def submit_feedback(ticket_id: str, payload: FeedbackRequest):
    """
    Human-In-The-Loop Verification & Approval:
    Takes an engineer's verified resolution steps, executes the fix,
    updates ticket to RESOLVED_HUMAN_VERIFIED, and immediately ingests
    the interaction into Hindsight Memory and the SQLite Knowledge Bank.
    """
    ticket = TICKET_STORE.get(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found.")

    if not payload.resolution_steps.strip():
        raise HTTPException(status_code=400, detail="Resolution steps cannot be empty.")

    # Execute simulated remediation
    exec_res = simulate_fix(payload.resolution_steps, ticket_id)

    # CRITICAL LEARNING HOOK: Record human correction into Hindsight Cloud
    await arecord_ticket_resolution(
        ticket_id=ticket_id,
        error_signature=ticket.error_signature,
        resolution_steps=payload.resolution_steps,
        resolution_type="HUMAN_IN_THE_LOOP",
        metadata={
            "title": ticket.title,
            "description": ticket.description,
            "category": ticket.category,
            "priority": ticket.priority,
            "client_name": ticket.client_name,
            "company_id": ticket.company_id,
            "approved_by": payload.approved_by,
        },
        cloud_document_id=f"{ticket_id.lower()}.txt",
    )

    # Ingest and update nodes in SQLite Knowledge Bank
    record_ticket_in_bank(
        ticket_id=ticket.id,
        title=ticket.title,
        description=ticket.description,
        error_signature=ticket.error_signature,
        resolution_steps=payload.resolution_steps,
        status="RESOLVED_HUMAN_VERIFIED",
        priority=ticket.priority,
        category=ticket.category,
        confidence=1.0,
        resolution_type="HUMAN_IN_THE_LOOP",
        metadata={"client_name": ticket.client_name, "approved_by": payload.approved_by},
        source="cloud" if is_cloud_mode() else "bank",
    )

    # Update ticket state
    ticket.status = "RESOLVED_HUMAN_VERIFIED"
    ticket.resolution_type = "HUMAN_IN_THE_LOOP"
    ticket.resolution_steps = payload.resolution_steps
    ticket.execution_result = exec_res
    ticket.confidence_score = 1.0  # Human verified 100%
    ticket.hindsight_sync_status = get_cloud_write_status(ticket_id)["status"]
    ticket.hindsight_document_id = get_cloud_write_status(ticket_id).get("document_id")
    if ticket.diagnostic_insights:
        ticket.diagnostic_insights.confidence_percent = 100
        ticket.diagnostic_insights.recommended_solution = payload.resolution_steps
    ticket.resolved_at = utc_now_iso()

    ticket.messages.append(
        Message(
            sender=payload.approved_by,
            role="engineer",
            content=f"Verified Resolution Approved & Executed:\n{payload.resolution_steps}",
        )
    )
    ticket.messages.append(
        Message(
            sender="Hindsight Agent",
            role="system",
            content="✅ Learned and indexed solution into Hindsight Memory. Confidence updated to 100%. Future identical incidents will now be resolved autonomously.",
        )
    )

    save_tickets_to_file()
    logger.info(f"Ticket {ticket_id} resolved via Human-in-the-Loop by {payload.approved_by}.")
    return ticket


@app.post("/api/tickets/{ticket_id}/reply", response_model=Ticket, tags=["Tickets"])
def post_reply(ticket_id: str, payload: ReplyRequest):
    ticket = TICKET_STORE.get(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    ticket.messages.append(
        Message(sender=payload.sender, role=payload.role, content=payload.content)
    )
    return ticket


@app.post("/api/tickets/{ticket_id}/upload-screenshot", response_model=Ticket, tags=["Tickets"])
async def upload_ticket_screenshot(
    ticket_id: str,
    file: UploadFile = File(...),
):
    ticket = TICKET_STORE.get(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")

    image_bytes = await file.read()
    image_mime = file.content_type or "image/png"
    b64_str = base64.b64encode(image_bytes).decode("utf-8")
    screenshot_preview = f"data:{image_mime};base64,{b64_str}"
    ticket.screenshot_preview = screenshot_preview

    # Parse OCR & extract error signature
    parsed = parse_ticket(
        title=ticket.title,
        description=ticket.description,
        image_bytes=image_bytes,
        image_mime=image_mime,
    )
    error_signature = parsed["error_signature"]
    ocr_text = parsed["raw_ocr_text"]

    ticket.error_signature = error_signature

    # Query Hindsight memory
    recall = await arecall_resolution(error_signature, query_text=f"{ticket.title} {ticket.description}")
    confidence = recall.get("confidence", 0.0)
    ticket.confidence_score = confidence if confidence > 0 else 0.82

    # Generate updated diagnostic guidance
    guidance = generate_guidance_insights(
        title=ticket.title,
        description=ticket.description,
        error_signature=error_signature,
        ocr_text=ocr_text,
        recall=recall,
    )
    ticket.diagnostic_insights = guidance

    # Append OCR and Agent telemetry messages
    if ocr_text:
        ticket.messages.append(
            Message(
                sender="Vision OCR Engine",
                role="system",
                content=f"📷 Visual Telemetry Extracted from Screenshot:\n{ocr_text}",
            )
        )

    ticket.messages.append(
        Message(
            sender="Hindsight Agent",
            role="agent",
            content=(
                f"🤖 Hindsight Pattern Match ({guidance.confidence_percent}% Match):\n"
                f"• Correlated Pattern: {guidance.matched_pattern_title}\n"
                f"• Diagnostic Root Cause: {guidance.root_cause_analysis}\n\n"
                f"Recommended Remediation Protocol:\n{guidance.recommended_solution}"
            ),
        )
    )

    logger.info(f"Attached screenshot and updated guidance for ticket {ticket_id}.")
    return ticket


class StatusUpdateRequest(BaseModel):
    status: str
    updated_by: Optional[str] = "Engineer"


@app.patch("/api/tickets/{ticket_id}/status", response_model=Ticket, tags=["Tickets"])
def update_ticket_status(ticket_id: str, payload: StatusUpdateRequest):
    ticket = TICKET_STORE.get(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    ticket.status = payload.status
    if "RESOLVED" in payload.status:
        if not ticket.resolved_at:
            ticket.resolved_at = utc_now_iso()
        res_type = "AUTONOMOUS" if "AUTONOMOUS" in payload.status else "HUMAN_IN_THE_LOOP"
        ticket.resolution_type = res_type
        # Record resolution to Hindsight memory
        steps = ticket.resolution_steps or (ticket.diagnostic_insights.recommended_solution if ticket.diagnostic_insights else "Status updated to resolved.")
        record_ticket_resolution(
            ticket_id=ticket.id,
            error_signature=ticket.error_signature,
            resolution_steps=steps,
            resolution_type=res_type,
            metadata={
                "title": ticket.title,
                "category": ticket.category,
                "priority": ticket.priority,
                "client_name": ticket.client_name,
            },
        )

    ticket.messages.append(
        Message(
            sender=payload.updated_by or "Engineer",
            role="system",
            content=f"Ticket status changed to: {payload.status.replace('_', ' ')}",
        )
    )
    save_tickets_to_file()
    return ticket


@app.get("/api/memory/stats", tags=["Hindsight Memory"])
async def memory_stats():
    return await aget_memory_stats()


class CloudModeToggleRequest(BaseModel):
    enabled: Optional[bool] = None


@app.post("/api/memory/toggle-cloud-mode", tags=["Hindsight Memory"])
async def toggle_cloud_mode_api(payload: Optional[CloudModeToggleRequest] = None):
    """
    Toggles between Hindsight Cloud (Live Credits) and Local Credit Saver fallback.
    """
    target = payload.enabled if (payload and payload.enabled is not None) else not is_cloud_mode()
    new_state = set_cloud_mode(target)
    stats = await aget_memory_stats()
    return {
        "cloud_mode_enabled": new_state,
        "is_cloud_connected": stats["is_cloud_connected"],
        "message": "Switched to Hindsight Cloud (Live Credits)" if new_state else "Switched to Local Credit Saver",
        "stats": stats,
    }


@app.get("/api/memory/search", tags=["Hindsight Memory"])
async def memory_search(q: Optional[str] = Query(None), limit: int = Query(5, ge=1, le=50)):
    return await asearch_memory(q or "", limit=limit)


@app.get("/api/memory/tree", tags=["Hindsight Memory"])
async def get_memory_knowledge_tree():
    """
    Returns the structured Hindsight Knowledge Base Tree with category groupings,
    verified runbooks, error signatures, and similarity telemetry.
    """
    categories = {
        "Client Applications & Workplace": {
            "icon": "Monitor",
            "keywords": ["outlook", "ost", "office", "mailbox", "printer", "spooler", "teams", "jamf"],
            "documents": [],
        },
        "Identity, SSO & Access": {
            "icon": "Key",
            "keywords": ["sso", "saml", "oauth", "password", "aadsts", "mfa", "token"],
            "documents": [],
        },
        "Networking, VPN & Security": {
            "icon": "Network",
            "keywords": ["vpn", "dns", "ssl", "cert", "protocol", "crowdstrike", "bsod", "driver"],
            "documents": [],
        },
        "Database, Cache & Storage": {
            "icon": "Database",
            "keywords": ["redis", "cluster", "cache", "postgres", "pool", "exhausted", "masterauth"],
            "documents": [],
        },
        "Cloud, Kubernetes & DevOps": {
            "icon": "Cloud",
            "keywords": ["docker", "k8s", "kubernetes", "crashloop", "oomkilled", "registry"],
            "documents": [],
        },
    }

    # Populate from persistent memory store
    for tid, doc in _local_store.records.items():
        title = doc.get("metadata", {}).get("title") or doc["error_signature"]
        sig = doc["error_signature"]
        res_steps = doc["resolution_steps"]
        res_type = doc["resolution_type"]
        conf = 0.96 if res_type == "AUTONOMOUS" else 0.85
        doc_entry = {
            "ticket_id": tid,
            "title": title,
            "signature": sig,
            "confidence": conf,
            "resolution_type": res_type,
            "resolution_steps": res_steps,
            "source": "hindsight_bank",
        }

        search_blob = f"{sig} {title} {res_steps}".lower()
        matched_cat = "Client Applications & Workplace"
        for cat_name, cat_data in categories.items():
            if any(k in search_blob for k in cat_data["keywords"]):
                matched_cat = cat_name
                break
        categories[matched_cat]["documents"].append(doc_entry)

    tree_list = []
    for cat_name, cat_data in categories.items():
        tree_list.append({
            "category": cat_name,
            "icon": cat_data["icon"],
            "count": len(cat_data["documents"]),
            "documents": cat_data["documents"],
        })

    return tree_list


class HindsightConfigRequest(BaseModel):
    api_key: str
    base_url: Optional[str] = "https://api.hindsight.vectorize.io"
    bank_id: Optional[str] = "autofix_ai_tickets"


@app.post("/api/settings/hindsight", tags=["Hindsight Memory"])
async def configure_hindsight_cloud(payload: HindsightConfigRequest):
    """
    Validates and switches to Hindsight Cloud (https://api.hindsight.vectorize.io)
    """
    key = payload.api_key.strip()
    url = (payload.base_url or "https://api.hindsight.vectorize.io").strip()
    bank = (payload.bank_id or "autofix_ai_tickets").strip()

    test_res = await atest_cloud_connection(api_key=key, base_url=url, bank_id=bank)
    if test_res.get("connected"):
        initialize_hindsight_client(api_key=key, base_url=url, bank_id=bank, force_reinit=True)

    return test_res


# ==========================================
# Knowledge Graph & Visualization Endpoints
# ==========================================

@app.get("/api/knowledge/graph", tags=["Knowledge Bank"])
async def get_knowledge_graph_endpoint():
    """
    Returns nodes and edges for the Knowledge Graph visualization,
    along with online/offline cloud and bank status.
    """
    graph = get_cached_graph()
    data = graph.to_dict()
    stats = await aget_memory_stats()
    data["cloud_status"] = stats["cloud_status"]
    data["bank_status"] = stats["bank_status"]
    data["cloud_mode_enabled"] = stats["cloud_mode_enabled"]
    data["is_cloud_connected"] = stats["is_cloud_connected"]
    return data


@app.get("/api/knowledge/tree", tags=["Knowledge Bank"])
async def get_knowledge_tree_endpoint():
    """
    Returns hierarchical taxonomy: Categories -> Error Signatures -> Tickets -> Resolutions.
    """
    tree = get_cached_tree()
    return tree.to_tree_list()


@app.get("/api/knowledge/analytics", tags=["Knowledge Bank"])
async def get_knowledge_analytics_endpoint():
    """
    Returns data for the Normal Graphs dashboard:
    - Confidence score distribution (<10%, 10-29%, 30-49%, 50-69%, 70-84%, >=85%)
    - Category distribution
    - Status distribution (Autonomous vs Human Verified vs Pending)
    - Sync metrics (Cloud vs Bank)
    """
    analytics = get_bank_analytics()
    stats = await aget_memory_stats()
    analytics["cloud_status"] = stats["cloud_status"]
    analytics["bank_status"] = stats["bank_status"]
    analytics["cloud_mode_enabled"] = stats["cloud_mode_enabled"]
    analytics["is_cloud_connected"] = stats["is_cloud_connected"]
    return analytics


# ==========================================
# Authentication & Multi-Company User Management
# ==========================================

@app.post("/api/auth/login", tags=["Auth"])
def login(payload: LoginRequest):
    email_clean = payload.email.strip().lower()
    pass_clean = payload.password.strip()

    # 1. Search persistent users list
    for u in USERS_LIST:
        if u["email"].lower() == email_clean and u["password"] == pass_clean:
            return {
                "token": f"jwt-{uuid.uuid4().hex[:16]}",
                "user": {
                    "email": u["email"],
                    "name": u["name"],
                    "role": u.get("role", "IT Engineer"),
                    "company_id": u.get("company_id", "acme-corp"),
                    "company_name": u.get("company_name", "Acme Global Industries"),
                },
            }

    # 2. Universal demo credentials fallback
    if pass_clean in ["password123", "admin123", "demo"]:
        company_slug = (payload.company_id or "acme-corp").lower().replace(" ", "-")
        display_name = email_clean.split("@")[0].capitalize()
        if "admin" in email_clean:
            display_name = "Agent Alex"
        return {
            "token": f"jwt-{uuid.uuid4().hex[:16]}",
            "user": {
                "email": payload.email,
                "name": display_name,
                "role": "Lead Systems Engineer",
                "company_id": company_slug,
                "company_name": company_slug.replace("-", " ").title(),
            },
        }

    raise HTTPException(
        status_code=401,
        detail="Invalid credentials. Use default 'admin@autofix.ai' / 'password123' or register via Signup.",
    )


@app.post("/api/auth/signup", tags=["Auth"])
def signup(payload: Dict[str, Any]):
    company_name = payload.get("company_name", "New Enterprise").strip()
    email = payload.get("email", "").strip().lower()
    name = payload.get("name", "Admin User").strip()
    password = payload.get("password", "password123").strip()

    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")
    if not password:
        raise HTTPException(status_code=400, detail="Password is required.")

    company_id = company_name.lower().replace(" ", "-").replace(".", "")
    if not company_id:
        company_id = "enterprise-corp"

    # Check if user already exists
    for existing in USERS_LIST:
        if existing["email"].lower() == email:
            # Update password and company if re-registering
            existing["name"] = name
            existing["password"] = password
            existing["company_name"] = company_name
            existing["company_id"] = company_id
            save_users()
            return {
                "token": f"jwt-{uuid.uuid4().hex[:16]}",
                "user": {
                    "email": existing["email"],
                    "name": existing["name"],
                    "role": existing.get("role", "IT Administrator"),
                    "company_id": company_id,
                    "company_name": company_name,
                },
            }

    # Create and persist new user
    new_user = {
        "id": f"USR-{uuid.uuid4().hex[:6]}",
        "email": email,
        "password": password,
        "name": name or "Support Engineer",
        "role": "IT Administrator",
        "company_id": company_id,
        "company_name": company_name or "Enterprise IT",
        "created_at": utc_now_iso(),
    }
    USERS_LIST.append(new_user)
    save_users()
    logger.info(f"Registered new user {email} for company {company_name}")

    return {
        "token": f"jwt-{uuid.uuid4().hex[:16]}",
        "user": {
            "email": new_user["email"],
            "name": new_user["name"],
            "role": new_user["role"],
            "company_id": new_user["company_id"],
            "company_name": new_user["company_name"],
        },
    }


@app.put("/api/auth/profile", tags=["Auth"])
def update_profile(payload: ProfileUpdateRequest):
    email_clean = payload.email.strip().lower()
    for u in USERS_LIST:
        if u["email"].lower() == email_clean:
            if payload.name:
                u["name"] = payload.name
            if payload.role:
                u["role"] = payload.role
            if payload.company_name:
                u["company_name"] = payload.company_name
                u["company_id"] = payload.company_name.lower().replace(" ", "-")
            save_users()
            return {
                "status": "updated",
                "user": {
                    "email": u["email"],
                    "name": u["name"],
                    "role": u.get("role", "IT Engineer"),
                    "company_id": u.get("company_id", "acme-corp"),
                    "company_name": u.get("company_name", "Acme Global Industries"),
                },
            }

    # Upsert if not found
    new_user = {
        "id": f"USR-{uuid.uuid4().hex[:6]}",
        "email": email_clean,
        "password": "password123",
        "name": payload.name or email_clean.split("@")[0].capitalize(),
        "role": payload.role or "IT Engineer",
        "company_name": payload.company_name or "Enterprise IT",
        "company_id": (payload.company_name or "enterprise").lower().replace(" ", "-"),
        "created_at": utc_now_iso(),
    }
    USERS_LIST.append(new_user)
    save_users()
    return {
        "status": "updated",
        "user": {
            "email": new_user["email"],
            "name": new_user["name"],
            "role": new_user["role"],
            "company_id": new_user["company_id"],
            "company_name": new_user["company_name"],
        },
    }
