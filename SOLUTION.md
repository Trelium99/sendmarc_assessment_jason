# Solution

Keep this document concise—approximately 750 words or fewer.

## User and outcome

**Primary user:** someone on the domain-score page who needs a readable email-security assessment (DMARC, SPF, overall score) without parsing raw API payloads—whether they use the form, the on-page assistant, or a browser agent via WebMCP.

**Outcome optimised for:** clarity, trust, and a demonstrable agent path. Results appear as a tiled dashboard with plain-language labels and hints. A **detailed view** expands into per-record DNS cards (still UI, never raw JSON). Tool and assistant runs update the **same** dashboard so the human always sees what the agent triggered.

**Secondary consumer:** the Model Context Tool Inspector (and future browser agents) via `**score_domain`**.

## Implemented scope

**Results UI (`response_ui.tsx`, `format-response-sections.ts`):**

- Summary dashboard: overall score strip plus cards for domain setup, impersonation, transport privacy, and brand—built from fixture JSON with technical noise filtered (no `records` dump in summary; DMARC policy pulled from `records.dmarc` where relevant; SPF warnings e.g. on `uber.com`).
- **Summary / detailed** toggle: detailed mode adds nameservers, mail hosts, IPs, and one card per DNS record type (SOA, NS, MX, DMARC, SPF, DKIM, etc.) with findings/tags as readable rows.
- Responsive **12-column tile** layout; MUI icons and chips for status; light/dark mode via `ColorModeProvider` and header toggle.

**WebMCP (`webmcp/register-tools.ts`, `useWebMcpTools.ts`):**

- `**score_domain**` registered on `/domain-score` with description, JSON Schema (`domain` required), `readOnlyHint: true`, and `execute` calling shared `runLookup`.
- Unregister on unmount via `AbortSignal`.
- Returns full fixture object; unsupported domains error with demo domain list (`fixtures.ts` / `supported-domains.ts`).

**Shared lookup (`useDomainAssessment.ts`):**

- Single `runLookup` for form, WebMCP tool, and assistant; normalises domains; drives loading/error/ok state and form field.

**Practical demo layer:**

- `**LookupActivityPanel`:** WebMCP readiness chip plus live log of lookups (form vs `score_domain` vs assistant fallback).
- `**PageAssistant`:** rule-based “demo AI” (no API key)—lookup intents call `executeTool(score_domain)` when WebMCP is available, else direct `runLookup`; follow-ups (DMARC, SPF, warnings, score) answer from loaded data in short prose. Suggested chips: **Score** for each fixture domain (`neverssl.com`, `mit.edu`, `github.com`, `sendmarc.com`, `uber.com`).

**Dependencies added:** `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`.

**Deliberately not built:** live scoring API, auth, analytics, additional WebMCP tools, hosted LLM, server-side MCP, production polish.

## Assumptions and trade-offs

- Fixtures via `getScore()`; production replaces `fixtureFor` with an authenticated API—tool contract unchanged.
- Tool returns **full fixture** for agents; humans see the presenter layer only.
- Assistant is **deterministic** (regex/intents)—fast and demo-friendly, but not general NLU; a real product would use an LLM with the same tool surface.
- WebMCP is page-scoped and flag-dependent; activity panel makes that visible for evaluators and walkthroughs.
- Detailed view omits lowest-level resolver fields (`ns_addr`, `cnames`, `record_parts`) to limit noise while staying honest about DNS content.

## Alternatives considered

- **Raw JSON toggle:** rejected; detailed mode is an expanded dashboard instead.
- **Assistant-only or UI-only:** combined both plus inspector path to show one backend, three entry points.
- **Extra MCP tools** (e.g. `get_current_assessment`): deferred to keep one clear tool and a small assistant scope.

## AI use

Cursor was used throughout: brief interpretation, architecture (`plan.md`), implementation of UI presenter, WebMCP registration, assistant/activity panel, theming, and iterative fixes. AI-generated structure was reviewed against fixture shapes and assignment minimums; domain-specific copy and trade-offs were edited manually. This document was updated to match the shipped code.

## Validation

- `npm run build` passes.
- `/domain-score`: form lookup works for all five reference domains.
- Chrome WebMCP flag on: Tool Inspector lists `**score_domain**`; invoke updates dashboard and activity log.
- Assistant chip **Score sendmarc.com** (and other domains) updates dashboard; follow-up **“What’s the DMARC policy?”** works after load without JSON in chat.
- Summary/detailed toggle exercises `neverssl.com` (no DMARC) and `uber.com` (SPF warning).

## Incomplete work and risks

- No quantitative “usefulness” metrics.
- Assistant cannot handle arbitrary questions; WebMCP unavailable without Chrome flag/support.
- No `webmcp-types` package; local `model-context.d.ts` instead.

## Next steps

Wire real scoring API; add analytics on lookup source (form / WebMCP / assistant); optional hosted LLM with unchanged `score_domain`; expand tools on other product pages.

**Server MCP:** mirror `score_domain` (and future tools) on a hosted MCP server backed by the same API so ChatGPT/Claude Desktop can run assessments without an open tab—while keeping WebMCP for on-site, human-visible sessions. Align schemas and descriptions across both channels.