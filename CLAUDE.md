# FitMetrics — Claude Project Guidelines

## Site overview
Hugo static site deployed to Cloudflare Pages at **fitmetrics.net** via GitHub Actions (`deploy.yml`). Push to `main` triggers an automatic build and deploy.

This repo is the **only** home of the fitmetrics.net website and its blog writer. The separate `fitmetrics-pro` / `muvari` repo is the (paused) Next.js app; its old Telegram/Vercel writer is retired — do not extend it.

## Content machine (blog writer)
Lives in `content-machine/` — see `content-machine/README.md` for setup and commands.

- `content-machine/queue.md` — topic queue; top line is drafted next. Editing this file is the normal way to plan content.
- `content-machine/house-style.md` — the writer's system prompt. Change voice/structure here, never in code.
- `node content-machine/generate.mjs --next|--topic "…"|--rewrite <slug> --instruction "…"` writes `content/blog/<slug>.md` with `draft: true`.
- `node content-machine/publish.mjs --publish <slug>` flips it live (`--decline`, `--add`, `--list` also exist).
- `.github/workflows/content-machine.yml` runs it on a schedule (Mon/Thu 09:00 UTC) and on `repository_dispatch` from the Telegram bot (`content-machine/telegram-worker/`).
- Drafts carry `draft: true` and an extra `topic:` field; Hugo does not build them. Never remove `draft: true` by hand unless you have reviewed the article — that is the publish gate.
- Scripts are zero-dependency Node 20+ ES modules. Keep them that way (no package.json needed).

## Blog post format

Every new blog post under `content/blog/` **must** use this exact frontmatter:

```yaml
---
title: "Full Article Title"
date: YYYY-MM-DD
lastmod: YYYY-MM-DD
subtitle: "One-sentence hook displayed under the title."
summary: "2–3 sentence description used as the meta description and blog card excerpt."
tags: ["tag1", "tag2", "tag3"]
---
```

### Required frontmatter rules
- `title` — full title in double quotes
- `date` — publication date (ISO 8601)
- `lastmod` — set to same as `date` on creation; update if the article is revised
- `subtitle` — short hook line shown under the title on article pages
- `summary` — used as the `<meta name="description">` fallback and blog list excerpt; make it unique per article (2–3 sentences, no boilerplate)
- `tags` — **must not be empty**; use 2–4 lowercase, hyphenated tags drawn from the vocabulary below
- Bot drafts additionally carry `draft: true` and `topic: "…"`; both are removed on publish.

### Tag vocabulary (use these; add new ones sparingly)
`metabolism`, `body-composition`, `cardio`, `zone-2`, `fitness`, `measurement`, `how-to`, `protein`, `aging`, `sarcopenia`, `ifm`, `visceral-fat`, `sleep`, `insulin-resistance`, `fiber`, `bmr`, `tdee`

(The same list is in `content-machine/lib.mjs` as `TAG_VOCAB` — keep the two in sync.)

## Writing style
- Evidence-based; cite authoritative bodies (WHO, NIH, AHA, ACSM, ADA, CDC, peer-reviewed journals).
- Written and reviewed by Matt Wick, MD (board-certified family medicine, IFM AFMCP).
- Target ~1,000–1,500 words per article.
- Use H2/H3 headings; no H1 in the body. End with a practical takeaway and a link back to the calculator (`/`).
- Include a references or further reading section where appropriate.
- Link to related existing posts with `/blog/<slug>/` paths; link "medical disclaimer" to `/medical-disclaimer/` where risk thresholds are discussed.

## Deployment
After writing or editing any content file, commit with a clear message and push to `main`. The GitHub Action handles `hugo --minify` and Cloudflare Pages deploy automatically — do not manually build or commit `public/`. Bot commits made inside Actions do not trigger `deploy.yml` by themselves; the content-machine workflow calls it explicitly after a publish.

## Distribution
RSS feed: `https://fitmetrics.net/blog/index.xml` — feed this to Buffer/Publer/Zapier for social cross-posting.

## Do not commit
- `public/` (already in `.gitignore`)
- `.DS_Store`
- PDF files in the project root
- `adsense-resubmission-checklist.md`
- Any `.env` file or API key. Secrets live only in GitHub Actions secrets and Cloudflare Worker secrets.
