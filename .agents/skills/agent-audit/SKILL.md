---
name: agent-audit
description: Audits autonomous agent systems, background task runners, and tool integrations for unauthenticated execution, tool abuse, memory poisoning, and unauthorized system access.
---

# Agent-Audit — Autonomous Agent & Background Task Security

Framework for verifying safety boundaries in autonomous agentic loops, task runners, and tool definitions.

## Key Audit Points

1. **Tool Invocation Boundaries**:
   - Check all tool parameters for command injection, shell execution risks, and directory traversal.
   - Enforce that tools cannot write outside the workspace or delete production databases.

2. **Autonomous Background Task Guardrails**:
   - Verify that background cron/daemon tasks (e.g. `run_scheduled_ingestion.bat`) have execution timeouts (e.g. 45 min limit) and ignore overlapping concurrent triggers.
   - Ensure scheduled tasks cannot spawn unbounded subprocesses.

3. **Database & Memory Integrity**:
   - Guarantee that audit hashes and historical index records are tamper-resistant.
   - Prevent state store poisoning by validating all parsed JSON responses before persisting.
