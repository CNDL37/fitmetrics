# FitMetrics content machine

Drafts blog articles for **fitmetrics.net** on a schedule or on demand from Telegram, and publishes them only after you tap **Approve**. Everything lives in this repo — no database, no Vercel, no Prisma. Claude Code in VS Code can read and edit every piece of state (the queue, the drafts, the prompt).

```
content-machine/
  queue.md            ← topics, top line drafts next (edit by hand or /add from Telegram)
  house-style.md      ← the system prompt; edit to change voice/structure
  generate.mjs        ← writes content/blog/<slug>.md with draft: true
  publish.mjs         ← --publish / --decline / --add / --list
  notify.mjs          ← Telegram review card + status messages
  lib.mjs             ← shared helpers (frontmatter, queue, telegram)
  telegram-worker/    ← Cloudflare Worker: Telegram webhook → GitHub Actions
.github/workflows/
  content-machine.yml ← the scheduler / dispatcher (Mon + Thu 09:00 UTC)
  deploy.yml          ← unchanged Hugo → Cloudflare Pages deploy, now also callable
```

## How a draft flows

1. **Trigger** — the Monday/Thursday schedule, `/next` in Telegram, or *Actions → Content machine → Run workflow*.
2. **Generate** — `generate.mjs` pops the top of `queue.md`, sends `house-style.md` + the list of existing posts to DeepSeek (default) or Claude, and writes `content/blog/<slug>.md` with `draft: true`. Hugo ignores drafts, so nothing is live yet. The commit lands on `main`.
3. **Review card** — Telegram shows title, tags, a preview, and links to view/edit the file on GitHub, with **Approve / Rewrite / Decline** buttons. You can also `git pull` and edit the draft in VS Code with Claude Code first.
4. **Approve** → `publish.mjs` removes `draft: true`, sets `date`/`lastmod` to today, commits, and runs the Cloudflare deploy. Live in ~2 minutes.
   **Rewrite** → reply to the bot's prompt with an instruction; the draft is regenerated in place and a new card arrives.
   **Decline** → the draft file is deleted.

Drafts never publish themselves. The human gate is deliberate (AdSense penalized unreviewed AI content last time).

## One-time setup (~20 minutes)

### 1. GitHub secrets (repo → Settings → Secrets and variables → Actions)

| Secret | Value |
|---|---|
| `DEEPSEEK_API_KEY` | from platform.deepseek.com |
| `ANTHROPIC_API_KEY` | from console.anthropic.com (optional; used with `/claude /next` or provider=anthropic) |
| `TELEGRAM_BOT_TOKEN` | from @BotFather (`/newbot`) |
| `TELEGRAM_CHAT_ID` | your numeric chat id — message the bot once, then open `https://api.telegram.org/bot<TOKEN>/getUpdates` and read `message.chat.id` |

`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` already exist for deploy.yml.

Optional repo **variable** `LLM_PROVIDER=anthropic` flips the default to Claude.

### 2. A GitHub token for the bot

The Worker needs to trigger workflows. Create a **fine-grained personal access token** (GitHub → Settings → Developer settings → Fine-grained tokens): repository access = `CNDL37/fitmetrics` only; permissions = **Contents: Read and write** (that permission covers `repository_dispatch` and reading queue.md). Copy it for step 3.

### 3. Deploy the Telegram worker

```bash
cd content-machine/telegram-worker
npx wrangler login                       # once
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET   # any long random string, e.g. openssl rand -hex 24
npx wrangler secret put GITHUB_TOKEN              # the fine-grained PAT from step 2
npx wrangler deploy                      # prints https://fitmetrics-content-bot.<you>.workers.dev
```

### 4. Point Telegram at the worker

```bash
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -d "url=https://fitmetrics-content-bot.<you>.workers.dev" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>"
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"   # should show the url, no last_error
```

### 5. Smoke test

Send `/help`, then `/queue`, then `/next`. Within ~2 minutes a draft card should arrive and a `content: draft "…"` commit should appear on `main`. Tap **Approve** and check fitmetrics.net/blog/ a couple of minutes later.

To test without Telegram: *Actions → Content machine → Run workflow → action: draft-next*.

## Telegram commands

| Command | What it does |
|---|---|
| `/next` | draft the top queue item now |
| `/draft <topic>` | draft a specific topic now (does not touch the queue) |
| `/add <topic> \| notes` | append to the queue |
| `/queue` | show the queue and drafts awaiting review |
| `/publish <slug>` / `/decline <slug>` | same as the buttons |
| `/claude /next`, `/claude /draft …` | use Claude for this run instead of DeepSeek |

## Working on it locally / with Claude Code

```bash
export DEEPSEEK_API_KEY=…            # or ANTHROPIC_API_KEY
node content-machine/generate.mjs --topic "Grip strength and longevity"       # writes a draft
node content-machine/generate.mjs --next --dry-run                            # no API call, canned article
node content-machine/publish.mjs --list
node content-machine/publish.mjs --publish grip-strength-and-longevity
git push                                                                       # your push triggers deploy.yml
```

Editing `house-style.md` changes every future draft. Editing `queue.md` reorders what gets written next. Editing a draft `.md` before tapping Approve is the intended workflow — the bot publishes whatever is in the file at that moment.

## Social distribution (Buffer etc.)

The site already publishes RSS at `https://fitmetrics.net/blog/index.xml`. Buffer, Publer, SocialPilot and Zapier can all watch that feed and queue a post per new article, so nothing else needs to be built here. Point the tool at the feed after the first bot-published article goes live.

## Scheduling

The cron in `content-machine.yml` runs Monday and Thursday at 09:00 UTC. Change or remove the `schedule:` lines to adjust. If the queue is empty the run just sends "queue is empty" to Telegram.

## Retired: the muvari / fitmetrics-pro writer

The earlier writer in `fitmetrics-pro/apps/web/app/api/{cron,telegram,github}` (Next.js + Vercel Cron + Supabase/Prisma) is superseded by this folder and never published an article. If a Vercel deployment of it still exists, delete its cron or the project so two bots don't share the Telegram token.
