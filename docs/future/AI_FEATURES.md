# FUTURE: AI Features (not in v1)

## Scope (from spec §15)
AI Suggest in three places: query reply drafting, interaction-log summarisation, tutor feedback drafting. Assistive only — human always edits before sending.

## Architecture
- One backend endpoint: `POST /api/v1/ai/suggest { contextType, contextId }`. Server gathers context from DB (never trust client-sent context), builds prompt, calls provider, returns text.
- Provider abstraction: `services/ai/provider.js` with a single `generate(prompt)` so the model/vendor can be swapped via .env (`AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`). Spec named Gemini 1.5 Flash; verify current model availability and pricing at build time — model lineups change quickly. The Anthropic API is an equally simple drop-in.
- UI: "✨ AI Suggest" button → spinner → preview box → Use / Regenerate / Dismiss (spec §15 UI behaviour).
- Rate limiting: 10 req/min per user server-side, regardless of provider limits.
- Privacy: strip student ID numbers and phone numbers from any prompt context (POPIA).

## Integration points
- Query detail response box (admin + tutor)
- Student profile interaction tab (admin)
- Tutor detail page (admin)

## Cost considerations
- Usage profile: one admin + few tutors, dozens of calls/day max. Free tiers likely sufficient; paid usage would be well under $5/month at typical small-model pricing. Add a monthly token counter to system_config to monitor.
- Failure mode: if API unavailable, button shows "AI unavailable — write manually." Never block core workflows on AI.
