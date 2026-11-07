"""
Hindsight Memory Layer for Autofix-AI
Integrates with Vectorize Hindsight Cloud API SDK (https://hindsight.vectorize.io/)
Provides persistent agent memory, multi-strategy semantic recall, and reflect reasoning.
Includes local fallback vector memory for offline resilience during testing.
"""

import datetime
import json
import logging
import math
import os
import re
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("autofix.hindsight_memory")
logger.setLevel(logging.INFO)

# Official Hindsight Cloud API endpoint
HINDSIGHT_BASE_URL = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")
HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY", "")
HINDSIGHT_BANK_ID = os.getenv("HINDSIGHT_BANK_ID", "autofix_ai_tickets")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.85"))

_hindsight_client = None
_client_initialized = False


# Local in-memory / persistent fallback memory store
class LocalMemoryStore:
    def __init__(self):
        self.records: Dict[str, Dict[str, Any]] = {}
        self.last_updated = datetime.datetime.now().isoformat()

    def add(self, ticket_id: str, signature: str, resolution: str, res_type: str, metadata: Dict[str, Any]):
        self.records[ticket_id] = {
            "ticket_id": ticket_id,
            "error_signature": signature,
            "resolution_steps": resolution,
            "resolution_type": res_type,
            "metadata": metadata or {},
            "timestamp": datetime.datetime.now().isoformat(),
        }
        self.last_updated = datetime.datetime.now().isoformat()

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        tokens = set(re.findall(r"\w+", query.lower()))
        if not tokens:
            return []

        results = []
        for tid, doc in self.records.items():
            doc_str = f"{doc['error_signature']} {doc['resolution_steps']} {doc.get('metadata', {}).get('title', '')}".lower()
            doc_tokens = set(re.findall(r"\w+", doc_str))
            
            # Token overlap score
            intersection = tokens.intersection(doc_tokens)
            if not intersection:
                continue

            score = len(intersection) / math.sqrt(len(tokens) * len(doc_tokens) + 1e-5)
            # Boost if exact signature match
            if query.upper() in doc['error_signature'].upper():
                score = max(score, 0.95)
            elif any(t in doc['error_signature'].lower() for t in tokens if len(t) > 3):
                score = min(1.0, score + 0.25)

            results.append({
                "ticket_id": tid,
                "confidence": round(min(0.99, score), 3),
                "resolution_steps": doc["resolution_steps"],
                "error_signature": doc["error_signature"],
                "resolution_type": doc["resolution_type"],
                "metadata": doc.get("metadata", {}),
                "timestamp": doc["timestamp"],
            })

        results.sort(key=lambda x: x["confidence"], reverse=True)
        return results[:top_k]


_local_store = LocalMemoryStore()


def initialize_hindsight_client(
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    bank_id: Optional[str] = None,
    force_reinit: bool = False,
):
    """
    Initializes and returns the Vectorize Hindsight Cloud client singleton.
    Supports dynamic reconfiguration at runtime via Settings.
    """
    global _hindsight_client, _client_initialized, HINDSIGHT_API_KEY, HINDSIGHT_BASE_URL, HINDSIGHT_BANK_ID

    if api_key is not None:
        HINDSIGHT_API_KEY = api_key.strip()
        force_reinit = True
    if base_url is not None:
        HINDSIGHT_BASE_URL = base_url.strip()
        force_reinit = True
    if bank_id is not None:
        HINDSIGHT_BANK_ID = bank_id.strip()
        force_reinit = True

    if _client_initialized and not force_reinit:
        return _hindsight_client

    if HINDSIGHT_API_KEY and not HINDSIGHT_API_KEY.startswith("your_hindsight") and len(HINDSIGHT_API_KEY) > 8:
        try:
            from hindsight_client import Hindsight
            _hindsight_client = Hindsight(
                base_url=HINDSIGHT_BASE_URL,
                api_key=HINDSIGHT_API_KEY,
            )
            logger.info(f"Connected to Vectorize Hindsight Cloud at {HINDSIGHT_BASE_URL} (Bank: {HINDSIGHT_BANK_ID})")
        except Exception as e:
            logger.warning(f"Could not connect to Hindsight Cloud: {e}. Using local fallback vector memory.")
            _hindsight_client = None
    else:
        logger.info(f"Hindsight Cloud Key not provided or demo key. Running with local high-speed vector memory. (Target: {HINDSIGHT_BASE_URL})")
        _hindsight_client = None

    _client_initialized = True
    return _hindsight_client


