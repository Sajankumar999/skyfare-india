# SkyFare India — Mandatory Agent Directives & Roles

> **CRITICAL AGENT MANDATE**:
> Every agent working on this codebase MUST ALWAYS actively employ **GRAFT MAP**, **PONYTAIL (LAZY SENIOR DEV / YAGNI)**, **RETICLE (RUNTIME VERIFICATION)**, and the specialized **AGENCY AGENTS (REQUIRED ROLES)** whenever possible. No task should bypass these foundational capabilities.

---

## 1. 🗺️ Graft (Codebase Knowledge Graph & Repo Map) — Step 1 Before Coding
- **Mandate**: **Always consult Graft before modifying or refactoring code.**
- **Usage**:
  - **Locate Symbols & File Lines**: Check [`graft/INDEX.md`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/graft/INDEX.md) and [`graft/*.md`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/graft/) wiring cards or query `graft ask "<query>"` to locate exact function, type, and route definitions (`file:line`) before opening large files.
  - **Trace Callers & Blast Radius**: Always run `graft callers <symbol>` or `graft blast` to identify all dependent functions and components before editing shared utilities or API shapes.
  - **Maintain Freshness**: Keep the graph in sync by executing `graft build` after major structural changes.

---

## 2. ✂️ Ponytail (Lazy Senior Dev / YAGNI) — Mandatory Implementation Discipline
- **Mandate**: **Apply the Ponytail Ladder on EVERY coding task (writing, adding, refactoring, fixing, or reviewing).**
- **The 7-Rung Ponytail Ladder** ([`.agents/skills/ponytail/SKILL.md`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.agents/skills/ponytail/SKILL.md)):
  1. **Does this need to exist?** If speculative, skip it (YAGNI).
  2. **Already in this codebase?** Look before writing; reuse existing helpers, types, and components.
  3. **Stdlib does it?** Python/Node standard library before adding custom packages.
  4. **Native platform covers it?** Native HTML5, CSS, browser APIs, or database constraints over heavy libraries.
  5. **Already-installed dependency?** Use existing packages in `package.json` and Python virtual environment. Never install new dependencies without explicit need.
  6. **Can it be one line?** Make it one line. Shortest working diff wins.
  7. **Only then:** The minimum code that works.
- **Root Cause, Not Symptom**: Fix shared root functions where all callers route through rather than adding repetitive guards across caller files.

---

## 3. 👁️ Reticle (Runtime Verification & DOM Auditing) — Mandatory Validation
- **Mandate**: **Always verify UI, network calls, and state changes against the running dev server.**
- **Usage** ([`.agents/skills/reticle/SKILL.md`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.agents/skills/reticle/SKILL.md)):
  - Verify UI and network behavior against the Vite server (`http://localhost:3000`) and FastAPI server (`http://127.0.0.1:8000`).
  - Confirm DOM states, responsive mobile breakpoints, interactive modal workflows, and console error logs.
  - Never mark a frontend or API task complete without runtime verification.

---

## 4. 👥 Agency Agents (Specialized Required Roles)
When tackling domain-specific tasks, ALWAYS activate the dedicated agent roles defined in [`.agents/skills/`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.agents/skills/):

1. **`agency-frontend-developer`** ([`SKILL.md`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.agents/skills/agency-frontend-developer/SKILL.md)):
   - React 19, TypeScript, Tailwind CSS v4, Lucide icons, responsive dashboard layouts ($320\text{px} - 1920\text{px}$), and WCAG AA accessibility.
2. **`agency-backend-architect`** ([`SKILL.md`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.agents/skills/agency-backend-architect/SKILL.md)):
   - FastAPI REST endpoints, corridor simulators, async handlers, CORS configuration, and robust server-side performance.
3. **`agency-database-optimizer`** ([`SKILL.md`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.agents/skills/agency-database-optimizer/SKILL.md)):
   - SQLite WAL mode, index optimization, query execution plans, transaction locking, and schema integrity.
4. **`agency-data-engineer`** ([`SKILL.md`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.agents/skills/agency-data-engineer/SKILL.md)):
   - Automated ingestion pipelines, statutory tariff unbundling, Tukey IQR outlier governance, and Merkle cryptographic audit hashing.
5. **`agency-code-reviewer`** ([`SKILL.md`](file:///c:/Compition/skyfare-india-—-national-airfare-intelligence%20(7)/.agents/skills/agency-code-reviewer/SKILL.md)):
   - Rigorous code review, DGCA regulatory logic audits, UN CPI methodology compliance, and security boundaries.

---

## 5. 📊 Mandatory Token Economy Accounting (Graft & Ponytail Reporting)
- **Mandate**: **After EVERY output, the AI MUST explicitly calculate and report how many tokens were saved during that turn by employing Graft Map and Ponytail.**
- **Accounting Principles**:
  - **Graft Map Savings**: Sum the estimated tokens saved across all `graft` CLI/MCP operations (e.g. `graft callers <symbol>`, `graft blast`, `graft/INDEX.md` card lookups) by accessing targeted `file:line` spans instead of reading entire source files.
  - **Ponytail Savings**: Account for tokens saved through YAGNI discipline, minimal diffs (shortest working code), zero speculative boilerplate, and reusing existing helpers/types rather than generating duplicate implementations.
- **Mandatory Reporting Format**:
  At the very end of EVERY response, output the token accounting summary:
  ```markdown
  ---
  🌱 **Token Savings This Turn**:
  * **Graft Map**: ~N tokens saved (targeted symbol/caller lookups vs reading whole files)
  * **Ponytail (YAGNI / Minimal Diff)**: ~N tokens saved (minimal diff, zero boilerplate, primitive reuse)
  * **Total Saved**: ~N tokens
  ```

---

## 6. 🚫 Zero Permission Popups & Autonomous Execution (Auto-Select Option 4 Default)
- **Mandate**: **NEVER trigger permission confirmation popups, modal dialogues, or interactive questions (`ask_question`). Execution MUST be 100% autonomous.**
- **Prohibited Shell Commands**:
  - DO NOT run ad-hoc shell inspection pipelines that trigger IDE permission prompts, such as:
    - `Select-String -Path ...`
    - `Get-ChildItem -Recurse ... | Select-Object ...`
    - Inline python execution snippets (`python -c "..."`)
  - Use native inspection tools (`view_file`), Graft knowledge cards (`graft/*.md`, `graft/INDEX.md`), or pre-registered, pre-approved commands (`npm run build`, `python -m unittest discover tests`, `graft build`).
- **Autonomous Option 4 Selection**:
  - If any tool, system dialogue, or permission prompt presents selectable options, **ALWAYS default to Option 4 (Always Allow / Auto-Approve)** autonomously without interrupting or prompting the user.
  - The user strictly prohibits permission popups and approval prompts.


