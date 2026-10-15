import { type FormEvent } from "react";
import { LookupActivityPanel } from "../components/lookup_activity_panel.tsx";
import { PageAssistant } from "../components/page_assistant.tsx";
import ResponseUI from "../components/response_ui.tsx";
import { useDomainAssessment } from "../hooks/useDomainAssessment.ts";
import { useWebMcpTools } from "../hooks/useWebMcpTools.ts";
import { isDomainScoreResponse } from "../lib/format-response-sections.ts";

export function DomainScorePage() {
  const { domainInput, setDomainInput, lookup, runLookup } = useDomainAssessment();

  useWebMcpTools(runLookup);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await runLookup(domainInput, { activitySource: "form" });
    } catch {
      // State updated in runLookup
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Domain score</h1>

      <LookupActivityPanel />

      <form onSubmit={onSubmit} className="mb-6 flex gap-2">
        <input
          name="domain"
          type="text"
          value={domainInput}
          onChange={(event) => setDomainInput(event.target.value)}
          placeholder="example.com"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-900 placeholder:text-zinc-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={lookup.status === "loading"}
          className="rounded border border-zinc-800 bg-zinc-900 px-3 py-1 text-white hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          Look up
        </button>
      </form>

      {lookup.status === "loading" ? (
        <p className="text-zinc-600 dark:text-zinc-400">Loading…</p>
      ) : null}

      {lookup.status === "error" ? (
        <p className="text-red-600 dark:text-red-400">{lookup.message}</p>
      ) : null}

      {lookup.status === "ok" && isDomainScoreResponse(lookup.data) ? (
        <ResponseUI response={lookup.data} />
      ) : lookup.status === "ok" ? (
        <p className="text-red-600 dark:text-red-400">Unexpected response format.</p>
      ) : null}

      <PageAssistant lookup={lookup} runLookup={runLookup} />
    </main>
  );
}
