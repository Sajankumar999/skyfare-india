---
name: vibe-security
description: Audits codebases for common security vulnerabilities that AI coding assistants introduce in "vibe-coded" applications. Checks for exposed API keys, broken access control, missing auth validation, client-side trust issues, and unauthenticated endpoints.
license: MIT
---

# Vibe Security — Agent Skill for AI Coding Assistants

Audit code for security vulnerabilities commonly introduced by AI code generation in "vibe-coded" applications.

## The Core Principle

**Never trust the client.** Every price, user ID, role, subscription status, feature flag, and rate limit counter must be validated and enforced server-side. If it exists only in the browser, mobile bundle, or request body, an attacker controls it.

## Audit Checklist & Rules

### 1. Secrets & Environment Variables
- Scan for hardcoded API keys, tokens, or credentials in source code.
- Check client-side env var prefixes (`VITE_`, `NEXT_PUBLIC_`). Never expose backend secret keys to the browser.
- Verify `.env*` is in `.gitignore`.

### 2. Database Access & Storage Security
- Always enforce access controls and server-side authorization on database operations.
- Ensure all queries use parameterized inputs (`?` or `$1`), never string interpolation (`f"SELECT ... {user_input}"`).
- Enforce transactional safety and concurrency controls (e.g. SQLite WAL mode, timeouts).

### 3. Authentication & Authorization
- Never rely on client-side authentication simulation (e.g. UI-only boolean flags or `setTimeout` checks).
- Server Actions and REST API routes compile into public endpoints accessible via `curl`. Protect all mutating endpoints with server-side authentication headers (Bearer token, API key, or session cookie).

### 4. Rate Limiting & Abuse Prevention
- Auth endpoints, external API triggers, and CPU-intensive operations require rate limits.
- Combine per-IP and per-user limits to prevent resource and budget exhaustion.

### 5. Input Validation & Boundaries
- Validate all incoming route and query parameters on the server side using schemas (Pydantic / Zod).
- Enforce strict ranges on numeric parameters to prevent calculation overflows and NaN poisoning.
