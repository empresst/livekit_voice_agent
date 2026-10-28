# Metrics

## 2026-10-28 – First local console run

- Pipeline: Deepgram Nova-3 (STT) → Groq `openai/gpt-oss-120b` (LLM) → Deepgram Aura-2 Thalia (TTS)
- Environment: local console mode
- Sample size: 2 turns
- Observed end-of-user → agent-speaking latency:
  - Turn 1 (cold): 2585 ms
  - Turn 2: 1166 ms
- Notes: Free-tier keys only. Call duration cap present. No tools yet. Adaptive interruption + turn detector active.