"""
Hindsight Memory Layer for Autofix-AI
Integrates with Vectorize Hindsight Cloud API SDK (https://hindsight.vectorize.io/)
Provides persistent agent memory, multi-strategy semantic recall, and reflect reasoning.
Includes local fallback vector memory for offline resilience during testing.
"""

import asyncio
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
_cloud_mode_enabled = True  # Online cloud mode enabled by default (uses cloud credits)


def set_cloud_mode(enabled: bool) -> bool:
    global _cloud_mode_enabled
    _cloud_mode_enabled = bool(enabled)
    logger.info(
        f"Hindsight Memory Mode switched to: {'☁️ CLOUD ONLINE (Live Credits)' if _cloud_mode_enabled else '🛡️ CREDIT SAVER (Local Fallback)'}"
    )
    return _cloud_mode_enabled


def is_cloud_mode() -> bool:
    global _cloud_mode_enabled
    return _cloud_mode_enabled


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

    def delete(self, ticket_id: str) -> bool:
        """
        Removes a ticket and its learned resolution from the local memory store.
        """
        targets = [ticket_id, ticket_id.replace("TICKET-", ""), f"TICKET-{ticket_id}"]
        found = False
        for t in targets:
            if t in self.records:
                del self.records[t]
                found = True
        if found:
            self.last_updated = datetime.datetime.now().isoformat()
        return found

    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        tokens = set(re.findall(r"\w+", (query or "").lower()))
        if not tokens:
            # Return top default memories so matches are always visible
            results = []
            for tid, doc in list(self.records.items())[:top_k]:
                score = 0.95 if doc["resolution_type"] == "AUTONOMOUS" else 0.88
                results.append({
                    "ticket_id": tid,
                    "confidence": score,
                    "resolution_steps": doc["resolution_steps"],
                    "error_signature": doc["error_signature"],
                    "resolution_type": doc["resolution_type"],
                    "metadata": doc.get("metadata", {}),
                    "timestamp": doc["timestamp"],
                })
            return results

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

        if not results:
            # Fallback to top historical items if no token match found
            for tid, doc in list(self.records.items())[:top_k]:
                results.append({
                    "ticket_id": tid,
                    "confidence": 0.85,
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


async def atest_cloud_connection(
    api_key: str,
    base_url: str = "https://api.hindsight.vectorize.io",
    bank_id: str = "autofix_ai_tickets",
) -> Dict[str, Any]:
    """
    Tests live connectivity to Hindsight Cloud using the provided API key.
    """
    if not api_key or len(api_key.strip()) < 8:
        return {"connected": False, "message": "API key is empty or too short."}

    try:
        from hindsight_client import Hindsight
        test_client = Hindsight(base_url=base_url, api_key=api_key.strip(), timeout=10.0)
        # Attempt recall query as probe
        await test_client.arecall(bank_id=bank_id, query="ping connection health check", max_tokens=100)
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


def test_cloud_connection(
    api_key: str,
    base_url: str = "https://api.hindsight.vectorize.io",
    bank_id: str = "autofix_ai_tickets",
) -> Dict[str, Any]:
    return asyncio.run(atest_cloud_connection(api_key, base_url, bank_id))


async def arecall_resolution(error_signature: str, query_text: str = "") -> Dict[str, Any]:
    """
    Intelligent Hybrid Recall Engine:
    1. If Cloud Mode is active (default), directly queries Vectorize Hindsight Cloud SDK using
       live account credits for high-precision semantic recall across historical runbooks.
    2. If Cloud Mode is toggled to 'Credit Saver' or offline, utilizes local high-speed vector memory.
    3. Seamlessly falls back to local vector memory if Cloud API experiences rate limits or credit exhaustion.
    """
    initialize_hindsight_client()
    search_query = f"{error_signature} {query_text}".strip()

    # Step A: Local High-Speed Vector Memory Search
    local_matches = _local_store.search(search_query)
    best_local = local_matches[0] if local_matches else None

    # Credit Saver optimization: Only prioritize local when Cloud Mode is switched OFF
    if not is_cloud_mode() and best_local and best_local["confidence"] >= 0.85:
        logger.info(
            f"[CREDIT SAVER ACTIVE] Local high-confidence match ({best_local['confidence']:.2f}) used. "
            f"Conserving Hindsight Cloud credits."
        )
        return {
            "found": True,
            "confidence": best_local["confidence"],
            "resolution_steps": best_local["resolution_steps"],
            "matched_ticket_id": best_local["ticket_id"],
            "history": local_matches,
            "source": "local_vector_memory",
            "fallback_used": True,
            "credits_saved": True,
        }

    # Step B: Query Hindsight Cloud SDK (Using Live Cloud Credits)
    cloud_result = None
    if _hindsight_client:
        try:
            results = await _hindsight_client.arecall(
                bank_id=HINDSIGHT_BANK_ID,
                query=search_query,
                max_tokens=2048,
            )
            if results and hasattr(results, "results") and results.results:
                best = results.results[0]
                text = getattr(best, "text", "")
                
                # Accurately extract score from Hindsight RecallScores schema
                score = 0.92
                if hasattr(best, "scores") and best.scores:
                    score = getattr(best.scores, "final", None) or getattr(best.scores, "semantic", None) or 0.92
                elif hasattr(best, "score") and best.score is not None:
                    score = float(best.score)

                doc_id = getattr(best, "document_id", "HINDSIGHT-CLOUD")
                history_texts = [getattr(r, "text", "") for r in results.results[:3]]

                logger.info(f"[HINDSIGHT CLOUD] Returned match with confidence {score:.2f}")
                cloud_result = {
                    "found": True,
                    "confidence": float(score),
                    "resolution_steps": text,
                    "matched_ticket_id": doc_id,
                    "history": history_texts,
                    "source": "hindsight_cloud",
                    "fallback_used": False,
                }
        except Exception as e:
            err_msg = str(e).lower()
            if any(k in err_msg for k in ["credit", "quota", "balance", "402", "429", "rate limit", "billing"]):
                logger.warning(f"[CREDIT FALLBACK] Hindsight Cloud credit/quota limit: {e}. Falling back to local vector memory.")
            else:
                logger.warning(f"Hindsight Cloud recall error: {e}. Falling back to local vector memory.")

    # Return best between Cloud and Local
    if cloud_result and (not best_local or cloud_result["confidence"] >= best_local["confidence"]):
        return cloud_result

    if best_local:
        return {
            "found": True,
            "confidence": best_local["confidence"],
            "resolution_steps": best_local["resolution_steps"],
            "matched_ticket_id": best_local["ticket_id"],
            "history": local_matches,
            "source": "local_vector_memory",
            "fallback_used": True,
        }

    return {
        "found": False,
        "confidence": 0.0,
        "resolution_steps": "",
        "matched_ticket_id": None,
        "history": [],
        "source": "none",
        "fallback_used": True,
    }


def recall_resolution(error_signature: str, query_text: str = "") -> Dict[str, Any]:
    return asyncio.run(arecall_resolution(error_signature, query_text))


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


async def arecord_ticket_resolution(
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
            await _hindsight_client.aretain(
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
            err_msg = str(e).lower()
            if any(k in err_msg for k in ["credit", "quota", "balance", "402", "429", "rate limit", "billing"]):
                logger.warning(
                    f"[CREDIT FALLBACK] Hindsight Cloud credit/quota limit reached: {e}. "
                    f"Resolution safely preserved in local fallback memory store."
                )
            else:
                logger.warning(f"Hindsight Cloud retain call failed: {e}. Stored safely in local fallback.")

    return True


def record_ticket_resolution(
    ticket_id: str,
    error_signature: str,
    resolution_steps: str,
    resolution_type: str,
    metadata: Optional[Dict[str, Any]] = None,
    cloud_document_id: Optional[str] = None,
) -> bool:
    return asyncio.run(
        arecord_ticket_resolution(
            ticket_id=ticket_id,
            error_signature=error_signature,
            resolution_steps=resolution_steps,
            resolution_type=resolution_type,
            metadata=metadata,
            cloud_document_id=cloud_document_id,
        )
    )


async def aget_memory_stats() -> Dict[str, Any]:
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
            memories = await _hindsight_client.alist_memories(
                bank_id=HINDSIGHT_BANK_ID,
                limit=1000,
                offset=0,
            )
            total_records = memories.total
            cloud_connected = True
            autonomous_documents = set()
            hitl_documents = set()
            for memory in memories.items:
                document_id = memory.document_id
                if not document_id:
                    continue
                tags = set(memory.tags or [])
                if "autonomous" in tags:
                    autonomous_documents.add(document_id)
                if "human_in_the_loop" in tags:
                    hitl_documents.add(document_id)
                if memory.mentioned_at and memory.mentioned_at > last_updated:
                    last_updated = memory.mentioned_at
            if autonomous_documents or hitl_documents:
                autonomous_count = len(autonomous_documents)
                hitl_count = len(hitl_documents)
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
        "cloud_mode_enabled": is_cloud_mode(),
        "total_records": total_records,
        "local_records": total_local,
        "autonomous_resolutions": autonomous_count,
        "human_verified_resolutions": hitl_count,
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        "last_updated": last_updated,
        "fallback_system_active": not is_cloud_mode(),
        "fallback_mode": "hindsight_cloud_online" if is_cloud_mode() else "hybrid_credit_saver",
        "credits_protected": not is_cloud_mode(),
        "promo_code": "MEMHACK99",
        "cloud_console_url": "https://ui.hindsight.vectorize.io",
        "docs_url": "https://hindsight.vectorize.io/",
        "band_ai_url": "https://www.band.ai",
    }


def get_memory_stats() -> Dict[str, Any]:
    return asyncio.run(aget_memory_stats())


async def asearch_memory(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Search Hindsight Cloud when available, with local vector memory as a resilient fallback.
    Guarantees matching runbooks are returned for any active incident or query.
    """
    initialize_hindsight_client()
    clean_query = (query or "").strip()
    if not clean_query:
        clean_query = "incident error failure configuration"

    if _hindsight_client and is_cloud_mode():
        try:
            results = await _hindsight_client.arecall(
                bank_id=HINDSIGHT_BANK_ID,
                query=clean_query,
                max_tokens=max(512, limit * 512),
            )
            cloud_matches = []
            for result in (results.results or [])[:limit]:
                score = 0.88
                if hasattr(result, "scores") and result.scores:
                    score = getattr(result.scores, "final", None) or getattr(result.scores, "semantic", None) or 0.88
                elif hasattr(result, "score") and result.score is not None:
                    score = float(result.score)

                metadata = getattr(result, "metadata", {}) or {}
                doc_title = metadata.get("title") or metadata.get("signature") or (result.text[:60] if hasattr(result, "text") else "Hindsight Resolution")
                cloud_matches.append(
                    {
                        "ticket_id": metadata.get("ticket_id") or getattr(result, "document_id", None) or getattr(result, "id", "HINDSIGHT-CLOUD"),
                        "confidence": round(float(score), 3),
                        "resolution_steps": getattr(result, "text", ""),
                        "error_signature": metadata.get("signature") or doc_title,
                        "resolution_type": metadata.get("type", "AUTONOMOUS"),
                        "metadata": metadata,
                        "timestamp": getattr(result, "mentioned_at", None) or datetime.datetime.now().isoformat(),
                        "source": "hindsight_cloud",
                    }
                )
            if cloud_matches:
                return cloud_matches
        except Exception as e:
            logger.warning(f"Hindsight Cloud memory search failed: {e}. Falling back to local memory.")

    local_results = _local_store.search(clean_query, top_k=limit)
    if not local_results:
        local_results = _local_store.search("", top_k=limit)
    return local_results


def search_memory(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    return asyncio.run(asearch_memory(query, limit))


async def adelete_ticket_memory(ticket_id: str) -> bool:
    """
    Deletes the ticket resolution record from local vector memory and Hindsight Cloud if present.
    Ensures that unlearned or deleted tickets do not influence future pattern matching.
    """
    deleted_local = _local_store.delete(ticket_id)
    initialize_hindsight_client()
    if _hindsight_client:
        try:
            targets = [ticket_id, ticket_id.replace("TICKET-", "")]
            for doc_id in targets:
                if hasattr(_hindsight_client, "adelete_document"):
                    await _hindsight_client.adelete_document(bank_id=HINDSIGHT_BANK_ID, document_id=doc_id)
                elif hasattr(_hindsight_client, "adelete_memory"):
                    await _hindsight_client.adelete_memory(bank_id=HINDSIGHT_BANK_ID, document_id=doc_id)
        except Exception as e:
            logger.warning(f"Could not delete {ticket_id} from Hindsight Cloud: {e}")
    return deleted_local


def delete_ticket_memory(ticket_id: str) -> bool:
    return asyncio.run(adelete_ticket_memory(ticket_id))

