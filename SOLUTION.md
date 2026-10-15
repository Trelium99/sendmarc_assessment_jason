# Solution

## User and outcome

**Primary user:** someone on the domain-score page who needs a readable email-security assessment (DMARC, SPF, overall score)—via the form, the on-page assistant, or a browser agent.

**Outcome:** a tiled dashboard with plain-language labels and hints. A **summary / detailed** toggle adds per-record DNS cards, never raw JSON. Form, tool, and assistant all update that same dashboard.

**Secondary consumer:** the Model Context Tool Inspector, via `score_domain`.

## Implemented scope

**Results (**`response_ui.tsx`**,** `format-response-sections.ts`**):**

- Summary: overall score plus cards for domain setup, impersonation, transport privacy, and brand. Nameservers, IP lists, and per-record DNS checks stay hidden. DMARC policy is lifted from `records.dmarc` onto the impersonation card (`reject`, `quarantine`, or `none`, with a short hint). SPF lookup warnings (for example `uber.com`) show as an alert.
- Detailed: nameservers, mail hosts, IPs, TTLs, and one card per DNS record type. Findings render as rows. DKIM selectors appear without public-key material.
- 12-column tiles, MUI status icons and chips, light/dark mode.

**WebMCP (**`register-tools.ts`**,** `useWebMcpTools.ts`**):**

- `score_domain` on `/domain-score`. The description lists the five demo domains. `domain` is required. Annotations: `readOnlyHint: true`; content is trusted and the call is not consequential.
- `execute` calls shared `runLookup` and returns the full fixture. Empty input and unknown domains throw (the latter names the demo list). Unregister uses `AbortSignal`. Missing `document.modelContext` skips registration.

**Shared lookup (**`useDomainAssessment.ts`**):** one `runLookup` for form, tool, and assistant. Domains are trimmed, lowercased, and written back into the field. State is idle, loading, error, or ok.

**Demo layer:**

- `LookupActivityPanel`**:** readiness chip, plus the last six lookups. Sources are the form, `score_domain` (inspector or assistant `executeTool`), and a direct assistant fallback when WebMCP is absent.
- `PageAssistant`**:** rule-based chat, no API key. Lookups call `getTools` / `executeTool` when `score_domain` is registered, otherwise `runLookup`. Follow-ups (score, DMARC, SPF, DKIM count, warnings) use the loaded result in short prose. Chips: **Score** for each fixture domain.

**Dependencies:** `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` for cards, alerts, chips, icons, and theme. The form stays on Tailwind.

**Left out:** live scoring API, auth, analytics, extra tools, a hosted LLM, server MCP, a next-step action, and production polish.

## Assumptions and trade-offs

- Fixtures stay behind `getScore()`. A real API replaces that function; the tool name, schema, and page state stay put.
- Agents get the full fixture. People only see the presenter.
- The assistant is pattern matching: fine for the demo script, weak as general NLU. A product version would put an LLM in front of the same tool.
- Assistant calls through `executeTool` log as **WebMCP** `score_domain`, same as the inspector. “Assistant direct” appears only when the tool is missing.
- Detailed view still shows some resolver strings (`ns_addr`, `ns_proto`). Dropped on purpose: `*_ref` pointers, `cnames`, `record_parts`, `redirected_to`. The activity panel makes the page-scoped, flag-dependent WebMCP limit obvious.



## Alternatives considered

- **Raw JSON toggle:** rejected. Detailed mode is a second dashboard.
- **Assistant-only or UI-only:** both, plus the inspector, so one lookup has three entry points.
- `get_current_assessment`**:** deferred. Follow-ups read state already loaded by `score_domain`.



## AI use

I used Cursor as my primary AI tooling. I used it to brainstorm implementation and understand the real world use case for MCPWebTooling as a technology I have not previously implemented before. I used it for boilerplate generation, and UI component iteration quickly.   

Key point:  

- Fast UI implementation
- Bridge the knolwedge gap on a new tech (MCPWebtools)
- Documentation



## Validation

- `npm run build` passes.
- Form lookup works for all five reference domains; an unknown domain shows the demo list.
- With the Chrome flag, the inspector lists and invokes `score_domain`, and the dashboard and activity log update.
- **Score sendmarc.com** updates the dashboard. **“What’s the DMARC policy?”** answers in prose after a load.
- Summary vs detailed checked on `neverssl.com` (no DMARC) and `uber.com` (SPF warning).



## Incomplete work and risks

- No usefulness metrics. The assistant cannot take arbitrary questions. WebMCP needs the Chrome flag.
- Types are a local `model-context.d.ts`, not the `webmcp-types` package.
- The lookup field has no `<label>`, and loading is not announced with `aria-busy`.
- Detailed cards can still show low-level resolver fields such as `ns_addr`.



## Next steps

Replace `getScore` with the real API. Record lookup source (form / WebMCP / assistant). Add a concrete next step on weak results (missing DMARC, SPF over the lookup limit). Optionally put a hosted LLM in front of the same `score_domain` tool.

**Server MCP:** host the same tool so ChatGPT or Claude Desktop can assess a domain without an open tab, with auth, quotas, and audit logging. Keep WebMCP for on-site sessions where the dashboard updates in view. Share schemas and descriptions.