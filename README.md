# Product Engineer take-home

This repository contains the starting application for the Product Engineer technical assessment. The app accepts a domain and displays a captured response from our scoring service.

Complete the setup and browser preflight below before starting the timed assessment. Setup time does not count toward the timebox.

## Prerequisites

- Node.js 22 or newer
- Chrome 146 or newer
- npm

## Application setup

```bash
git clone https://github.com/sendmarc-labs/webmcp-assignment.git
cd webmcp-assignment
npm ci
npm run build
npm run dev
```

Open [http://localhost:5173/domain-score](http://localhost:5173/domain-score).

Lookups go through `src/api/score.ts`, which returns captured responses from `src/fixtures`.

## WebMCP setup

This assessment uses **Chrome WebMCP** as specified in [Chrome's WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp). Treat that page as the platform contract for this exercise.

### Browser flag

Open `chrome://flags/#enable-webmcp-testing`, set it to **Enabled**, and relaunch Chrome. We use the flag rather than an origin trial so the feature works on localhost.

Check `chrome://version` if you are unsure which Chrome version is running.

### Inspector

Install the [Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd) from the Chrome Web Store. It allows you to discover and invoke tools directly without an agent.

## Preflight

Before starting the timer, confirm that:

- `npm ci` completes successfully
- `npm run build` passes
- the domain-score page opens
- looking up `sendmarc.com` returns JSON
- the inspector opens for the page and currently shows no tools

If any preflight step fails, stop and contact us. We will resolve the environment problem before you begin.

## Timed assessment

Once preflight succeeds:

1. Start your timer.
2. Read [ASSIGNMENT.md](ASSIGNMENT.md).
3. Complete as much useful work as you can within the timebox.
4. Fill in [SOLUTION.md](SOLUTION.md).

The assessment timebox is **4 hours**. Stop working when the four hours are complete. Incomplete work is acceptable; prioritisation and clearly explained scope cuts are part of the assessment.

You may use your normal AI tools. Record how you used them in `SOLUTION.md`.

## Reference domains

Use these captured inputs:


| Domain         | What the capture covers   |
| -------------- | ------------------------- |
| `neverssl.com` | No DMARC record           |
| `mit.edu`      | `p=none`                  |
| `github.com`   | `p=quarantine`            |
| `sendmarc.com` | `p=reject`                |
| `uber.com`     | SPF lookup-limit warnings |




## Submission

Submit:

- your repository or patch
- the completed `SOLUTION.md`
- the actual time you spent on the timed assessment
- any setup or environment problems you encountered

We will discuss your decisions in a separate technical debrief.