def test_cloud_connection(api_key: str, base_url: str = "https://api.hindsight.vectorize.io", bank_id: str = "autofix_ai_tickets") -> Dict[str, Any]:
    """
    Tests live connectivity to Hindsight Cloud using the provided API key.
    """
    if not api_key or len(api_key.strip()) < 8:
        return {"connected": False, "message": "API key is empty or too short."}

    try:
        from hindsight_client import Hindsight
        test_client = Hindsight(base_url=base_url, api_key=api_key.strip(), timeout=10.0)
        # Attempt recall query as probe
        res = test_client.recall(bank_id=bank_id, query="ping connection health check", max_tokens=100)
        return {
            "connected": True,
            "message": f"Successfully authenticated with Hindsight Cloud at {base_url} (Bank: {bank_id})",
            "base_url": base_url,
            "bank_id": bank_id,
        }
    except Exception as e:
        logger.warning(f"Hindsight Cloud connection test failed: {e}")
        return {
            "connected": False,
            "message": f"Connection to Hindsight Cloud failed: {str(e)}",
            "base_url": base_url,
        }


def recall_resolution(error_signature: str, query_text: str = "") -> Dict[str, Any]:
    """
    Queries Hindsight memory for matching historical error signatures or OCR text patterns.
    Returns confidence score and previous verified resolution steps.
    """
    initialize_hindsight_client()
    search_query = f"{error_signature} {query_text}".strip()

    # 1. Try Vectorize Hindsight Cloud SDK if connected
    if _hindsight_client:
        try:
            results = _hindsight_client.recall(
                bank_id=HINDSIGHT_BANK_ID,
                query=search_query,
                max_tokens=2048,
            )
            if results and hasattr(results, "results") and results.results:
                best = results.results[0]
                text = getattr(best, "text", "")
                
                # Accurately extract score from Hindsight RecallScores schema
                score = 0.88
                if hasattr(best, "scores") and best.scores:
                    score = getattr(best.scores, "final", None) or getattr(best.scores, "semantic", None) or 0.88
                elif hasattr(best, "score"):
                    score = float(best.score)

                doc_id = getattr(best, "document_id", "HINDSIGHT-CLOUD")
                history_texts = [getattr(r, "text", "") for r in results.results[:3]]

                logger.info(f"Hindsight Cloud recall returned match with confidence {score:.2f}")
                return {
                    "found": True,
                    "confidence": float(score),
                    "resolution_steps": text,
                    "matched_ticket_id": doc_id,
                    "history": history_texts,
                    "source": "hindsight_cloud",
                }
        except Exception as e:
            logger.warning(f"Hindsight Cloud recall error: {e}. Falling back to local vector memory.")

    # 2. Local vector memory search
    matches = _local_store.search(search_query)
    if matches:
        best = matches[0]
        return {
            "found": True,
            "confidence": best["confidence"],
            "resolution_steps": best["resolution_steps"],
            "matched_ticket_id": best["ticket_id"],
            "history": matches,
            "source": "local_vector_memory",
        }

    return {
        "found": False,
        "confidence": 0.0,
        "resolution_steps": "",
        "matched_ticket_id": None,
        "history": [],
        "source": "none",
    }


def reflect_resolution(query_text: str) -> Optional[str]:
    """
    Utilizes Hindsight Cloud's reflect API to synthesize reasoned troubleshooting guidance.
    """
    initialize_hindsight_client()
    if _hindsight_client:
        try:
            res = _hindsight_client.reflect(
                bank_id=HINDSIGHT_BANK_ID,
                query=f"Provide concrete L1/L2 IT resolution steps for: {query_text}",
            )
            if res and hasattr(res, "text") and res.text:
                return res.text
        except Exception as e:
            logger.warning(f"Hindsight Cloud reflect query error: {e}")
    return None


