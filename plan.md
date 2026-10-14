# Implementation plan

Aligned with [ASSIGNMENT.md](ASSIGNMENT.md), [SOLUTION.md](SOLUTION.md), and the two-part goal: **readable results UI** + **`score_domain` WebMCP** + **on-page assistant** over shared state.

**Timebox:** 4 hours implementation (README). Treat phases below as priority order—stop at a clean milestone rather than finishing every optional item.

---

## Success criteria (definition of done)

| Must have | Check |
|-----------|--------|
| `npm run build` passes | |
| `/domain-score` works for form + all five reference domains | |
| Tool Inspector lists and invokes **`score_domain`** | |
| Tool returns fixture JSON; unsupported domain fails clearly | |
| Results UI is clearly better than raw `<pre>` JSON | |
| Tool run updates the same UI as the form (shared flow) | |
| `SOLUTION.md` updated (remove “planned” placeholders where done) | |

| Should have (if time) | |
|------------------------|---|
| Corner assistant triggers lookup via `executeTool` | |
| Assistant answers 2–3 follow-ups from **current** result (no JSON dump) | |
| Collapsed “Technical details” JSON | |
| One extra read-only tool (e.g. `get_current_assessment`) | |

| Cut line (defer) | |
|------------------|---|
| Real LLM in assistant (use keyword / rule routing first) | |
| Analytics, auth, multi-page tools | |
| `webmcp-types` npm package (optional; inline `vite-env.d.ts` is enough) | |

---

## Suggested time budget

| Phase | Focus | ~minutes |
|-------|--------|----------|
| 0 | Preflight + skim fixtures | 15 |
| 1 | Types + view model from fixture JSON | 45 |
| 2 | Results UI (Part 1) | 75 |
| 3 | Shared lookup state + wire form | 30 |
| 4 | `score_domain` + WebMCP types | 45 |
| 5 | On-page assistant | 60 |
| 6 | Polish, a11y pass, validation, `SOLUTION.md` | 30 |

---

## Architecture

```text
DomainScorePage
├── DomainLookupForm          → runLookup(domain)
├── DomainScoreResults        → reads AssessmentViewModel
├── useDomainAssessment()     → state: idle | loading | error | ok
├── registerWebMcpTools()     → score_domain (+ optional tools)
└── PageAssistant             → getTools / executeTool + local Q&A
         │
         ▼
    getScore(domain)  →  fixtureFor  →  mapFixtureToViewModel(data)
```

**Rule:** Only `getScore` / `fixtureFor` talks to fixtures. UI, tools, and assistant all go through `runLookup` + shared state.

---

## Phase 0 — Preflight

- [ ] `npm ci && npm run build && npm run dev`
- [ ] Chrome: `chrome://flags/#enable-webmcp-testing` → Enabled
- [ ] Model Context Tool Inspector on `http://localhost:5173/domain-score` (no tools yet)
- [ ] Skim one fixture per scenario: `neverssl.com`, `mit.edu`, `github.com`, `sendmarc.com`, `uber.com`

Note useful fields for the view model:

- Top level: `domain`, `score_pct`
- `impersonation`: `has_dmarc_record`, `has_spf_record`, `score`
- `records.dmarc`: `policy`, `subdomain_policy` (when present)
- `records.spf`: lookup counts / warnings (uber)
- `info`: mail/DNS providers (optional copy)

---

## Phase 1 — Types and view model

**Add** `src/types/score.ts` (or similar)

- Type the subset of the fixture you render (avoid typing entire 500-line JSON unless quick).
- `AssessmentViewModel`: headline score, status label, DMARC summary, SPF/DKIM flags, warnings[], recommendedNextStep (string), domain.

**Add** `src/lib/mapAssessment.ts`

- `mapFixtureToViewModel(data: unknown): AssessmentViewModel`
- Derive human labels: e.g. no DMARC → “No DMARC record”; `policy: none` → monitoring only; `reject` → enforced.
- Pull uber-specific warning if `num_lookup` high or tags/messages in fixture (inspect `uber.com.json` once).

**Add** `src/lib/supportedDomains.ts` (optional)

- Export list of demo domains for tool description and error copy.

---

## Phase 2 — Results UI (Part 1)

**Add** `src/components/DomainScoreResults.tsx`

- `<section aria-labelledby="results-heading">` with:
  - Overall score (large, with text equivalent—not color alone)
  - DMARC block: present/absent, policy, short explanation
  - Impersonation / SPF / DKIM bullets
  - Warnings list (`role="status"` or alert pattern if critical)
  - **Next step** CTA line (educational, not a fake button unless you want a link to SendMarc docs)
- `<details>` for “Technical details” → optional pretty JSON (only here)

**Update** `src/pages/DomainScorePage.tsx`

- Remove raw `<pre>` as default.
- Keep form; improve labels (`<label htmlFor=…>`, `aria-busy` while loading, `aria-live="polite"` on results region).

Styling: stay within existing Tailwind patterns in the repo; clarity over polish.

---

## Phase 3 — Shared lookup hook

**Add** `src/hooks/useDomainAssessment.ts`

```text
state: idle | loading | error(message) | ok(viewModel, rawFixture)
runLookup(domain: string): Promise<void>
```

- Normalise domain: `trim().toLowerCase()` (match `fixtureFor`).
- On success: store both **view model** (UI + assistant) and **raw** (tool return / details panel).
- Expose `rawFixture` for `score_domain` return value and optional details.

Wire form `onSubmit` → `runLookup`.

---

## Phase 4 — WebMCP tools

**Add** `src/vite-env.d.ts` (extend) or minimal interface:

