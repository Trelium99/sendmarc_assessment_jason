# Solution

Keep this document concise—approximately 750 words or fewer.

## User and outcome

**Primary user:** someone on the domain-score page who wants to understand email security posture (DMARC, SPF, overall score) without reading a large JSON payload—whether they typed a domain themselves or an on-page assistant ran a lookup on their behalf.

**Outcome optimised for:** clarity and trust. After a lookup, the person should see what matters (overall score, policy level, key risks, sensible next steps) in an accessible layout. A small in-page assistant should answer follow-up questions using the same underlying data, in plain language, without dumping raw JSON.

**Secondary consumer:** browser agents and the Model Context Tool Inspector, which need a stable `score_domain` contract (name, description, schema, fixture-backed result).

## Implemented scope

*Update this subsection as implementation lands.*

**Part 1 — Human UI:** Replace the raw `<pre>` JSON view with a structured results experience: headings, score summary, DMARC/impersonation highlights, warnings where present (e.g. SPF lookup limits), loading and error states, and basic accessibility (semantic structure, labels, focus). Raw JSON is hidden by default; an optional collapsed “technical details” section may remain for transparency.

**Part 2 — WebMCP + on-page assistant:**

- Register **`score_domain`** per Chrome’s WebMCP Imperative API (`document.modelContext.registerTool`). Input: domain string. Output: corresponding fixture from `getScore()` / `fixtureFor()`, with clear errors for unsupported domains.
- Register on the domain-score route; unregister on unmount via `AbortSignal`.
- Tool metadata: description and `inputSchema` so agents know when to call it; `readOnlyHint: true` where appropriate.
- **Shared state:** form submit, `score_domain`, the results UI, and the assistant all use one lookup path and one cached assessment so the page and chat never disagree.
- **In-page assistant (corner widget):** thin client over `getTools()` / `executeTool()`—e.g. trigger lookups and answer questions about the *current* result with short summaries, not full fixture regurgitation.
- **Optional extra tools** (timeboxed): e.g. read current assessment or explain DMARC policy from loaded data—only if `score_domain` and Part 1 are solid.

**Deliberately out of scope for this slice:** live scoring API, auth, analytics, full multi-page tool registry, external ChatGPT integration, server-side MCP, and production visual polish.

## Assumptions and trade-offs

- Fixtures stand in for a future `fetch('/api/score')`; swapping the client in `getScore()` is the main backend change later.
- WebMCP is **not** a substitute for server-side scoring or partner APIs. It is a **page-scoped integration** for assistants when the user is on our origin—complementary to REST, not a way to avoid building the scoring service.
- Returning the **full fixture** from `score_domain` satisfies the assessment and the Tool Inspector; human brevity and chat tone are handled by the UI layer and assistant behaviour, not by stripping data from the required tool return.
- Hiding JSON improves comprehension for most users; a collapsible technical view trades minimalism for trust and power-user needs.
- A corner assistant is a stronger product story than “hope an external chat client finds our tab,” but it adds routing and scope risk in a four-hour box—hence one vertical slice first.

## Alternatives considered

- **REST/API-only for assistants:** Appropriate for integrations and headless use, but does not give a visible on-brand experience or avoid handing broad API access to every client. WebMCP targets browser-session, human-in-the-loop flows.
- **DOM actuation only (no tools):** No extra registration work, but brittle on UI changes and poor for structured errors—what WebMCP is meant to replace.
- **Assistant-only, no UI redesign:** Would meet the letter of the tool requirement weakly on “more useful than the prototype.”
- **UI-only, no assistant:** Strong for humans, weak demonstration of WebMCP beyond inspector-only calls. Chosen path combines both with shared state.

## AI use

Cursor was used before implementation to interpret the take-home brief, Chrome WebMCP docs (Imperative API, `registerTool`, inspector workflow), and fixture behaviour. Discussion covered real-world rationale (WebMCP vs backend APIs, when page tools add value vs hype), and shaped the two-part plan (structured UI + `score_domain` + on-page assistant). This `SOLUTION.md` draft summarises that planning; generated application code will be reviewed and edited during the timed implementation.

## Validation

*To complete after implementation.*

- `npm run build` passes; `/domain-score` loads.
- Tool Inspector discovers **`score_domain`**; invoke with reference domains (`sendmarc.com`, `neverssl.com`, `mit.edu`, `github.com`, `uber.com`) and confirm fixture-shaped results.
- Form and tool both update the same results UI.
- Assistant can trigger a lookup and answer at least one follow-up from loaded data without pasting full JSON.
- Manual check of keyboard/focus on form, results, and assistant entry point.

## Incomplete work and risks

- Only five fixture domains; normalisation and unsupported-domain messaging must be deliberate.
- In-page assistant “which tool?” routing can fail without tight descriptions and a small tool set.
- WebMCP requires Chrome flag and supported versions—environment coupling for customers until platform support broadens.
- No measurement of usefulness yet (assignment prompt)—would need events or qualitative pilot criteria before customer rollout.
- Assistant answers without a hosted LLM may be rule-based or stubbed in the slice; production would need a model, safety, and cost controls.

## Next steps

With more time on the **web slice:** wire a real scoring API; expand the on-page tool registry across the product IA; add usage metrics; user-test assistant phrasing; adopt `webmcp-types`; add consequential-action patterns if tools later mutate account state.

**Server MCP (off-page chat):** Build a **hosted MCP server** that exposes the same capabilities as the page tools (e.g. `score_domain`, explain policy, list monitored domains)—backed by the **same scoring API**, not fixtures. An external LLM client (ChatGPT, Claude Desktop, Cursor, internal support bot) connects via MCP **without** the user having our tab open. That removes the WebMCP discoverability constraint (“visit the site to see tools”) and suits integrations and support workflows where the chat window is the primary UI.

**Two-channel model:** Keep **WebMCP** for human-in-the-loop sessions on our origin (visible execution, brand, upsell, session cookies). Use **server MCP** for authenticated, off-site assistant access with keys/OAuth, rate limits, and audit logs. Align tool names, schemas, and descriptions across both so we do not maintain two different mental models. The in-page copilot can remain a thin client over WebMCP today and later delegate to server tools where appropriate.
