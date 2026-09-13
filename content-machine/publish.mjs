#!/usr/bin/env node
/**
 * publish.mjs — flip a draft live, or discard it.
 *
 *   node content-machine/publish.mjs --publish <slug>   # draft: true → removed, date/lastmod = today
 *   node content-machine/publish.mjs --decline <slug>   # deletes content/blog/<slug>.md (only if it is a draft)
 *   node content-machine/publish.mjs --add "Topic text | optional notes"   # append to queue.md
 *   node content-machine/publish.mjs --list             # print queue + pending drafts
 */
import { readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import {
  parseArgs, today, slugify, BLOG_DIR, parseFrontmatter, buildFrontmatter,
  listPosts, readQueue, writeQueue, setOutput,
} from "./lib.mjs";

function draftPath(slugArg) {
  const slug = slugify(slugArg);
  const path = join(BLOG_DIR, `${slug}.md`);
  if (!existsSync(path)) throw new Error(`No post at content/blog/${slug}.md`);
  const { data, body } = parseFrontmatter(readFileSync(path, "utf8"));
  return { slug, path, data, body };
}

function main() {
  const args = parseArgs();

  if (args.publish) {
    const { slug, path, data, body } = draftPath(args.publish);
    if (data.draft !== true) { console.log(`Already published: ${slug}`); setOutput("status", "already-published"); }
    else {
      const fm = { ...data, date: today(), lastmod: today(), draft: false, topic: undefined };
      if (!Array.isArray(fm.tags) || fm.tags.length === 0) throw new Error("Refusing to publish: tags are empty");
      if (!fm.summary) throw new Error("Refusing to publish: summary is empty");
      writeFileSync(path, buildFrontmatter(fm) + body.replace(/^\n+/, ""));
      console.log(`Published ${slug}`);
      setOutput("status", "published");
    }
    setOutput("slug", slug);
    setOutput("title", data.title);
    setOutput("url", `https://fitmetrics.net/blog/${slug}/`);
    return;
  }

  if (args.decline) {
    const { slug, path, data } = draftPath(args.decline);
    if (data.draft !== true) throw new Error(`Refusing to delete a published post: ${slug}`);
    unlinkSync(path);
    console.log(`Declined and deleted draft ${slug}`);
    setOutput("status", "declined");
    setOutput("slug", slug);
    setOutput("title", data.title);
    return;
  }

  if (args.add) {
    const queue = readQueue();
    const [topic, ...rest] = String(args.add).split("|");
    const t = { topic: topic.trim(), notes: rest.join("|").trim() || undefined };
    if (!t.topic) throw new Error("Empty topic");
    queue.topics.push(t);
    writeQueue(queue);
    console.log(`Queued (#${queue.topics.length}): ${t.topic}`);
    setOutput("status", "added");
    setOutput("position", queue.topics.length);
    setOutput("topic", t.topic);
    return;
  }

  if (args.list) {
    const queue = readQueue();
    const drafts = listPosts().filter((p) => p.draft);
    const lines = [];
    lines.push(`Queue (${queue.topics.length}):`);
    queue.topics.forEach((t, i) => lines.push(`${i + 1}. ${t.topic}${t.notes ? ` — ${t.notes}` : ""}`));
    lines.push("", `Drafts awaiting review (${drafts.length}):`);
    drafts.forEach((d) => lines.push(`• ${d.title} [${d.slug}]`));
    const text = lines.join("\n");
    console.log(text);
    setOutput("status", "listed");
    return;
  }

  console.log("Usage: --publish <slug> | --decline <slug> | --add \"topic | notes\" | --list");
  process.exit(2);
}

try { main(); } catch (e) { console.error(e.message); setOutput("status", "error"); setOutput("error", e.message); process.exit(1); }
