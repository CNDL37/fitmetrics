# FitMetrics — Claude Project Guidelines

## Site overview
Hugo static site deployed to Cloudflare Pages at **fitmetrics.net** via GitHub Actions (`deploy.yml`). Push to `main` triggers an automatic build and deploy.

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

### Tag vocabulary (use these; add new ones sparingly)
`metabolism`, `body-composition`, `cardio`, `zone-2`, `fitness`, `measurement`, `how-to`, `protein`, `aging`, `sarcopenia`, `ifm`, `visceral-fat`, `sleep`, `insulin-resistance`, `fiber`, `bmr`, `tdee`

## Writing style
- Evidence-based; cite authoritative bodies (WHO, NIH, AHA, ACSM, ADA, CDC, peer-reviewed journals).
- Written and reviewed by Matt Wick, MD (board-certified family medicine, IFM AFMCP).
- Target ~1,000–1,500 words per article.
- Use H2/H3 headings; end with a practical takeaway and a link back to the calculator (`/`).
- Include a references or further reading section where appropriate.

## Deployment
After writing or editing any content file, commit with a clear message and push to `main`. The GitHub Action handles `hugo --minify` and Cloudflare Pages deploy automatically — do not manually build or commit `public/`.

## Do not commit
- `public/` (already in `.gitignore`)
- `.DS_Store`
- PDF files in the project root
- `adsense-resubmission-checklist.md`
