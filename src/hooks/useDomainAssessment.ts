import { useCallback, useState } from "react";
import { getScore } from "../api/score.ts";
import { publishLookupActivity, type LookupActivitySource } from "../lib/lookup-activity.ts";
import { normalizeDomain } from "../lib/supported-domains.ts";

export type RunLookupOptions = {
  activitySource?: LookupActivitySource;
};

export type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: unknown };

export function useDomainAssessment() {
  const [domainInput, setDomainInput] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });

  const runLookup = useCallback(async (rawDomain: string, options?: RunLookupOptions): Promise<unknown> => {
    const trimmed = rawDomain.trim();
    if (!trimmed) {
      const message = "Enter a domain.";
      setLookup({ status: "error", message });
      throw new Error(message);
    }

    const domain = normalizeDomain(trimmed);
    setDomainInput(domain);
    setLookup({ status: "loading" });

    try {
      const data = await getScore(domain);
      setLookup({ status: "ok", data });
      publishLookupActivity({
        source: options?.activitySource ?? "form",
        domain,
      });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Lookup failed.";
      setLookup({ status: "error", message });
      throw error;
    }
  }, []);

  return {
    domainInput,
    setDomainInput,
    lookup,
    runLookup,
  };
}
