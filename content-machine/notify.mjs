#!/usr/bin/env node
/**
 * notify.mjs — Telegram messages from the GitHub Actions side.
 *
 *   node content-machine/notify.mjs --draft-card <slug>      # review card with Approve / Rewrite / Decline buttons
 *   node content-machine/notify.mjs --message "text"         # plain status message (HTML allowed)
 *
 * Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GITHUB_REPOSITORY (set by Actions), GITHUB_RUN_ID
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs, slugify, BLOG_DIR, parseFrontmatter, telegram, tgEscape } from "./lib.mjs";

const REPO = process.env.GITHUB_REPOSITORY ?? "CNDL37/fitmetrics";

function reviewKeyboard(slug) {
  return {
    inline_keyboard: [[
      { text: "✅ Approve & publish", callback_data: `approve:${slug}` },
      { text: "✏️ Rewrite", callback_data: `rewrite:${slug}` },
      { text: "❌ Decline", callback_data: `decline:${slug}` },
    ]],
  };
}

async function draftCard(slugArg) {
  const slug = slugify(slugArg);
  const { data, body } = parseFrontmatter(readFileSync(join(BLOG_DIR, `${slug}.md`), "utf8"));
  const words = body.split(/\s+/).length;
  const preview = body
    .replace(/^#+\s+[^\n]*$/gm, "")   // drop headings
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // strip links
    .replace(/\n{2,}/g, "\n\n").trim().slice(0, 700);
  const fileUrl = `https://github.com/${REPO}/blob/main/content/blog/${slug}.md`;
  const editUrl = `https://github.com/${REPO}/edit/main/content/blog/${slug}.md`;

  const text = [
    `📝 <b>Draft ready for review</b>`,
    `<b>${tgEscape(data.title)}</b>`,
    data.subtitle ? `<i>${tgEscape(data.subtitle)}</i>` : "",
    `<code>${slug}</code> · ${words} words · tags: ${tgEscape((data.tags ?? []).join(", "))}`,
    "",
    tgEscape(preview) + (body.length > 700 ? "…" : ""),
    "",
    `<a href="${fileUrl}">View full draft</a> · <a href="${editUrl}">Edit on GitHub</a>`,
    `Or pull <code>main</code> and edit <code>content/blog/${slug}.md</code> in VS Code, then tap Approve.`,
  ].filter((l) => l !== "").join("\n");

  await telegram("sendMessage", {
    text, parse_mode: "HTML", disable_web_page_preview: true,
    reply_markup: reviewKeyboard(slug),
  });
}

/**
 * Compose the post-run status message from env. Built here rather than in the
 * workflow's shell so LLM-generated values are HTML-escaped exactly once —
 * a title containing "&" or "<" made Telegram reject the whole message.
 */
function statusMessage() {
  const e = (v) => tgEscape(v ?? "");
  const { STATUS, TITLE, URL, ERR, POSITION, TOPIC, ACTION, RUN_URL } = process.env;
  switch (STATUS) {
    case "published":         return `🚀 Publishing <b>${e(TITLE)}</b>. Live in ~2 min: ${e(URL)}`;
    case "already-published": return `ℹ️ <b>${e(TITLE)}</b> was already published: ${e(URL)}`;
    case "declined":          return `🗑 Declined and deleted draft <b>${e(TITLE)}</b>.`;
    case "added":             return `✅ Queued at #${e(POSITION)}: ${e(TOPIC)}`;
    case "empty":             return `📭 Queue is empty — nothing to draft. Add topics with /add.`;
    default:
      return `❌ Content machine failed (${e(ACTION)}): ${e(ERR || "see log")}\n${e(RUN_URL)}`;
  }
}

async function main() {
  const args = parseArgs();
  if (args["draft-card"]) return draftCard(args["draft-card"]);
  if (args.status) {
    return telegram("sendMessage", {
      text: statusMessage(), parse_mode: "HTML", disable_web_page_preview: true,
    });
  }
  if (args.message) {
    const text = args.plain ? tgEscape(args.message) : String(args.message);
    return telegram("sendMessage", { text, parse_mode: "HTML", disable_web_page_preview: true });
  }
  console.log("Usage: --draft-card <slug> | --status | --message <text>");
  process.exit(2);
}

main().catch((e) => { console.error(e); process.exit(1); });
