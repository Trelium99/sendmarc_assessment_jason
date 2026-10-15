import type { DomainScoreResponse } from "./domain-score-types.ts";
import { buildDisplaySections, isDomainScoreResponse } from "./format-response-sections.ts";
import { DEMO_DOMAINS, normalizeDomain } from "./supported-domains.ts";
import type { LookupState } from "../hooks/useDomainAssessment.ts";

export type AssistantTurn = {
  role: "user" | "assistant";
  text: string;
};

const DOMAIN_PATTERN = /\b([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}\b/i;

function extractDomain(text: string): string | null {
  const lower = text.toLowerCase();
  for (const demo of DEMO_DOMAINS) {
    if (lower.includes(demo)) return demo;
  }
  const match = text.match(DOMAIN_PATTERN);
  return match ? normalizeDomain(match[0]) : null;
}

function wantsLookup(text: string): boolean {
  return /\b(score|check|assess|lookup|look up|scan|analyze|analyse)\b/i.test(text);
}

async function runScoreDomainTool(
  domain: string,
  runLookup: (domain: string, options?: { activitySource?: "form" | "webmcp-tool" | "assistant-direct" }) => Promise<unknown>,
): Promise<{ result: unknown; usedWebMcp: boolean }> {
  const modelContext = document.modelContext;
  if (modelContext?.getTools && modelContext?.executeTool) {
    const tools = await modelContext.getTools();
    const scoreTool = tools.find(
      (tool) =>
        tool &&
        typeof tool === "object" &&
        "name" in tool &&
        (tool as { name: string }).name === "score_domain",
    );
    if (scoreTool) {
      const result = await modelContext.executeTool(scoreTool, { domain });
      return { result, usedWebMcp: true };
    }
  }
  const result = await runLookup(domain, { activitySource: "assistant-direct" });
  return { result, usedWebMcp: false };
}

export type AssistantReply = {
  text: string;
  usedWebMcp: boolean;
};

function summarizeAssessment(data: DomainScoreResponse): string {
  const sections = buildDisplaySections(data, "summary");
  const impersonation = sections.find((s) => s.id === "impersonation");
  const policyRow = impersonation?.rows.find((r) => r.label.includes("DMARC enforcement"));
  const lines = [
    `**${data.domain}** has an overall score of **${data.score_pct}%**.`,
  ];

  if (policyRow) {
    lines.push(`DMARC enforcement is **${policyRow.value}**.`);
  } else if (!data.impersonation.has_dmarc_record) {
    lines.push("There is **no DMARC record** — impersonation protection is weak.");
  }

  if (impersonation?.alert) {
    lines.push(`Note: ${impersonation.alert}`);
  }

  lines.push("See the dashboard on this page for the full breakdown.");
  return lines.join(" ");
}

function answerFromCurrentResult(lookup: LookupState, question: string): string | null {
  if (lookup.status !== "ok" || !isDomainScoreResponse(lookup.data)) {
    return null;
  }

  const data = lookup.data;
  const q = question.toLowerCase();

  if (/\b(score|overall|result)\b/.test(q)) {
    return `${data.domain} scores **${data.score_pct}%** overall.`;
  }

  if (/\b(dmarc|policy|impersonat|spoof|phish)\b/.test(q)) {
    const dmarc = data.records?.dmarc as Record<string, unknown> | undefined;
    const policy = typeof dmarc?.policy === "string" ? dmarc.policy : null;
    if (!data.impersonation.has_dmarc_record) {
      return "DMARC is **not configured**. Anyone can more easily send email that looks like your domain.";
    }
    if (policy === "reject") {
      return "DMARC is on **reject** — failing messages should be blocked. That's the strongest common setting.";
    }
    if (policy === "quarantine") {
      return "DMARC is on **quarantine** — suspicious mail often lands in spam.";
    }
    if (policy === "none") {
      return "DMARC is on **none** (monitoring only). Failing mail may still be delivered.";
    }
    return "DMARC is present. Open the impersonation card on the dashboard for policy details.";
  }

  if (/\b(spf|sender|verify)\b/.test(q)) {
    const sections = buildDisplaySections(data, "summary");
    const imp = sections.find((s) => s.id === "impersonation");
    if (imp?.alert) return imp.alert;
    return data.impersonation.has_spf_record
      ? "SPF is configured for this domain."
      : "SPF is **missing** — senders may fail verification.";
  }

  if (/\b(dkim|sign)\b/.test(q)) {
    const count = data.impersonation.num_dkim_records;
    return typeof count === "number"
      ? `There are **${count}** DKIM signing key(s) detected.`
      : "DKIM details are on the dashboard under impersonation protection.";
  }

  if (/\b(warn|risk|problem|issue)\b/.test(q)) {
    const sections = buildDisplaySections(data, "summary");
    const imp = sections.find((s) => s.id === "impersonation");
    if (imp?.alert) return imp.alert;
    if (data.score_pct < 50) {
      return "The overall score is below 50%. Review impersonation and DNS setup on the dashboard.";
    }
    return "No major warnings in the summary view. Toggle **detailed view** for DNS-level findings.";
  }

  return null;
}

export async function handleAssistantMessage(
  text: string,
  lookup: LookupState,
  runLookup: (domain: string, options?: { activitySource?: "form" | "webmcp-tool" | "assistant-direct" }) => Promise<unknown>,
): Promise<AssistantReply> {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      text: "Ask me something — for example: “Score sendmarc.com” or “What's our DMARC policy?”",
      usedWebMcp: false,
    };
  }

  if (/^\/?(help|hi|hello)\b/i.test(trimmed)) {
    return {
      text: [
        "I can help with domain email security checks (demo fixtures only).",
        "",
        "**Practical demo flow**",
        "1. Ask me to score a domain — I call **score_domain** via WebMCP when Chrome supports it.",
        "2. Watch the **activity log** above the dashboard — same event appears if you use the Tool Inspector.",
        "3. Ask follow-ups (DMARC, SPF, warnings) — I answer from the loaded result, not raw JSON.",
        "",
        "Try: **Score uber.com** → **Any warnings?**",
        "",
        `Demo domains: ${DEMO_DOMAINS.join(", ")}`,
      ].join("\n"),
      usedWebMcp: false,
    };
  }

  const domain = extractDomain(trimmed);
  if (domain && (wantsLookup(trimmed) || DEMO_DOMAINS.includes(domain as (typeof DEMO_DOMAINS)[number]))) {
    try {
      const { result, usedWebMcp } = await runScoreDomainTool(domain, runLookup);
      if (isDomainScoreResponse(result)) {
        const via = usedWebMcp
          ? "I called **score_domain** through WebMCP (`executeTool`) — check the activity log and the dashboard below."
          : "I ran the lookup directly (enable the WebMCP Chrome flag to use the real tool path).";
        return {
          text: `${via}\n\n${summarizeAssessment(result)}`,
          usedWebMcp,
        };
      }
      return {
        text: `Lookup finished for ${domain}. Check the dashboard for results.`,
        usedWebMcp,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lookup failed.";
      return { text: `I couldn't score that domain: ${message}`, usedWebMcp: false };
    }
  }

  const contextual = answerFromCurrentResult(lookup, trimmed);
  if (contextual) return { text: contextual, usedWebMcp: false };

  if (lookup.status !== "ok") {
    return {
      text: `Ask me to score a domain first (e.g. “Check mit.edu”). Demo domains: ${DEMO_DOMAINS.join(", ")}.`,
      usedWebMcp: false,
    };
  }

  return {
    text: "I'm not sure about that. Try **help**, or ask about **score**, **DMARC**, **SPF**, or **warnings** after a lookup.",
    usedWebMcp: false,
  };
}
