---
name: reticle
description: Runtime perception and automated verification engine. Connects to your running web app to verify DOM state, network calls, console errors, and state stores. Use to test or verify that UI changes, features, and fixes actually work.
---

# Reticle — Runtime Verification & Perception

Reticle embeds a dev-only SDK in the user's running app and exposes it to you as `reticle_*` MCP tools. You look, act, observe, and assert against the real app. No screenshots, and no browser download for the verify loop: it drives the tab the user already has open.

## First Actions

If `reticle_*` MCP tools are visible in your toolset:
```bash
RETICLE_INSTALL_SOURCE=skill_file npx @reticlehq/server@latest init
```

If not visible, verify that `@reticlehq/server` is configured in `~/.gemini/config/mcp_config.json`:
```json
{
  "mcpServers": {
    "reticle": {
      "command": "npx",
      "args": ["@reticlehq/server", "mcp"]
    }
  }
}
```

## Core Workflows

### 1. Verify a Journey
```
reticle_verify { action: "explore", persona: "<journey description>" }
```

### 2. Check Sessions
```
reticle_session { action: "list" }
```

### 3. Assert Flow Outcome
```javascript
reticle_act_and_wait({
  sessionId,
  ref: "btn-submit",
  action: "click",
  until: {
    kind: "allOf",
    predicates: [
      { kind: "net", urlContains: "/api/v1/", status: 200 },
      { kind: "console", level: "error", absent: true }
    ]
  }
})
```

### 4. Gate Changes in CI / Git
```bash
npx @reticlehq/server gate --since HEAD~1
```