def record_ticket_resolution(
    ticket_id: str,
    error_signature: str,
    resolution_steps: str,
    resolution_type: str,
    metadata: Optional[Dict[str, Any]] = None,
    cloud_document_id: Optional[str] = None,
) -> bool:
    """
    Universal Post-Resolution Ingestion Hook.
    Every single time a ticket is marked resolved (Autonomous or Human-in-the-loop),
    this function immediately stores the interaction into Hindsight Cloud.
    """
    if not resolution_steps:
        logger.warning(f"Cannot record resolution for {ticket_id}: empty resolution steps.")
        return False

    res_type = resolution_type.upper()
    if res_type not in ["AUTONOMOUS", "HUMAN_IN_THE_LOOP"]:
        res_type = "HUMAN_IN_THE_LOOP"

    metadata = metadata or {}
    meta_tags = [res_type.lower(), metadata.get("category", "L1").lower()]
    cloud_metadata = {
        key: metadata[key]
        for key in ("category", "priority", "title")
        if isinstance(metadata.get(key), str)
    }

    # Always persist to local vector store
    _local_store.add(ticket_id, error_signature, resolution_steps, res_type, metadata)
    logger.info(f"Recorded ticket {ticket_id} [{res_type}] into vector memory.")

    # Ingest to Vectorize Hindsight Cloud if client available
    initialize_hindsight_client()
    if _hindsight_client:
        try:
            content_payload = (
                f"TICKET_ID: {ticket_id}\n"
                f"ERROR_SIGNATURE: {error_signature}\n"
                f"RESOLUTION_TYPE: {res_type}\n"
                f"RESOLUTION_STEPS:\n{resolution_steps}\n"
                f"METADATA: {json.dumps(cloud_metadata)}"
            )
            _hindsight_client.retain(
                bank_id=HINDSIGHT_BANK_ID,
                content=content_payload,
                document_id=cloud_document_id or ticket_id,
                tags=meta_tags,
                metadata={
                    **cloud_metadata,
                    "signature": error_signature,
                    "type": res_type,
                    "ticket_id": ticket_id,
                },
                update_mode="replace",
            )
            logger.info(
                f"Successfully retained ticket {ticket_id} to Hindsight Cloud "
                f"({HINDSIGHT_BANK_ID}, document: {cloud_document_id or ticket_id})."
            )
        except Exception as e:
            logger.warning(f"Hindsight Cloud retain call failed: {e}. Stored in local fallback.")

    return True


def get_memory_stats() -> Dict[str, Any]:
    """
    Returns current memory bank metrics for the frontend Memory Inspector and Settings view.
    """
    initialize_hindsight_client()
    total_local = len(_local_store.records)
    autonomous_count = sum(1 for r in _local_store.records.values() if r["resolution_type"] == "AUTONOMOUS")
    hitl_count = total_local - autonomous_count
    total_records = total_local
    cloud_connected = False
    last_updated = _local_store.last_updated

    if _hindsight_client:
        try:
            documents = _hindsight_client.documents.list_documents(
                bank_id=HINDSIGHT_BANK_ID,
                limit=1,
                offset=0,
            )
            total_records = documents.total
            cloud_connected = True
            if documents.items and documents.items[0].updated_at:
                last_updated = documents.items[0].updated_at

            autonomous_count = _hindsight_client.documents.list_documents(
                bank_id=HINDSIGHT_BANK_ID,
                tags=["autonomous"],
                tags_match="any_strict",
                limit=1,
                offset=0,
            ).total
            hitl_count = _hindsight_client.documents.list_documents(
                bank_id=HINDSIGHT_BANK_ID,
                tags=["human_in_the_loop"],
                tags_match="any_strict",
                limit=1,
                offset=0,
            ).total
        except Exception as e:
            logger.warning(f"Hindsight Cloud stats request failed: {e}. Reporting local memory stats.")
            total_records = total_local
            autonomous_count = sum(
                1 for r in _local_store.records.values() if r["resolution_type"] == "AUTONOMOUS"
            )
            hitl_count = total_local - autonomous_count
            last_updated = _local_store.last_updated

    return {
        "bank_id": HINDSIGHT_BANK_ID,
        "base_url": HINDSIGHT_BASE_URL,
        "is_cloud_connected": cloud_connected,
        "total_records": total_records,
        "autonomous_resolutions": autonomous_count,
        "human_verified_resolutions": hitl_count,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "last_updated": last_updated,
        "promo_code": "MEMHACK99",
        "cloud_console_url": "https://ui.hindsight.vectorize.io",
        "docs_url": "https://hindsight.vectorize.io/",
        "band_ai_url": "https://www.band.ai",
    }


def search_memory(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search Hindsight Cloud when available, with local vector memory as a fallback.
    """
    initialize_hindsight_client()
    if _hindsight_client:
        try:
            results = _hindsight_client.recall(
                bank_id=HINDSIGHT_BANK_ID,
                query=query,
                max_tokens=max(512, limit * 512),
            )
            cloud_matches = []
            for result in (results.results or [])[:limit]:
                score = 0.0
                if result.scores:
                    score = result.scores.final or result.scores.semantic or 0.0
                metadata = result.metadata or {}
                cloud_matches.append(
                    {
                        "ticket_id": metadata.get("ticket_id") or result.document_id or result.id,
                        "confidence": round(float(score), 3),
                        "resolution_steps": result.text,
                        "error_signature": metadata.get("signature", ""),
                        "resolution_type": metadata.get("type", ""),
                        "metadata": metadata,
                        "timestamp": result.mentioned_at,
                        "source": "hindsight_cloud",
                    }
                )
            if cloud_matches:
                return cloud_matches
        except Exception as e:
            logger.warning(f"Hindsight Cloud memory search failed: {e}. Falling back to local memory.")

    return _local_store.search(query, top_k=limit)
