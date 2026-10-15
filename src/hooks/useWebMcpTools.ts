import { useEffect, useRef } from "react";
import type { RunLookupOptions } from "./useDomainAssessment.ts";
import { registerScoreDomainTool } from "../webmcp/register-tools.ts";

export function useWebMcpTools(
  runLookup: (domain: string, options?: RunLookupOptions) => Promise<unknown>,
) {
  const runLookupRef = useRef(runLookup);
  runLookupRef.current = runLookup;

  useEffect(() => {
    const controller = new AbortController();

    void registerScoreDomainTool(
      (domain) => runLookupRef.current(domain, { activitySource: "webmcp-tool" }),
      controller.signal,
    ).catch(
      (error) => {
        if (controller.signal.aborted) return;
        console.error("WebMCP: failed to register score_domain", error);
      },
    );

    return () => {
      controller.abort();
    };
  }, []);
}
