import { useState, type FormEvent } from "react";
import { getScore } from "../api/score.ts";
import ResponseUI from "../components/response_ui.tsx";
import { isDomainScoreResponse } from "../lib/format-response-sections.ts";

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; data: unknown };

export function DomainScorePage() {
  const [domain, setDomain] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = domain.trim();
    if (!value) {
      setLookup({ status: "error", message: "Enter a domain." });
      return;
    }

    setLookup({ status: "loading" });
    try {
      const data = await getScore(value);
      setLookup({ status: "ok", data });
    } catch (error) {
      setLookup({
        status: "error",
        message: error instanceof Error ? error.message : "Lookup failed.",
      });
    }
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Domain score</h1>

      <form onSubmit={onSubmit} className="mb-6 flex gap-2">
        <input
          name="domain"
          type="text"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
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
    </main>
  );
}
