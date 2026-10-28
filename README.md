# Voice Scheduling Agent

A real-time AI voice agent that answers a browser call, checks live appointment availability, and books slots by voice. It is built for a counseling appointment desk: it schedules appointments and does nothing else. The whole project runs on free tiers.

**Live:** https://livekit-voice-agent-five.vercel.app/
Open the link, allow microphone access, click **Start call**, and talk.

Calls are capped at 3 minutes and 5 calls per hour per network. Bookings are shared public data that reset regularly, so please use a made-up first name. The agent does not provide counseling or advice. If someone describes distress, it says it can't help with that here and points them to a counselor or emergency services.

## Stack

| Area | Technologies |
|---|---|
| Voice agent | LiveKit Agents (Python), deployed to LiveKit Cloud, WebRTC audio |
| Pipeline | Speech-to-text, LLM, text-to-speech, with direct provider keys and Silero voice activity detection |
| Speech | Deepgram Nova-3 (STT), Deepgram Aura-2 Thalia (TTS) |
| LLM | Groq `openai/gpt-oss-120b` with mid-call tool calling |
| Web | Next.js, TypeScript, Tailwind CSS, hosted on Vercel |
| Data | Supabase Postgres, Prisma (agent), `pg` (web read route) |
| Tooling | `uv`, LiveKit CLI |

## What it does

- **Real-time voice conversation** over WebRTC, with interruption handling so the caller can talk over the agent.
- **Mid-call tool calling.** `check_availability` and `book_slot` run against Postgres while the caller is talking.
- **Live schedule panel.** The web page shows open and booked slots and refreshes every few seconds during a call, so a booking made by voice appears on screen.
- **Relative dates.** The system prompt includes today's date and the next 14 days with weekday names, rebuilt at the start of every call, so "tomorrow" and "next Monday" are looked up rather than guessed.
- **Natural speech output.** Tools return both a machine value (`14:30`) and a spoken value ("2:30 PM"), so times and dates are read aloud the way a person would say them.

## How the tools are made safe

- **Argument validation.** Dates must be `YYYY-MM-DD`, times `HH:MM`, and past dates are rejected. Placeholder names such as "user" or "guest" are rejected, so the agent has to ask for a real name.
- **Timeouts and structured results.** Every database call has a timeout and returns a structured result (`ok`, `error`, `message`) instead of raising into the conversation.
- **No double booking.** `book_slot` claims a slot with a single conditional update (`isBooked = false` in the `WHERE` clause) inside a transaction, then checks how many rows changed. Two simultaneous callers cannot both win.
- **Validation lives in the tool.** The checks are not only in the prompt, so a model that ignores its instructions is still refused by the tool.
- **Scoped agent.** The prompt limits the agent to scheduling: no counseling, no advice, no cancelling or editing bookings.

## Cost and abuse guards

- **Agent-side call cap.** The agent ends every call after `MAX_CALL_DURATION_SECONDS` (default 180) with a spoken goodbye, regardless of what the web app does.
- **Token route.** Validates server configuration, rate-limits per IP, creates a unique room per call, and issues tokens that expire after 5 minutes and are scoped to a single room.
- **Slots route.** Read-only, rate-limited, briefly cached, and returns only `date`, `time` and `isBooked`. It never exposes booked names.
- **Secrets.** Kept in environment variables only.

## Latency

The agent logs the time from the end of the user's speech to the start of the agent's audio on every turn.

- **Pipeline:** Deepgram Nova-3 (STT), then Groq `openai/gpt-oss-120b` (LLM), then Deepgram Aura-2 Thalia (TTS)
- **Environment:** local console mode, free-tier keys
- **Sample:** 2 turns
- **Turn 1 (cold start):** 2585 ms
- **Turn 2:** 1166 ms

Raw measurements are in `docs/metrics.md`.

## Run it locally

Requirements: Python with `uv`, Node.js, a Supabase project, and accounts for LiveKit, Deepgram and Groq.

```bash
# Agent
cd agent
cp .env.example .env.local        # fill in the values
uv sync
uv run prisma generate
uv run prisma db push             # creates the tables
uv run python seed.py             # creates 30 days of slots
uv run python agent.py dev

# Web (second terminal)
cd web
cp .env.example .env.local
npm install
npm run dev
```

Deploy the agent with `lk agent deploy` from `agent/`. The web app deploys from the `web/` root directory on Vercel. The agent's environment variables are set as LiveKit secrets, because `.env.local` is not used in the cloud.

### Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | agent | LiveKit connection |
| `NEXT_PUBLIC_LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | web | Token route |
| `DEEPGRAM_API_KEY`, `GROQ_API_KEY` | agent | Speech and LLM providers |
| `DATABASE_URL` | agent, web | Pooled Postgres connection |
| `DIRECT_URL` | agent | Direct connection for Prisma migrations |
| `MAX_CALL_DURATION_SECONDS` | agent | Hard call cap, default 180 |
| `RATE_LIMIT_PER_IP_PER_HOUR` | web | Calls per IP per hour, default 5 |

## Data model

- `Slot`: date, time, `isBooked`, `bookedBy`, `bookingId`.
- `Booking`: date, time, first name.

`agent/seed.py` deletes past slots, clears bookings, and creates slots for the next 30 days. It is safe to run repeatedly.

## Project structure

```
.
├── CLAUDE.md
├── TASKS.md
├── README.md
├── agent/
│   ├── agent.py            # voice agent, tools, call cap, latency logging
│   ├── db.py               # shared Prisma client
│   ├── seed.py             # rolling 30-day slot seeding and reset
│   └── (Prisma schema)
├── web/
│   └── src/
│       ├── app/
│       │   ├── page.tsx            # call UI
│       │   └── api/
│       │       ├── token/route.ts  # room token + agent dispatch
│       │       └── slots/route.ts  # read-only schedule
│       └── components/
│           └── SlotsPanel.tsx      # live schedule panel
└── docs/
    └── metrics.md
```
