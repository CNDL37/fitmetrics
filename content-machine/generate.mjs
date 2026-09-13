#!/usr/bin/env node
/**
 * generate.mjs — draft one FitMetrics article as a Hugo post with `draft: true`.
 *
 * Usage:
 *   node content-machine/generate.mjs --next                       # pop first topic from queue.md
 *   node content-machine/generate.mjs --topic "Grip strength and longevity"
 *   node content-machine/generate.mjs --rewrite <slug> --instruction "shorter, more on women over 50"
 *   options: --provider deepseek|anthropic   (default: $LLM_PROVIDER or deepseek)
 *            --dry-run                       (use a canned response; no API call)
 *
 * Env: DEEPSEEK_API_KEY and/or ANTHROPIC_API_KEY. Never runs in a user request path.
 * Output: writes content/blog/<slug>.md and prints/sets slug, title, path.
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import {
  parseArgs, today, slugify, TAG_VOCAB, BLOG_DIR, HOUSE_STYLE,
  parseFrontmatter, buildFrontmatter, listPosts, readQueue, writeQueue, setOutput,
} from "./lib.mjs";

const MODELS = {
  deepseek:  process.env.DEEPSEEK_MODEL  ?? "deepseek-chat",
  anthropic: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",
};

// ── LLM call ─────────────────────────────────────────────────────────────
async function callLLM(system, user, provider) {
  if (provider === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY not set");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODELS.anthropic, max_tokens: 6000, system, messages: [{ role: "user", content: user }] }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("");
  }
  // DeepSeek (OpenAI-compatible)
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error("DEEPSEEK_API_KEY not set");
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODELS.deepseek, max_tokens: 6000, temperature: 0.7,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
    }),
  });
  if (!res.ok) throw new Error(`DeepSeek ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Prompt ───────────────────────────────────────────────────────────────
function buildUserPrompt({ topic, notes, instruction, previous }) {
  const posts = listPosts().filter((p) => !p.draft);
  const lines = [
    `Write an article for fitmetrics.net on this topic: ${topic}`,
    notes ? `Editor's notes for this topic: ${notes}` : "",
    "",
    `Allowed tags (choose 2–4): ${TAG_VOCAB.join(", ")}`,
    "",
    "Existing articles you may link to (use the exact path shown, only where relevant):",
    ...posts.map((p) => `- ${p.title} → /blog/${p.slug}/`),
    "",
    "Do not duplicate any existing article's angle; find the distinct angle for this topic.",
  ];
  if (instruction && previous) {
    lines.push(
      "",
      "This is a REWRITE. The editor's instruction is:",
      instruction,
      "",
      "Here is the previous draft to revise (keep what works, apply the instruction, return the full article in the required output format):",
      "<<<PREVIOUS DRAFT",
      previous,
      "PREVIOUS DRAFT>>>",
    );
  }
  return lines.filter((l) => l !== undefined).join("\n");
}

// ── Response parsing ─────────────────────────────────────────────────────
export function parseResponse(text) {
  const clean = text.replace(/^```[a-z]*\n?/m, "").replace(/\n```\s*$/m, "").trim();
  const split = clean.split(/^---BODY---\s*$/m);
  if (split.length < 2) throw new Error("Model response missing ---BODY--- separator");
  const head = split[0];
  let body = split.slice(1).join("---BODY---").trim();
  const get = (k) => (head.match(new RegExp(`^${k}:\\s*(.+)$`, "m"))?.[1] ?? "").trim();

  const title = get("TITLE").replace(/^["']|["']$/g, "");
  if (!title) throw new Error("Model response missing TITLE");
  // Strip a leading H1 if the model ignored the instruction
  body = body.replace(/^#\s+[^\n]+\n+/, "");

  let tags = get("TAGS").split(",").map((t) => slugify(t)).filter(Boolean);
  const inVocab = tags.filter((t) => TAG_VOCAB.includes(t));
  tags = [...new Set([...inVocab, ...tags.filter((t) => !TAG_VOCAB.includes(t))])].slice(0, 4);
  if (tags.length === 0) {
    const hay = `${title}\n${body.slice(0, 3000)}`.toLowerCase();
    tags = TAG_VOCAB.filter((v) => hay.includes(v) || hay.includes(v.replace(/-/g, " "))).slice(0, 3);
  }
  if (tags.length === 0) tags = ["fitness"];

  return {
    title,
    slug: slugify(get("SLUG") || title),
    subtitle: get("SUBTITLE").replace(/^["']|["']$/g, ""),
    summary: get("SUMMARY").replace(/^["']|["']$/g, ""),
    tags,
    body,
    words: body.split(/\s+/).length,
  };
}

const DRY_RUN_RESPONSE = `TITLE: Resting Heart Rate: What Your Morning Number Says About Fitness
SLUG: resting-heart-rate-fitness-marker
SUBTITLE: A number you can check before getting out of bed tracks cardiovascular fitness better than most people realize.
SUMMARY: Resting heart rate is one of the simplest health metrics you own. Here is what the normal range is, why lower is usually better, and how to use the trend over months as a fitness signal.
TAGS: cardio, measurement, how-to
---BODY---
Your resting heart rate is the number of times your heart beats per minute while you are fully at rest. It is free to measure, requires no equipment beyond a clock, and tracks cardiovascular fitness surprisingly well over time.

## What counts as normal

The American Heart Association considers 60–100 beats per minute normal for adults, but well-conditioned people often sit in the 40s and 50s.

## Practical takeaway

- Measure it in the morning before getting up.
- Track the weekly average rather than single readings.
- Run your own numbers with the [FitMetrics calculator](/).

## References and further reading

- American Heart Association: All About Heart Rate (Pulse)
- Cooper Center Longitudinal Study
`;

// ── Main ─────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs();
  const provider = (args.provider ?? process.env.LLM_PROVIDER ?? "deepseek").toLowerCase();
  if (!["deepseek", "anthropic"].includes(provider)) throw new Error(`Unknown provider: ${provider}`);

  let topic = args.topic, notes, instruction = args.instruction, previous, existingPath, existingFm;
  let queue;

  if (args.rewrite) {
    const slug = slugify(args.rewrite);
    existingPath = join(BLOG_DIR, `${slug}.md`);
    if (!existsSync(existingPath)) throw new Error(`No draft found at ${existingPath}`);
    const { data, body } = parseFrontmatter(readFileSync(existingPath, "utf8"));
    existingFm = data;
    previous = body;
    topic = data.topic ?? data.title;
    if (!instruction) throw new Error("--rewrite requires --instruction");
  } else if (args.next || !topic) {
    queue = readQueue();
    if (queue.topics.length === 0) {
      console.log("Queue is empty — nothing to draft.");
      setOutput("status", "empty");
      return;
    }
    ({ topic, notes } = queue.topics[0]);
  }

  console.log(`Drafting with ${provider} (${MODELS[provider]}): ${topic}`);
  const system = readFileSync(HOUSE_STYLE, "utf8");
  const user = buildUserPrompt({ topic, notes, instruction, previous });
  const raw = args["dry-run"] ? DRY_RUN_RESPONSE : await callLLM(system, user, provider);
  const art = parseResponse(raw);

  // Keep the original slug on rewrite so Telegram buttons stay valid
  if (existingFm) art.slug = slugify(args.rewrite);
  // Avoid clobbering a published post with the same slug
  const path = join(BLOG_DIR, `${art.slug}.md`);
  if (!existingFm && existsSync(path)) {
    const { data } = parseFrontmatter(readFileSync(path, "utf8"));
    if (data.draft !== true) art.slug = `${art.slug}-${today().replace(/-/g, "")}`;
  }
  const finalPath = join(BLOG_DIR, `${art.slug}.md`);

  const fm = {
    title: art.title,
    date: existingFm?.date ?? today(),
    lastmod: today(),
    subtitle: art.subtitle,
    summary: art.summary,
    tags: art.tags,
    draft: true,
    topic,
  };
  writeFileSync(finalPath, buildFrontmatter(fm) + art.body.trim() + "\n");
  if (existingPath && existingPath !== finalPath) unlinkSync(existingPath);

  // Pop the topic off the queue only after a successful write
  if (queue) { queue.topics.shift(); writeQueue(queue); }

  console.log(`Wrote ${finalPath} (${art.words} words)`);
  setOutput("status", "drafted");
  setOutput("slug", art.slug);
  setOutput("title", art.title);
  setOutput("path", `content/blog/${art.slug}.md`);
  setOutput("words", art.words);
  setOutput("provider", `${provider}/${MODELS[provider]}`);
}

main().catch((e) => { console.error(e); setOutput("status", "error"); setOutput("error", e.message); process.exit(1); });
