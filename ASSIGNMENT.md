# WebMCP domain assessment

## Context

We have a domain-score page backed by captured responses. People increasingly ask browser assistants to perform tasks instead of filling in forms, and we want to test whether exposing this capability through WebMCP creates a useful customer experience.

The page is not currently exposed as a WebMCP tool. Its result is also difficult to interpret, input and errors are basic, and we do not yet know how we would tell whether the experience is useful.

## Stakeholder request

> Let a browser assistant request a domain assessment, then make the experience useful enough to put in front of a small set of customers. A person using the page should understand what happened and what matters. You have limited time, so choose the most important slice after the tool works.



## Your task

First, use the supplied Chrome documentation to implement a `score_domain` WebMCP tool.

Then improve the prototype as a product. Decide what matters most and implement one coherent vertical slice.

Areas you may consider include:

- what an agent needs in the tool description, schema, result, and errors
- how a user understands the result of an agent-triggered lookup
- input normalisation and unsupported domains
- the next action a user should take
- accessibility and loading or error states
- how product usage could be measured
- what would need to change before using a real scoring API

These are prompts, not a checklist. You are not expected to address all of them.

## Minimum outcome

- The supplied app still builds and runs.
- The browser inspector discovers and invokes a `score_domain` tool.
- The tool accepts a domain and returns the corresponding supplied fixture data.
- A call using at least one supplied fixture produces a product outcome that is more useful than the starting prototype.
- `SOLUTION.md` explains the outcome you chose and what you intentionally did not build.



## Constraints

- Use the supplied fixtures; do not call a live scoring service.
- Treat the linked Chrome WebMCP documentation as the platform contract.
- Production-ready visual polish is not expected. Prioritise clarity, usefulness, and the user's ability to understand the result.
- You may add dependencies, but explain any material dependency.
- Do not implement every possible improvement. Prioritisation is part of the exercise.



## Submission notes

Complete `SOLUTION.md` alongside your implementation. Keep it concise—approximately 750 words or fewer.

Incomplete work is acceptable. Explain deliberate omissions, important risks, and what you would do next.

After the four-hour implementation timebox, record the 10–15 minute walkthrough described in `README.md`. The recording time is additional.