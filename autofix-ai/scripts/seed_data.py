"""
Seed Data Script for Autofix-AI
Populates Hindsight Memory with 15 synthetic L1/L2 IT support tickets.
Can be executed standalone or automatically triggered on backend boot.
"""

import argparse
import json
import logging
import os
import sys

# Ensure backend modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.hindsight_memory import record_ticket_resolution, get_memory_stats

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_data")


def load_seed_tickets(file_path: str = None) -> list:
    if file_path is None:
        file_path = os.path.join(os.path.dirname(__file__), "..", "data", "initial_tickets.json")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Seed tickets file not found at: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def seed_hindsight(dry_run: bool = False) -> int:
    tickets = load_seed_tickets()
    logger.info(f"Loaded {len(tickets)} tickets from initial_tickets.json")

    success_count = 0
    for idx, item in enumerate(tickets, 1):
        ticket_id = item["id"]
        title = item["title"]
        category = item["category"]
        signature = item["error_signature"]
        resolution = item["resolution_steps"]
        res_type = item.get("resolution_type", "HUMAN_IN_THE_LOOP")
        metadata = {
            "title": title,
            "category": category,
            "priority": item.get("priority", "Medium"),
            "client_name": item.get("client_name", "IT User"),
            "description": item.get("description", ""),
            "tags": item.get("tags", []),
        }

        if dry_run:
            logger.info(f"[DRY RUN] [{idx}/{len(tickets)}] Would seed {ticket_id} ({category}) - {title[:40]}...")
            success_count += 1
            continue

        ok = record_ticket_resolution(
            ticket_id=ticket_id,
            error_signature=signature,
            resolution_steps=resolution,
            resolution_type=res_type,
            metadata=metadata,
            cloud_document_id=f"{ticket_id.lower()}.txt",
        )
        if ok:
            logger.info(f"✅ [{idx}/{len(tickets)}] Ingested {ticket_id} [{res_type}]: {title[:45]}...")
            success_count += 1
        else:
            logger.warning(f"❌ [{idx}/{len(tickets)}] Failed to ingest {ticket_id}")

    stats = get_memory_stats()
    logger.info("--------------------------------------------------")
    logger.info(f"Seeding completed. Total records in memory: {stats['total_records']}")
    logger.info(f"Autonomous: {stats['autonomous_resolutions']} | Human Verified: {stats['human_verified_resolutions']}")
    logger.info("--------------------------------------------------")
    return success_count


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed initial L1/L2 IT tickets into Hindsight Memory")
    parser.add_argument("--dry-run", action="store_true", help="Simulate seeding without sending data to Hindsight")
    args = parser.parse_args()

    seeded = seed_hindsight(dry_run=args.dry_run)
    print(f"✅ Seeded {seeded}/15 tickets into Hindsight")
