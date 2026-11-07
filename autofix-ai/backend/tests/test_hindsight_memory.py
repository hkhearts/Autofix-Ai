import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

from backend.services import hindsight_memory


class HindsightMemoryTests(unittest.TestCase):
    def test_search_uses_cloud_recall_results(self):
        score = SimpleNamespace(final=0.93, semantic=0.9)
        result = SimpleNamespace(
            id="memory-1",
            text="Restart the VPN agent and reset the socket stack.",
            scores=score,
            metadata={"signature": "VPN_TIMEOUT", "type": "AUTONOMOUS", "ticket_id": "TICK-102"},
            document_id="tick-102.txt",
            mentioned_at="2026-11-07T04:30:00Z",
        )
        client = MagicMock()
        client.arecall = AsyncMock(return_value=SimpleNamespace(results=[result]))

        with patch.object(hindsight_memory, "initialize_hindsight_client"), patch.object(
            hindsight_memory, "_hindsight_client", client
        ):
            matches = asyncio.run(hindsight_memory.asearch_memory("VPN timeout", limit=3))

        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]["source"], "hindsight_cloud")
        self.assertEqual(matches[0]["ticket_id"], "TICK-102")
        self.assertEqual(matches[0]["confidence"], 0.93)
        client.arecall.assert_awaited_once()

    def test_async_recall_uses_cloud_recall_results(self):
        score = SimpleNamespace(final=0.93, semantic=0.9)
        result = SimpleNamespace(
            id="memory-1",
            text="Restart the VPN agent and reset the socket stack.",
            scores=score,
            document_id="tick-102.txt",
        )
        client = MagicMock()
        client.arecall = AsyncMock(return_value=SimpleNamespace(results=[result]))

        with patch.object(hindsight_memory, "initialize_hindsight_client"), patch.object(
            hindsight_memory, "_hindsight_client", client
        ):
            recall = asyncio.run(
                hindsight_memory.arecall_resolution("VPN_TIMEOUT", "VPN timeout")
            )

        self.assertEqual(recall["source"], "hindsight_cloud")
        self.assertEqual(recall["matched_ticket_id"], "tick-102.txt")
        client.arecall.assert_awaited_once()

    def test_stats_report_cloud_document_and_resolution_counts(self):
        client = MagicMock()
        client.alist_memories = AsyncMock()
        cloud_memories = [
            SimpleNamespace(document_id=f"tick-{index}.txt", tags=["autonomous"], mentioned_at=None)
            for index in range(1, 10)
        ] + [
            SimpleNamespace(document_id=f"tick-{index}.txt", tags=["human_in_the_loop"], mentioned_at=None)
            for index in range(10, 16)
        ]
        client.alist_memories.return_value = SimpleNamespace(total=24, items=cloud_memories)

        with patch.object(hindsight_memory, "initialize_hindsight_client"), patch.object(
            hindsight_memory, "_hindsight_client", client
        ):
            stats = asyncio.run(hindsight_memory.aget_memory_stats())

        self.assertTrue(stats["is_cloud_connected"])
        self.assertEqual(stats["total_records"], 24)
        self.assertEqual(stats["autonomous_resolutions"], 9)
        self.assertEqual(stats["human_verified_resolutions"], 6)
        client.alist_memories.assert_awaited_once_with(
            bank_id=hindsight_memory.HINDSIGHT_BANK_ID,
            limit=1000,
            offset=0,
        )

    def test_resolution_can_update_an_existing_cloud_document(self):
        client = MagicMock()
        client.aretain = AsyncMock()
        local_store = MagicMock()

        with patch.object(hindsight_memory, "initialize_hindsight_client"), patch.object(
            hindsight_memory, "_hindsight_client", client
        ), patch.object(hindsight_memory, "_local_store", local_store):
            stored = hindsight_memory.record_ticket_resolution(
                ticket_id="TICK-101",
                error_signature="SSO_CLOCK_SKEW",
                resolution_steps="Resync the workstation clock.",
                resolution_type="HUMAN_IN_THE_LOOP",
                metadata={"client_name": "Demo User", "title": "SSO clock skew", "category": "L1"},
                cloud_document_id="tick-101.txt",
            )

        self.assertTrue(stored)
        client.aretain.assert_awaited_once()
        self.assertEqual(client.aretain.await_args.kwargs["document_id"], "tick-101.txt")
        self.assertEqual(client.aretain.await_args.kwargs["metadata"]["ticket_id"], "TICK-101")
        self.assertEqual(client.aretain.await_args.kwargs["update_mode"], "replace")
        self.assertNotIn("client_name", client.aretain.await_args.kwargs["metadata"])
        self.assertNotIn("Demo User", client.aretain.await_args.kwargs["content"])


if __name__ == "__main__":
    unittest.main()
