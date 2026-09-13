/**
 * Shared helpers for the FitMetrics content machine.
 * Zero dependencies — Node 20+ only (uses built-in fetch).
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const BLOG_DIR = join(ROOT, "content", "blog");
export const QUEUE_FILE = join(ROOT, "content-machine", "queue.md");
export const HOUSE_STYLE = join(ROOT, "content-machine", "house-style.md");
export const SITE_URL = "https://fitmetrics.net";

export const TAG_VOCAB = [
  "metabolism", "body-composition", "cardio", "zone-2", "fitness",
  "measurement", "how-to", "protein", "aging", "sarcopenia", "ifm",
  "visceral-fat", "sleep", "insulin-resistance", "fiber", "bmr", "tdee",
];

// ── CLI args ────────────────────────────────────────────────────────────
export function parseArgs(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function slugify(s) {
  return String(s).toLowerCase().trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-").slice(0, 8).join("-");
}

export function yamlQuote(s) {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ").trim()}"`;
}

// ── Frontmatter ─────────────────────────────────────────────────────────
/** Minimal frontmatter reader — enough for the fields this site uses. */
export function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!kv) continue;
    let [, k, v] = kv;
    v = v.trim();
    if (v.startsWith("[")) {
      data[k] = v.slice(1, -1).split(",").map((t) => t.trim().replace(/^"|"$/g, "")).filter(Boolean);
    } else if (v.startsWith('"') && v.endsWith('"')) {
      data[k] = v.slice(1, -1).replace(/\\"/g, '"');
    } else if (v === "true" || v === "false") {
      data[k] = v === "true";
    } else data[k] = v;
  }
  return { data, body: m[2] };
}

export function buildFrontmatter(fm) {
  // yamlQuote(undefined) would emit the literal string "undefined" into the
  // frontmatter, so fall back to empty rather than poisoning the meta tags.
  const lines = [
    "---",
    `title: ${yamlQuote(fm.title ?? "")}`,
    `date: ${fm.date}`,
    `lastmod: ${fm.lastmod}`,
    `subtitle: ${yamlQuote(fm.subtitle ?? "")}`,
    `summary: ${yamlQuote(fm.summary ?? "")}`,
    `tags: [${fm.tags.map(yamlQuote).join(", ")}]`,
  ];
  if (fm.draft) lines.push("draft: true");
  if (fm.topic) lines.push(`topic: ${yamlQuote(fm.topic)}`);
  lines.push("---", "", "");
  return lines.join("\n");
}

/** Returns [{slug, title, draft}] for every post in content/blog. */
export function listPosts() {
  if (!existsSync(BLOG_DIR)) return [];
  return readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md") && f !== "_index.md")
    .map((f) => {
      const { data } = parseFrontmatter(readFileSync(join(BLOG_DIR, f), "utf8"));
      return { slug: f.replace(/\.md$/, ""), title: data.title ?? f, draft: data.draft === true };
    });
}

// ── Queue (content-machine/queue.md) ─────────────────────────────────────
/**
 * Queue format: a Markdown file. Each line beginning with "- " is one topic.
 * Optional notes after " | ". Lines starting with "#" or blank are ignored.
 *   - Resting heart rate as a health marker | mention age norms, athletes
 */
export function readQueue() {
  if (!existsSync(QUEUE_FILE)) return { header: [], topics: [], footer: [] };
  const lines = readFileSync(QUEUE_FILE, "utf8").split(/\r?\n/);
  const isTopic = (l) => /^-\s+(.+)$/.test(l);
  const first = lines.findIndex(isTopic);
  const last = lines.findLastIndex(isTopic);
  if (first === -1) return { header: lines, topics: [], footer: [] };

  const topics = lines.slice(first, last + 1).filter(isTopic).map((line) => {
    const [topic, ...rest] = line.match(/^-\s+(.+)$/)[1].split("|");
    return { topic: topic.trim(), notes: rest.join("|").trim() || undefined, raw: line };
  });
  // Anything after the last topic is preserved rather than silently dropped —
  // notes at the bottom of queue.md used to vanish on the next write.
  const footer = lines.slice(last + 1).filter((l) => l.trim() !== "");
  return { header: lines.slice(0, first), topics, footer };
}

export function writeQueue({ header, topics, footer = [] }) {
  const body = topics.map((t) => t.raw ?? `- ${t.topic}${t.notes ? ` | ${t.notes}` : ""}`);
  const head = header.join("\n").replace(/\n+$/, "");
  const tail = footer.length ? `\n${footer.join("\n")}\n` : "";
  writeFileSync(QUEUE_FILE, `${head}\n\n${body.join("\n")}\n${tail}`);
}

// ── Telegram ────────────────────────────────────────────────────────────
export async function telegram(method, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) { console.warn("TELEGRAM_BOT_TOKEN not set — skipping Telegram", method); return null; }
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, ...body }),
  });
  const data = await res.json();
  if (!data.ok) console.warn("Telegram error:", JSON.stringify(data));
  return data;
}

/** Escape for Telegram HTML parse_mode. */
export function tgEscape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ── GitHub Actions output ───────────────────────────────────────────────
export function setOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  const line = `${name}=${String(value).replace(/\r?\n/g, " ")}\n`;
  if (file) writeFileSync(file, line, { flag: "a" });
  else process.stdout.write(`[output] ${line}`);
}
