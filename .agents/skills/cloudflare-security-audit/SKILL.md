---
name: cloudflare-security-audit
description: Web application & API threat modeling and perimeter defense audit skill. Audits edge security, CORS headers, rate limiting, and request forgery defense.
---

# Cloudflare Security Audit — Edge & API Perimeter Defense

A comprehensive playbook for auditing web application perimeters, edge routing, and public REST APIs.

## Audit Checklist

1. **Perimeter & CORS Architecture**:
   - Ensure CORS policies do not reflect arbitrary origins with credentials enabled in production.
   - Separate local development CORS regex from production domain allowlists.

2. **HTTP Security Headers**:
   - Verify presence of standard security headers:
     - `X-Content-Type-Options: nosniff`
     - `X-Frame-Options: DENY` or `SAMEORIGIN`
     - `Referrer-Policy: strict-origin-when-cross-origin`
     - Content Security Policy (CSP)

3. **Denial of Service (DoS) Mitigation**:
   - Enforce payload size limits on POST endpoints (preventing multi-megabyte JSON memory exhaustion).
   - Enforce timeouts on external API fetch operations (e.g. 10s timeout on OTA fetchers).
