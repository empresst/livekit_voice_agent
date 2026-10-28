# Free-tier limits (checked 2026-10-28)

All figures taken from official vendor pages on this date. Re-check before relying on them.

## LiveKit Cloud – Build plan (free)
- Agent session minutes: **1,000 / month** (hard limit)
- Concurrent agent sessions: **5**
- WebRTC participant minutes: ~5,000 included
- Agent deployments: 1
- No credit card required
- Source: https://docs.livekit.io/home/cloud/quotas-and-limits/ and pricing page

## Deepgram (Pay As You Go)
- New accounts: **$200 free credit** (no card, no expiry)
- STT (Nova-3 streaming, promotional): ~$0.0048 / min
- TTS (Aura-2): $0.030 / 1k characters
- Voice Agent API Standard: $0.075 / min (we will use separate STT + TTS + our own LLM instead)
- Source: https://deepgram.com/pricing

## Google Gemini API (Free tier)
- Flash models (e.g. Gemini 3.8 / 3.6 Flash): roughly **5 RPM, 20 requests/day** per project
- Flash-Lite models: higher daily limits (~500 RPD)
- Limits are per project (not per key) and shown in Google AI Studio
- No credit card required for free tier
- Source: Google AI Studio rate-limit dashboard + https://ai.google.dev/gemini-api/docs/rate-limits

## Vercel – Hobby plan
- Fast Data Transfer: **100 GB / month**
- Function invocations: **1,000,000 / month**
- CDN requests: 1,000,000 / month
- Deployments: 100 / day
- Non-commercial personal use only
- Source: https://vercel.com/docs/plans/hobby

## Supabase – Free plan
- Active projects: **2**
- Database size: **500 MB**
- File storage: **1 GB**
- Egress: **5 GB / month**
- Projects pause after **1 week of inactivity** (we will add a keep-alive GitHub Action)
- Source: https://supabase.com/pricing

## Notes for this project
- Hard call duration cap (agent + web) is mandatory so strangers cannot burn the free quota.
- Per-IP rate limit on the token route is mandatory.
- We will log measured latency in `docs/metrics.md` and never invent numbers.