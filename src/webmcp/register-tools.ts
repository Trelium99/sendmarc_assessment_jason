import { DEMO_DOMAINS } from "../lib/supported-domains.ts";

const SCORE_DOMAIN_DESCRIPTION = [
  "Run an email security assessment for a domain (DMARC, SPF, DKIM, and related DNS checks).",
  "Use when the user asks to score, check, or assess a domain's email authentication posture.",
  `Demo fixtures only — supported domains: ${DEMO_DOMAINS.join(", ")}.`,
  "Returns the full assessment object for the domain. Updates the on-page results when run in the browser.",
].join(" ");

export async function registerScoreDomainTool(
  runLookup: (domain: string) => Promise<unknown>,
  signal: AbortSignal,
): Promise<void> {
  const modelContext = document.modelContext;
  if (!modelContext?.registerTool) {
    return;
  }

  await modelContext.registerTool(
    {
      name: "score_domain",
      description: SCORE_DOMAIN_DESCRIPTION,
      inputSchema: {
        type: "object",
        properties: {
          domain: {
            type: "string",
            description:
              "Domain name to assess (e.g. sendmarc.com). Hostnames are normalised to lowercase.",
          },
        },
        required: ["domain"],
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
        consequentialHint: false,
      },
      execute: async (input) => {
        const domain = input.domain;
        if (typeof domain !== "string" || !domain.trim()) {
          throw new Error("domain is required and must be a non-empty string.");
        }
        return await runLookup(domain);
      },
    },
    { signal },
  );
}
