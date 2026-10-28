# CLAUDE.md

## What this project is

A live, free-tier AI voice agent demo, built as a portfolio piece. A visitor opens a web page, starts a browser voice call, and talks to an agent that can call tools mid-conversation. A small 3D scene reacts to the agent's state (listening, thinking, speaking).

Goal: show production habits (latency measurement, interruption handling, safe tool calls, cost guards), not feature count. Keep scope small and finish it.

## Hard constraints

- Free tiers only. Never add a paid service, a card-required signup, or a dependency that needs one.
- Every public call must be capped (max duration and rate limit), enforced server-side and agent-side. A stranger must not be able to burn the free quota.
- Secrets never enter git. Keep `.env.example` current with every variable name and no values.
- Free-tier limits change. Before relying on a quota in code or docs, check the vendor's current page and record the date in `docs/limits.md`.

## Architecture

- `web/`: Next.js (TypeScript, Tailwind), React Three Fiber scene, call UI, API routes. Hosted on Vercel Hobby.
- `agent/`: Python voice agent using LiveKit Agents, deployed to LiveKit Cloud. Pipeline is STT, LLM, TTS with direct provider keys.
- Database: Supabase Postgres via Prisma, for call logs and tool results.
- Flow: browser asks `web` API route for a token, joins a LiveKit room, the agent worker joins the same room.
- Optional: phone/SIP path through a Twilio trunk. Only claim it works if tested end to end.

## Working rules

- Use plan mode for any task that touches more than two files. State the plan, then implement.
- Do not rely on memory for third-party APIs, SDK names, CLI flags, or version numbers. Read the current docs first and cite the page in the commit or decision note.
- Do not add a dependency without saying why and what the alternative was.
- Small commits, one concern each, imperative messages.
- Before calling a task done: lint, typecheck, run the relevant tests, and run the thing.
- No dead code, no commented-out blocks, no TODOs without an entry in `TASKS.md`.
- Record non-obvious choices in `docs/decisions.md` (context, choice, trade-off). Keep entries short.

## Voice agent rules

- Log per-turn latency: end of user speech to first agent audio. Append to `docs/metrics.md` with date, model/provider names, and sample size.
- Interruptions must stop agent speech promptly. Test it deliberately.
- Every tool: validate arguments, set a timeout, return a structured result, and be safe to retry. Tools must not trust model-supplied IDs without checking.
- Never log raw audio or personal data. Redact before writing to the database.
- Enforce a hard call duration cap in the agent, not only in the web app.
- Keep the system prompt in one file with a short changelog comment in `docs/decisions.md`.

## Web rules

- The token route validates input, rate-limits by IP, and issues short-lived tokens scoped to one room.
- R3F: no per-frame allocations, dispose geometries and materials, cap pixel ratio, lazy-load the scene, respect `prefers-reduced-motion`, and provide a lightweight fallback for low-power devices.
- The page must work if the 3D scene fails to load. The call UI comes first.

## Supabase

- Free projects pause after inactivity. Keep a scheduled GitHub Action that hits a lightweight endpoint that performs a trivial database read.
- Use Prisma migrations. No manual schema edits in the dashboard.

## Honesty rules

- README and demo claims must match measured results in `docs/metrics.md`.
- Do not invent benchmarks, user counts, or features. If something was not tested, say so.

## Commands

Fill these in after scaffolding, and keep them accurate:

- Web dev: TBD
- Web lint and typecheck: TBD
- Agent dev: TBD
- Agent tests: TBD
- Deploy web: TBD
- Deploy agent: TBD

## Definition of done (per task)

1. Works locally and, where relevant, in the deployed environment.
2. Lint, typecheck, and tests pass.
3. Limits and metrics docs updated if the task touched them.
4. `TASKS.md` updated.
