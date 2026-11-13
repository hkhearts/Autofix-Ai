import unittest
import os
import shutil
import tempfile

from backend.services.knowledge_bank import (
    KnowledgeNode,
    KnowledgeEdge,
    KnowledgeGraph,
    KnowledgeTree,
    record_ticket_in_bank,
    search_bank_matches,
    generate_proportional_response,
    get_cached_graph,
    get_bank_analytics,
)


class KnowledgeBankTests(unittest.TestCase):
    def test_proportional_response_below_10_percent(self):
        resp = generate_proportional_response(
            title="Random weird printer beep",
            description="Mysterious sound never seen before in data center",
            error_signature="UNKNOWN_AUDIO_ANOMALY",
            ocr_text="",
            best_match=None,
            confidence=0.04,
        )
        self.assertLess(resp["confidence_percent"], 10)
        self.assertIn("Novel error pattern", resp["root_cause_analysis"])
        self.assertIn("Collect full diagnostic", resp["recommended_solution"])

    def test_proportional_response_30_to_40_percent(self):
        best_match = {
            "ticket_id": "TICK-102",
            "title": "Cisco AnyConnect VPN Gateway Timeout",
            "resolution_steps": "1. Restart Cisco service.\n2. Reset Windows Socket stack.",
            "error_signature": "CISCO_VPN_GATEWAY_TIMEOUT",
        }
        resp = generate_proportional_response(
            title="Slow VPN connect attempt with tunnel lag",
            description="Worker complains about AnyConnect latency when joining gateway",
            error_signature="VPN_TUNNEL_LATENCY",
            ocr_text="",
            best_match=best_match,
            confidence=0.36,
        )
        self.assertEqual(resp["confidence_percent"], 36)
        # Must tell something relevant with the vector matched tickets
        self.assertIn("TICK-102", resp["matched_pattern_title"])
        self.assertIn("TICK-102", resp["root_cause_analysis"])
        self.assertIn("Relevant historical insights from matched ticket", resp["recommended_solution"])
        self.assertIn("Restart Cisco service", resp["recommended_solution"])

    def test_proportional_response_above_85_percent(self):
        best_match = {
            "ticket_id": "TICK-101",
            "title": "Salesforce SSO Clock Skew 401",
            "resolution_steps": "1. Resync local NTP clock.\n2. Invalidate Okta session.",
            "error_signature": "SALESFORCE_SSO_401",
        }
        resp = generate_proportional_response(
            title="Salesforce SSO timeout",
            description="Okta SAML 401 clock skew error",
            error_signature="SALESFORCE_SSO_401",
            ocr_text="",
            best_match=best_match,
            confidence=0.92,
        )
        self.assertEqual(resp["confidence_percent"], 92)
        self.assertIn("Autonomous Match", resp["matched_pattern_title"])

    def test_record_ticket_creates_graph_nodes_and_edges(self):
        record_ticket_in_bank(
            ticket_id="TEST-TICK-999",
            title="Test Ticket Database Connection Pool",
            description="Hikari pool exhausted with 50 idle connections",
            error_signature="POSTGRES_POOL_EXHAUSTED",
            resolution_steps="1. Terminate idle transactions.\n2. Restart pool.",
            status="RESOLVED_HUMAN_VERIFIED",
            priority="Critical",
            category="L2",
            confidence=1.0,
            resolution_type="HUMAN_IN_THE_LOOP",
            metadata={"client_name": "Test Engineer"},
            source="bank",
        )
        graph = get_cached_graph()
        self.assertIn("ticket:TEST-TICK-999", graph.nodes)
        self.assertIn("signature:POSTGRES_POOL_EXHAUSTED", graph.nodes)
        
        # Check analytics
        analytics = get_bank_analytics()
        self.assertGreater(analytics["total_nodes"], 0)
        self.assertGreater(analytics["total_edges"], 0)
        self.assertIn("Database, Cache & Storage", analytics["category_distribution"])


if __name__ == "__main__":
    unittest.main()