```ts
interface ModelContextTool { ... }
document.modelContext.registerTool(...)
```

**Add** `src/webmcp/registerTools.ts`

Register on mount from `DomainScorePage` (or dedicated hook `useWebMcpTools`):

### `score_domain` (required)

| Field | Guidance |
|-------|----------|
| `name` | `score_domain` |
| `description` | Domain security assessment (demo). List five supported domains. Returns full assessment payload. |
| `inputSchema` | `{ domain: string }`, required |
| `annotations` | `readOnlyHint: true` |
| `execute` | normalise → `runLookup(domain)` → return **raw fixture**; on failure return/throw structured error |

**Important:** `execute` must call the same `runLookup` that drives the UI so the inspector demo shows the page updating.

Use `AbortController` in `useEffect` cleanup to unregister.

### Optional: `get_current_assessment`

- No input or empty object.
- Returns short summary object for chat (policy, score, top warning)—not required for minimum pass.

**Validation**

- [ ] Inspector: invoke `score_domain` with `sendmarc.com`
- [ ] Page shows structured results without using the form
- [ ] `neverssl.com` / `example.com` behaviour matches your error design

---

## Phase 5 — On-page assistant

**Add** `src/components/PageAssistant.tsx`

- Fixed corner panel: toggle open/close, keyboard focus trap light (don’t overbuild).
- Message list (user + assistant).
- Input + send.

**V1 behaviour (deterministic, no API keys):**

1. Parse intent with simple rules:
   - Domain-like token or “score/check …” → `executeTool(score_domain, { domain })`
   - “policy” / “dmarc” / “score” / “warnings” with existing result → answer from `AssessmentViewModel`
   - Else → short help (“Ask me to check sendmarc.com, or ask about DMARC policy after a lookup.”)
2. Assistant replies in 2–4 sentences; never paste full JSON.

**V2 (only if time):** call `getTools()` dynamically instead of hard-coding tool names.

**Accessibility:** button to open assistant has `aria-expanded`; announce new messages in `aria-live` region.

---

## Phase 6 — Finish

- [ ] Run reference domain matrix (below)
- [ ] Quick keyboard tab through form → results → assistant
- [ ] Update `SOLUTION.md` **Implemented scope** and **Validation** (remove italics placeholders)
- [ ] Note actual hours spent for submission
- [ ] Prepare walkthrough outline (README): demo inspector → form → assistant → trade-offs

---

## Reference domain test matrix

| Domain | Expect in UI (headline) |
|--------|-------------------------|
| `neverssl.com` | No / missing DMARC, low score |
| `mit.edu` | DMARC present, `p=none` (monitoring) |
| `github.com` | `p=quarantine` |
| `sendmarc.com` | Strong score, `p=reject` |
| `uber.com` | SPF / lookup warning surfaced |
| `example.com` | Unsupported fixture error |

---

## File checklist (expected new/edited)

| Action | Path |
|--------|------|
| Edit | `src/pages/DomainScorePage.tsx` |
| Add | `src/hooks/useDomainAssessment.ts` |
| Add | `src/lib/mapAssessment.ts` |
| Add | `src/types/score.ts` |
| Add | `src/components/DomainScoreResults.tsx` |
| Add | `src/components/PageAssistant.tsx` |
| Add | `src/webmcp/registerTools.ts` |
| Edit | `src/vite-env.d.ts` |
| Edit | `SOLUTION.md` |

---

## Walkthrough script (10–15 min, post-timebox)

1. Problem: raw JSON + no agent hook (30s)
2. Demo form → structured result for `mit.edu` (2 min)
3. Tool Inspector → `score_domain` for `sendmarc.com`; page updates (3 min)
4. Assistant: lookup + “what’s our DMARC policy?” (3 min)
5. Trade-offs: fixtures vs API, rule-based assistant vs LLM, what you skipped (3 min)
6. AI use and next steps (2 min)

---

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| `document.modelContext` undefined outside Chrome/flag | Document in SOLUTION; test only in flagged Chrome |
| Tool registers twice on HMR | AbortSignal on cleanup; single registration hook |
| 4h overrun | Ship Phase 1–4 before assistant; assistant can be rule-only |
| Fixture shape drift | map layer isolates UI from full JSON |

---

## Production direction (not this PR)

- Replace `fixtureFor` with authenticated API in `getScore`.
- Same tool names; add rate limiting and tenant scoping server-side.
- Assistant backed by hosted model with tool routing; expand tool registry across the product.
- Measure: lookup source (form vs tool vs assistant), time-to-understanding, optional thumbs on assistant replies.

### Expand to a hosted MCP server (off-page LLM chat)

Today’s slice is **page-bound**: tools register on `document.modelContext` only while the user is on `/domain-score`. Production should add a **standalone MCP server** (Node or similar) that:

- Implements the **same tool surface** (`score_domain`, etc.) against the real scoring backend.
- Lets users **link an external AI chat** (ChatGPT connectors, Claude Desktop, internal agents) so they can score domains and ask follow-ups **without** opening our site.
- Enforces **auth** (API keys, OAuth, tenant scoping), **quotas**, and **audit logging**—requirements that are awkward to meet with page-only WebMCP alone.

```text
                    ┌─────────────────────┐
  User on site  ──► │ WebMCP (page tools) │ ──► scoring API
                    └─────────────────────┘
                    ┌─────────────────────┐
  User in chat  ──► │ Server MCP          │ ──► same scoring API
  (any client)      └─────────────────────┘
```

Keep schemas and descriptions in sync between WebMCP handlers and server MCP so one product team owns the contract. WebMCP remains valuable for visible, on-brand execution; server MCP unlocks reach when the chat window is the app.
