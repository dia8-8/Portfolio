# Adam Dia — portfolio (Next.js + Claude agents)

A Next.js (App Router, plain JavaScript) portfolio with server-side AI agents. It replaced the earlier static HTML/CSS/JS version (last static commit: `9e00156`, see the git history).

- **Concierge chat:** Claude with tools, streamed, with an offline rule-based fallback.
- **Fit-Check:** deterministic skill matching plus a Claude-written summary.
- **Works with no API key:** the agents fall back to offline mode automatically.
- Curator filter, agent cursors that "build" the page, console log and light/dark themes.

## Run it

```bash
npm install
cp .env.example .env.local   # then add your key (optional)
npm run dev                  # http://localhost:3000
```

Without `ANTHROPIC_API_KEY` the site runs in **offline mode** (the chat header says so).

## How the live agents work

- `app/api/chat/route.js`: the Concierge. A server-side tool loop (`search_projects`, `get_skills`, `filter_projects`, `navigate`) using `@anthropic-ai/sdk`. Text and tool events stream to the browser as NDJSON; `filter_projects` / `navigate` events make the page actually filter the grid or scroll.
- `app/api/fit/route.js`: Fit-Check. The matching (`lib/analyze.js`) is deterministic and recomputed on the server; Claude only turns those verified facts into a short, honest paragraph. The pasted job description is treated as untrusted data.
- `lib/prompt.js`: system prompts. The agents may only use `lib/content.js` and are told to say "not yet" for anything not listed.
- `lib/localAgent.js`: the offline Concierge, used when there is no key, the visitor is rate limited, or the API errors.

## Editing content

Everything the page shows **and** everything the agents know lives in `lib/content.js` (projects, skills and levels, education, contact, technologies you don't have). Edit it once and both update.

## Deploy on Vercel

1. Push this folder to GitHub (as its own repo, or as the root of `Portfolio`).
2. Import the repo in Vercel (framework: Next.js, no settings needed).
3. Project Settings → Environment Variables: add `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`).
4. Redeploy.

## Cost and abuse protection (read this before going live)

A public chat box that calls a paid API can be abused. Layers in place:

- Per-IP rate limit (chat 20 / 10 min, Fit-Check 6 / 10 min; tune with `AGENT_CHAT_LIMIT`, `AGENT_FIT_LIMIT`). On serverless this is best-effort, per instance.
- Small input caps (12 messages, 1,500 chars each, 6,000 chars for a job description), `max_tokens` caps, `effort: "low"`, at most 5 tool turns per message.
- **The real safety net is a monthly spend limit on your key**: set one in the Anthropic Console (Settings → Limits) before deploying.

Model: defaults to `claude-opus-5-5`. For a cheaper public chat set `ANTHROPIC_MODEL=claude-haiku-5-5` (or `claude-sonnet-5-5`) in the environment. No code change needed.

## Privacy

In live mode, chat messages and pasted job descriptions are sent to the Claude API to produce answers. The site doesn't store them, and the UI says so. In offline mode nothing leaves the browser.
