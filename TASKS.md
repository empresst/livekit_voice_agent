# TASKS.md

Timeline is a guess (about two weeks). If it slips, cut Phase 4's 3D polish and Phase 6's SIP demo first. The core is Phases 1 to 3 and 5.

## Phase 0: setup (day 1)

- [ ] Create repo with `web/`, `agent/`, `docs/`. Add `CLAUDE.md`, `.env.example`, `.gitignore`.
- [ ] Create `docs/limits.md`. Check each vendor's current free-tier page (LiveKit, Deepgram, Gemini, Vercel, Supabase) and record the figures with today's date and the source URL.
- [ ] Create accounts and keys. Store only in local `.env` and the hosting dashboards.
- Done when: repo is public, `.env.example` lists every variable, `docs/limits.md` has dated entries.

## Phase 1: agent works locally (days 2 to 4)

- [ ] Scaffold the agent from LiveKit's current quickstart. Read the docs first, do not work from memory.
- [ ] Pipeline with direct Deepgram and Gemini keys (STT, LLM, TTS).
- [ ] One clean back-and-forth conversation in a local browser or console test.
- [ ] Per-turn latency logging to a local file.
- Done when: a 2-minute conversation works and `docs/metrics.md` has a first measured run with sample size.

## Phase 2: tools, interruptions, guardrails (days 4 to 6)

- [ ] Two mid-call tools (for example: check availability, book a slot). Validate args, timeouts, structured results.
- [ ] Interruption handling tested on purpose (talk over the agent, record the result).
- [ ] Agent-side hard cap on call duration.
- [ ] Supabase schema through Prisma: calls, tool results (no raw audio, no personal data).
- [ ] Basic evals: a short script of scripted scenarios and expected tool calls.
- Done when: tools succeed and fail gracefully, duration cap ends a call cleanly, evals run with one command.

## Phase 3: web app (days 6 to 8)

- [ ] Next.js app with call UI (start, mute, end, status).
- [ ] Token API route: input validation, per-IP rate limit, short-lived room-scoped token.
- [ ] Web-side call cap and clear error states (quota reached, mic denied, network lost).
- Done when: a fresh browser can start a call, hit the cap, and see sensible errors.

## Phase 4: 3D scene (days 8 to 10)

- [ ] React Three Fiber scene that reflects agent state (listening, thinking, speaking) and audio level.
- [ ] Performance pass: lazy-load, pixel ratio cap, disposal, reduced-motion support, fallback UI.
- [ ] Test on a low-end phone or throttled device and note results.
- Done when: the call works with the scene failed or disabled, and the scene holds a smooth frame rate on a mid-range phone.

## Phase 5: deploy (days 10 to 12)

- [ ] Deploy the agent to LiveKit Cloud. Note cold-start behavior in `docs/metrics.md`.
- [ ] Deploy `web/` to Vercel. Set environment variables in the dashboard.
- [ ] Scheduled GitHub Action keep-alive for Supabase, with a lightweight health endpoint.
- [ ] Test from a clean device on a different network, including after a quiet period.
- Done when: the public URL works end to end, and a cold agent start is documented.

## Phase 6: packaging (days 12 to 14)

- [ ] README: what it is, live link, architecture diagram, measured latency, trade-offs, what was not tested.
- [ ] `docs/decisions.md` cleaned up and linked from the README.
- [ ] 60 to 90 second demo video (screen and voice, in English).
- [ ] Optional: SIP path through a Twilio trunk, shown in the video only if tested.
- [ ] Repo polish: description, topics, pinned on the profile, fix the old voice-agent repo README run command.
- Done when: someone with no context can open the link and the README and understand what you built.

## Phase 7: application and live-task prep

- [ ] Write the 3 to 5 line note yourself: the most complex thing you built with coding agents, what you decided, what broke. Describe only what you actually did.
- [ ] Practice one timed build with screen recording while explaining your approach in English.
- [ ] Try the same small task with Claude Code and one other agent so you can say which fits which job.
- [ ] Submit with CV, live URL, GitHub link, and demo video.
