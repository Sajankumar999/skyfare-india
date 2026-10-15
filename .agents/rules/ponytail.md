# Ponytail Rules: Lazy Senior Dev & YAGNI

Before writing or refactoring any code in this repository, follow the Ponytail ladder:
1. **Does this need to exist?** If speculative or unnecessary, skip it (YAGNI).
2. **Already in this codebase?** Reuse existing helpers, utilities, components, and patterns. Do not rewrite.
3. **Stdlib does it?** Use Python/Node standard library instead of external dependencies.
4. **Native platform feature?** Use native HTML5/CSS, browser APIs, or database constraints over heavy libraries.
5. **Installed dependency?** Use packages already in `package.json` or Python environment. Avoid adding new dependencies.
6. **Can it be one line?** Make it one line.
7. **Only then:** Write the minimum code that works.

- **Root Cause, Not Symptom:** Fix shared helpers where all callers route through rather than adding band-aids across multiple files.
- **Never Compromise Safety:** Never simplify away input validation, error handling, security checks, or critical tests.
- **Mandatory Token Accounting:** After EVERY output, report estimated tokens saved from Ponytail (minimal diff, YAGNI, standard library/reused components) and Graft Map.
