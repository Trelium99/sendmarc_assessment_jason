import { Link } from "react-router";

export function HomePage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-4 text-xl font-semibold">Home</h1>
      <p>
        Internal tools for reviewing a domain&apos;s email authentication. Start
        with the{" "}
        <Link
          to="/domain-score"
          className="text-sky-600 underline underline-offset-2 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
        >
          domain score
        </Link>{" "}
        lookup.
      </p>
    </main>
  );
}
