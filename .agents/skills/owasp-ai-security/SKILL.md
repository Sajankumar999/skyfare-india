---
name: owasp-ai-security
description: OWASP Top 10 for LLM & Agentic AI Security Auditor. Audits AI applications, agent tools, prompts, and inference pipelines for prompt injection, sensitive data leakage, insecure output handling, denial of wallet/service, and excessive agency.
---

# OWASP AI & Agentic Security Auditor

Structured security auditing based on the **OWASP Top 10 for Large Language Model Applications** and **Agentic Security Initiative (ASI)**.

## Core Vulnerability Categories

### 1. LLM01: Prompt Injection & Jailbreaks
- Verify that user inputs passed into AI models (e.g. `PolicyChatbotView.tsx` query inputs) are separated from system instructions.
- Ensure untrusted user text cannot override system constraints, exfiltrate internal system prompts, or force arbitrary tool invocations.

### 2. LLM02: Sensitive Information Disclosure
- Verify that the AI system prompt or RAG retrieval context does not contain unmasked API keys, internal credentials, employee PII, or raw database connection strings.

### 3. LLM04: Model Denial of Service & Denial of Wallet
- Enforce strict character limits on user prompts and token budgets on responses.
- Implement per-IP and per-user rate limiting on all AI endpoints to prevent malicious exhaustion of API quotas and compute resources.

### 4. LLM06: Excessive Agency & Unauthenticated Tool Execution
- Ensure agents and autonomous background tasks operate with least privilege.
- Validate that tools cannot execute dangerous, destructive, or irreversible commands (e.g. arbitrary file deletion or unsanitized shell commands) without safeguards.

### 5. LLM07: Insecure Output Handling
- Always sanitize and escape outputs rendered in the UI from the AI to prevent Cross-Site Scripting (XSS) or HTML injection.
