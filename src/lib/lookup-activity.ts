export type LookupActivitySource = "form" | "webmcp-tool" | "assistant-direct";

export type LookupActivityEvent = {
  source: LookupActivitySource;
  domain: string;
  toolName: "score_domain";
  at: number;
};

export const LOOKUP_ACTIVITY_EVENT = "sendmarc:lookup-activity";

export function publishLookupActivity(
  detail: Omit<LookupActivityEvent, "at" | "toolName"> & { toolName?: "score_domain" },
): void {
  window.dispatchEvent(
    new CustomEvent<LookupActivityEvent>(LOOKUP_ACTIVITY_EVENT, {
      detail: {
        toolName: "score_domain",
        at: Date.now(),
        ...detail,
      },
    }),
  );
}

export function describeActivity(event: LookupActivityEvent): string {
  switch (event.source) {
    case "form":
      return `Manual form lookup for ${event.domain}`;
    case "webmcp-tool":
      return `WebMCP ${event.toolName}("${event.domain}") — same handler as the form; results updated below`;
    case "assistant-direct":
      return `Assistant lookup for ${event.domain} (WebMCP not available in this browser — used app API directly)`;
    default:
      return `Lookup for ${event.domain}`;
  }
}
