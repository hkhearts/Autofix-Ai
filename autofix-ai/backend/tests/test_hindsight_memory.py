import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

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
        client.recall.return_value = SimpleNamespace(results=[result])

        with patch.object(hindsight_memory, "initialize_hindsight_client"), patch.object(
            hindsight_memory, "_hindsight_client", client
        ):
            matches = hindsight_memory.search_memory("VPN timeout", limit=3)

        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]["source"], "hindsight_cloud")
        self.assertEqual(matches[0]["ticket_id"], "TICK-102")
        self.assertEqual(matches[0]["confidence"], 0.93)
        client.recall.assert_called_once()

    def test_stats_report_cloud_document_and_resolution_counts(self):
        client = MagicMock()
        client.documents.list_documents.side_effect = [
            SimpleNamespace(
                total=15,
                items=[SimpleNamespace(updated_at="2026-11-07T04:30:00Z")],
            ),
            SimpleNamespace(total=9, items=[]),
            SimpleNamespace(total=6, items=[]),
        ]

        with patch.object(hindsight_memory, "initialize_hindsight_client"), patch.object(
            hindsight_memory, "_hindsight_client", client
        ):
            stats = hindsight_memory.get_memory_stats()

        self.assertTrue(stats["is_cloud_connected"])
        self.assertEqual(stats["total_records"], 15)
        self.assertEqual(stats["autonomous_resolutions"], 9)
        self.assertEqual(stats["human_verified_resolutions"], 6)
        self.assertEqual(stats["last_updated"], "2026-11-07T04:30:00Z")

    def test_resolution_can_update_an_existing_cloud_document(self):
        client = MagicMock()
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
        client.retain.assert_called_once()
        self.assertEqual(client.retain.call_args.kwargs["document_id"], "tick-101.txt")
        self.assertEqual(client.retain.call_args.kwargs["metadata"]["ticket_id"], "TICK-101")
        self.assertEqual(client.retain.call_args.kwargs["update_mode"], "replace")
        self.assertNotIn("client_name", client.retain.call_args.kwargs["metadata"])
        self.assertNotIn("Demo User", client.retain.call_args.kwargs["content"])


if __name__ == "__main__":
    unittest.main()
