"""
Simulated L1/L2 IT Command Runner for Autofix-AI
Safely simulates automated resolution workflows without executing dangerous shell commands on the host.
Provides deterministic terminal logs and step execution timings.
"""

import hashlib
import re
import time
from typing import List
from pydantic import BaseModel


class ExecutionResult(BaseModel):
    success: bool
    steps_executed: List[str]
    simulated_output: List[str]
    execution_time_ms: int
    notes: str


def _get_category_log_line(step: str, seed: int) -> str:
    s_lower = step.lower()
    
    if "dns" in s_lower or "flushdns" in s_lower:
        return "[EXEC] ipconfig /flushdns -> Windows IP Configuration: Successfully flushed the DNS Resolver Cache."
    elif "winsock" in s_lower or "netsh" in s_lower:
        return "[EXEC] netsh winsock reset -> Successfully reset the Winsock Catalog. Network socket provider bound."
    elif "vpn" in s_lower or "anyconnect" in s_lower:
        return "[EXEC] csc_vpnagent -> Tunnel re-established. Gateway MTU negotiated: 1406. Remote endpoint 10.45.12.88."
    elif "ntp" in s_lower or "w32tm" in s_lower:
        return "[EXEC] w32tm /resync /force -> Sending resync command to local computer... The command completed successfully (Offset: 0.0012s)."
    elif "okta" in s_lower or "saml" in s_lower or "sso" in s_lower:
        return "[EXEC] okta-admin-cli revoke-sessions -> Invalidation of stale SAML assertion completed. Fresh challenge issued."
    elif "kubectl" in s_lower or "pod" in s_lower or "k8s" in s_lower:
        return "[EXEC] kubectl rollout restart deployment -> deployment.apps/core-service restarted. 3/3 pods ready (24s)."
    elif "database" in s_lower or "tns" in s_lower or "postgres" in s_lower or "oracle" in s_lower:
        return "[EXEC] db-pool-check -> Connection pool verified. Active: 12, Idle: 8, Max: 50. Handshake ping: 1.4ms."
    elif "redis" in s_lower:
        return "[EXEC] redis-cli CONFIG REWRITE -> OK. Master-auth configuration propagated across sentinel quorum."
    elif "ssl" in s_lower or "cert" in s_lower:
        return "[EXEC] cert-manager renew -> Certificate x509 validated. TLS 1.3 secret provisioned. Validity: +365 days."
    elif "spooler" in s_lower or "printer" in s_lower:
        return "[EXEC] net stop spooler && net start spooler -> Print Spooler service stopped and restarted successfully."
    elif "ost" in s_lower or "outlook" in s_lower:
        return "[EXEC] outlook /cleanreminders -> Mailbox OST cache re-indexed against Exchange Online endpoint."
    else:
        verbs = ["Running diagnostics", "Applying automated patch", "Verifying endpoint state", "Synchronizing identity state"]
        chosen = verbs[seed % len(verbs)]
        clean_step = step[:50].strip()
        return f"[EXEC] {chosen}: '{clean_step}' -> Completed with code 0 (Success)."


def simulate_fix(resolution_steps: str, ticket_id: str) -> ExecutionResult:
    """
    Parses resolution steps and generates simulated terminal execution traces.
    """
    start_ts = time.time()
    
    # Deterministic seed from ticket_id
    seed = int(hashlib.md5(ticket_id.encode("utf-8")).hexdigest()[:6], 16)
    
    # Split steps by newline or numbered prefixes
    raw_lines = resolution_steps.strip().split("\n")
    cleaned_steps = []
    for line in raw_lines:
        line = line.strip()
        if not line:
            continue
        cleaned = re.sub(r"^\d+[\.\)]\s*", "", line)
        cleaned_steps.append(cleaned)

    if not cleaned_steps:
        cleaned_steps = ["Execute standard remediation protocol", "Verify service connectivity"]

    output_lines = [
        f"[INIT] Autofix-AI Autonomous Execution Engine v2.4",
        f"[TARGET] Ticket: {ticket_id} | Execution Mode: Containerized Sandbox",
        f"[TIMESTAMP] {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}",
        "---",
    ]

    for i, step in enumerate(cleaned_steps, 1):
        output_lines.append(f"[STEP {i}/{len(cleaned_steps)}] {step}")
        log_line = _get_category_log_line(step, seed + i)
        output_lines.append(f"  {log_line}")

    output_lines.append("---")
    output_lines.append("[VERIFY] Remediation pipeline executed successfully. All health probes: PASS (200 OK).")

    # Deterministic execution duration between 140ms and 380ms
    exec_duration = 140 + (seed % 240)

    return ExecutionResult(
        success=True,
        steps_executed=cleaned_steps,
        simulated_output=output_lines,
        execution_time_ms=exec_duration,
        notes=f"Remediation verified for ticket {ticket_id} across {len(cleaned_steps)} automated phases.",
    )


if __name__ == "__main__":
    print("Testing Executor Service...")
    sample_steps = (
        "1. Flush DNS cache and reset Winsock catalog\n"
        "2. Restart AnyConnect VPN Agent service\n"
        "3. Verify split-tunnel routes to 10.45.12.88"
    )
    res = simulate_fix(sample_steps, "TICK-TEST-99")
    print(f"Success: {res.success} in {res.execution_time_ms}ms")
    print("\n".join(res.simulated_output[:6]))
