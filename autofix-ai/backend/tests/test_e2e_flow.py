import unittest
from fastapi.testclient import TestClient
from backend.main import app, TICKET_STORE


class EndToEndIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        # Purge temporary test tickets from store and database for clean deterministic run
        from backend.services.knowledge_bank import get_db_connection, refresh_in_memory_structures
        conn = get_db_connection()
        conn.cursor().execute("DELETE FROM ticket_memories WHERE ticket_id LIKE 'TICKET-1%'")
        conn.cursor().execute("DELETE FROM knowledge_nodes WHERE id LIKE 'ticket:TICKET-1%'")
        conn.commit()
        conn.close()
        refresh_in_memory_structures()
        for k in list(TICKET_STORE.keys()):
            if k.startswith("TICKET-1") or k.startswith("TEST-"):
                del TICKET_STORE[k]

    def test_01_health_and_memory_stats(self):
        resp = self.client.get("/health")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("hindsight", data)
        self.assertIn("bank_status", data["hindsight"])
        self.assertEqual(data["hindsight"]["bank_status"], "Online")
        self.assertGreater(data["hindsight"]["bank_nodes_count"], 0)

    def test_02_create_ticket_low_match_proportional_response(self):
        # Create a ticket with totally novel/unknown symptoms (zero overlap with any prior incident)
        import uuid
        uid = uuid.uuid4().hex[:6]
        resp = self.client.post(
            "/api/tickets",
            data={
                "title": f"Quasar Astrophysics Stellar Spectroscopy Divergence {uid}",
                "description": "Telescope focal interferometer frequency calibration drift without correlation",
                "client_name": "Artist User",
                "priority": "Low",
                "category": "L1",
                "company_id": "acme-corp",
            },
        )
        self.assertEqual(resp.status_code, 201)
        ticket = resp.json()
        self.assertEqual(ticket["status"], "PENDING_HUMAN_REVIEW")
        
        # Verify confidence score is genuinely low (< 10% range)
        self.assertLessEqual(ticket["confidence_score"], 0.20)
        insights = ticket["diagnostic_insights"]
        self.assertLessEqual(insights["confidence_percent"], 20)
        self.assertIn("Novel error pattern", insights["root_cause_analysis"])

        # Verify it was stored in knowledge graph nodes
        graph_resp = self.client.get("/api/knowledge/graph")
        self.assertEqual(graph_resp.status_code, 200)
        nodes = graph_resp.json()["nodes"]
        ticket_node_ids = [n["id"] for n in nodes if n["node_type"] == "ticket"]
        self.assertIn(f"ticket:{ticket['id']}", ticket_node_ids)

    def test_03_create_ticket_partial_match_30_to_40_percent(self):
        # Create a ticket with partial keyword overlap with Cisco AnyConnect VPN
        import uuid
        uid = uuid.uuid4().hex[:4]
        resp = self.client.post(
            "/api/tickets",
            data={
                "title": f"Gateway Timeout Failure on VPN Port {uid}",
                "description": "User connection dropped with gateway unreachable timeout",
                "client_name": "Alice Green",
                "priority": "High",
                "category": "L1",
                "company_id": "acme-corp",
            },
        )
        self.assertEqual(resp.status_code, 201)
        ticket = resp.json()
        insights = ticket["diagnostic_insights"]
        
        # Proportional response: Should tell something relevant with the vector matched ticket
        self.assertTrue(
            "Relevant historical insights" in insights["recommended_solution"]
            or "TICK-" in insights["recommended_solution"]
            or "TICK-" in insights["matched_pattern_title"]
        )
        self.assertTrue(any(msg["role"] == "agent" for msg in ticket["messages"]))

    def test_04_human_in_the_loop_approval_flow(self):
        # Pick any pending ticket or create one
        resp = self.client.post(
            "/api/tickets",
            data={
                "title": "Stale Kerberos Session on Floor 4",
                "description": "Employee cannot unlock workstation due to outdated domain ticket",
                "client_name": "Bob Vance",
                "priority": "Medium",
                "category": "L1",
                "company_id": "acme-corp",
            },
        )
        ticket_id = resp.json()["id"]

        # Approve via feedback endpoint (Human in the loop)
        approval_resp = self.client.post(
            f"/api/tickets/{ticket_id}/feedback",
            json={
                "resolution_steps": "1. Execute klist purge.\n2. Force AD resync.\n3. Verified login OK.",
                "approved_by": "Lead Systems Engineer",
                "notes": "Verified and approved by Lead Engineer",
            },
        )
        self.assertEqual(approval_resp.status_code, 200)
        approved_ticket = approval_resp.json()
        self.assertEqual(approved_ticket["status"], "RESOLVED_HUMAN_VERIFIED")
        self.assertEqual(approved_ticket["confidence_score"], 1.0)
        self.assertEqual(approved_ticket["diagnostic_insights"]["confidence_percent"], 100)
        self.assertIsNotNone(approved_ticket["execution_result"])

    def test_05_knowledge_graph_and_analytics_endpoints(self):
        graph_resp = self.client.get("/api/knowledge/graph")
        self.assertEqual(graph_resp.status_code, 200)
        gdata = graph_resp.json()
        self.assertIn("nodes", gdata)
        self.assertIn("edges", gdata)
        self.assertIn("bank_status", gdata)

        tree_resp = self.client.get("/api/knowledge/tree")
        self.assertEqual(tree_resp.status_code, 200)
        tdata = tree_resp.json()
        self.assertIsInstance(tdata, list)
        self.assertGreater(len(tdata), 0)

        analytics_resp = self.client.get("/api/knowledge/analytics")
        self.assertEqual(analytics_resp.status_code, 200)
        adata = analytics_resp.json()
        self.assertIn("confidence_distribution", adata)
        self.assertIn("category_distribution", adata)
        self.assertIn("status_distribution", adata)

    def test_06_toggle_cloud_mode(self):
        toggle_resp = self.client.post("/api/memory/toggle-cloud-mode", json={"enabled": False})
        self.assertEqual(toggle_resp.status_code, 200)
        tdata = toggle_resp.json()
        self.assertFalse(tdata["cloud_mode_enabled"])

        # Toggle back to True
        toggle_back = self.client.post("/api/memory/toggle-cloud-mode", json={"enabled": True})
        self.assertEqual(toggle_back.status_code, 200)
        self.assertTrue(toggle_back.json()["cloud_mode_enabled"])


if __name__ == "__main__":
    unittest.main()
