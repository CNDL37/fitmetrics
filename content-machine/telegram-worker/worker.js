/**
 * FitMetrics content bot — Telegram webhook → GitHub Actions.
 *
 * A tiny, stateless Cloudflare Worker. Every command becomes a `repository_dispatch`
 * event on the fitmetrics repo; the content-machine workflow does the real work and
 * replies in Telegram itself. The only thing the Worker answers directly is /queue
 * and /help (it reads queue.md straight from GitHub).
 *
 * Commands
 *   /next                    draft the next topic in the queue now
 *   /draft <topic>           draft this topic now (skips the queue)
 *   /add <topic> [| notes]   append a topic to the queue
 *   /queue                   show the queue and drafts awaiting review
 *   /publish <slug>          publish a draft by slug (same as the Approve button)
 *   /claude … /deepseek …    prefix any /next or /draft with a provider override
 *   /help
 * Buttons on draft cards: Approve & publish · Rewrite (reply with instruction) · Decline
 *
 * Secrets (wrangler secret put …): TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET,
 *   TELEGRAM_CHAT_ID, GITHUB_TOKEN (fine-grained PAT: Contents read/write on the repo)
 * Vars (wrangler.toml): GITHUB_REPO = "CNDL37/fitmetrics"
 */

export default {
  async fetch(request, env) {
    if (request.method !== "POST") return new Response("fitmetrics content bot", { status: 200 });

    // Telegram sends this header when the webhook was registered with secret_token
    if (request.headers.get("x-telegram-bot-api-secret-token") !== env.TELEGRAM_WEBHOOK_SECRET) {
      return new Response("forbidden", { status: 403 });
    }

    let update;
    try { update = await request.json(); } catch { return json({ ok: true }); }

    const chatId = String(update.message?.chat?.id ?? update.callback_query?.message?.chat?.id ?? "");
    if (chatId !== String(env.TELEGRAM_CHAT_ID)) return json({ ok: true }); // ignore strangers silently

    const tg = telegramClient(env);
    const dispatch = (payload) => githubDispatch(env, payload);

    try {
      if (update.callback_query) {
        await handleCallback(update.callback_query, { tg, dispatch, env });
      } else if (update.message?.text) {
        await handleMessage(update.message, { tg, dispatch, env });
      }
    } catch (e) {
      await tg.send(`❌ Bot error: ${escape(e.message)}`);
    }
    return json({ ok: true });
  },
};

// ── Handlers ─────────────────────────────────────────────────────────────

async function handleMessage(message, { tg, dispatch, env }) {
  let text = message.text.trim();

  // Rewrite instruction: a reply to our force-reply prompt, which embeds the slug in [brackets]
  const replyText = message.reply_to_message?.text ?? "";
  const replySlug = replyText.match(/\[([a-z0-9-]+)\]/)?.[1];
  if (replySlug && !text.startsWith("/")) {
    await dispatch({ action: "rewrite", slug: replySlug, instruction: text });
    await tg.send(`✏️ Rewriting <code>${replySlug}</code>: <i>${escape(text)}</i>\nNew draft card in ~1–2 min.`);
    return;
  }

  // Provider override prefix: "/claude /next" or "/deepseek /draft topic"
  let provider;
  const pm = text.match(/^\/(claude|anthropic|deepseek)\s+(.*)$/is);
  if (pm) { provider = pm[1] === "claude" ? "anthropic" : pm[1]; text = pm[2].trim(); }

  const [cmd, ...rest] = text.split(/\s+/);
  const arg = rest.join(" ").trim();
  const c = cmd.toLowerCase().replace(/@\w+$/, ""); // strip @botname

  switch (c) {
    case "/next":
    case "/draft": {
      if (c === "/draft" && arg) {
        await dispatch({ action: "draft", topic: arg, provider });
        await tg.send(`🧠 Drafting now${provider ? ` with ${provider}` : ""}: <i>${escape(arg)}</i>\nReview card in ~1–2 min.`);
      } else {
        await dispatch({ action: "draft-next", provider });
        await tg.send(`🧠 Drafting the next queued topic${provider ? ` with ${provider}` : ""}. Review card in ~1–2 min.`);
      }
      return;
    }
    case "/add": {
      if (!arg) { await tg.send("Usage: <code>/add Topic text | optional notes for the writer</code>"); return; }
      await dispatch({ action: "add", topic: arg });
      await tg.send(`➕ Adding to queue: <i>${escape(arg)}</i>`);
      return;
    }
    case "/queue":
    case "/list": {
      await tg.send(await renderQueue(env));
      return;
    }
    case "/publish": {
      if (!arg) { await tg.send("Usage: <code>/publish slug-of-draft</code>"); return; }
      await dispatch({ action: "publish", slug: arg });
      await tg.send(`🚀 Publishing <code>${escape(arg)}</code>…`);
      return;
    }
    case "/decline": {
      if (!arg) { await tg.send("Usage: <code>/decline slug-of-draft</code>"); return; }
      await dispatch({ action: "decline", slug: arg });
      await tg.send(`🗑 Declining <code>${escape(arg)}</code>…`);
      return;
    }
    case "/help":
    case "/start":
      await tg.send(HELP);
      return;
    default:
      if (text.startsWith("/")) await tg.send(`Unknown command. ${HELP}`);
  }
}

async function handleCallback(cb, { tg, dispatch }) {
  const [action, slug] = (cb.data ?? "").split(":");
  if (!slug) { await tg.answer(cb.id); return; }

  if (action === "approve") {
    await tg.answer(cb.id, "Publishing…");
    await dispatch({ action: "publish", slug });
    await tg.send(`🚀 Approved <code>${slug}</code>. Publishing + deploying now (~2 min).`);
  } else if (action === "decline") {
    await tg.answer(cb.id, "Declined");
    await dispatch({ action: "decline", slug });
  } else if (action === "rewrite") {
    await tg.answer(cb.id);
    await tg.send(
      `✏️ How should I rewrite [${slug}]?\nReply to THIS message with your instruction.`,
      { reply_markup: { force_reply: true, selective: true } },
    );
  } else {
    await tg.answer(cb.id);
  }
}

// ── Queue rendering (reads the repo directly) ───────────────────────────

async function renderQueue(env) {
  const [queueMd, blogFiles] = await Promise.all([
    githubRaw(env, "content-machine/queue.md"),
    githubList(env, "content/blog"),
  ]);
  const topics = queueMd.split(/\r?\n/).filter((l) => /^-\s+/.test(l)).map((l) => l.replace(/^-\s+/, "").split("|")[0].trim());

  // Drafts = posts whose frontmatter has draft: true. Fetched in parallel —
  // serial awaits here meant one request per post, and Telegram gives the
  // webhook a short budget to reply in.
  const posts = blogFiles.filter((f) => f.name.endsWith(".md") && f.name !== "_index.md");
  const heads = await Promise.all(posts.map((f) => githubRaw(env, `content/blog/${f.name}`, 1500)));
  const drafts = posts
    .map((f, i) => ({ f, head: heads[i] }))
    .filter(({ head }) => /^draft:\s*true/m.test(head))
    .map(({ f, head }) => {
      const title = head.match(/^title:\s*"(.*)"/m)?.[1] ?? f.name;
      return `• ${escape(title)} <code>${f.name.replace(/\.md$/, "")}</code>`;
    });

  const lines = [`📋 <b>Queue (${topics.length})</b>`];
  topics.forEach((t, i) => lines.push(`${i + 1}. ${escape(t)}`));
  if (topics.length === 0) lines.push("<i>empty — /add a topic</i>");
  lines.push("", `📝 <b>Drafts awaiting review (${drafts.length})</b>`);
  lines.push(...(drafts.length ? drafts : ["<i>none</i>"]));
  lines.push("", "Send /next to draft the top item.");
  return lines.join("\n");
}

// ── GitHub ───────────────────────────────────────────────────────────────

function ghHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "fitmetrics-content-bot",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function githubDispatch(env, client_payload) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
    method: "POST",
    headers: { ...ghHeaders(env), "Content-Type": "application/json" },
    body: JSON.stringify({ event_type: "content-machine", client_payload }),
  });
  if (res.status !== 204) throw new Error(`GitHub dispatch failed (${res.status}): ${await res.text()}`);
}

async function githubRaw(env, path, maxBytes) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}?ref=main`, {
    headers: { ...ghHeaders(env), Accept: "application/vnd.github.raw+json" },
  });
  if (!res.ok) throw new Error(`GitHub read failed for ${path} (${res.status})`);
  const text = await res.text();
  return maxBytes ? text.slice(0, maxBytes) : text;
}

async function githubList(env, path) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/contents/${path}?ref=main`, { headers: ghHeaders(env) });
  if (!res.ok) throw new Error(`GitHub list failed for ${path} (${res.status})`);
  return res.json();
}

// ── Telegram ─────────────────────────────────────────────────────────────

function telegramClient(env) {
  const base = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`;
  const call = async (method, body) => {
    const res = await fetch(`${base}/${method}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    return res.json();
  };
  return {
    send: (text, extra = {}) => call("sendMessage", {
      chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra,
    }),
    answer: (id, text) => call("answerCallbackQuery", { callback_query_id: id, text }),
  };
}

function escape(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function json(obj) {
  return new Response(JSON.stringify(obj), { headers: { "content-type": "application/json" } });
}

const HELP = [
  "<b>FitMetrics content bot</b>",
  "",
  "<code>/next</code> — draft the next topic in the queue",
  "<code>/draft &lt;topic&gt;</code> — draft a specific topic now",
  "<code>/add &lt;topic&gt; | notes</code> — add a topic to the queue",
  "<code>/queue</code> — show queue + drafts awaiting review",
  "<code>/publish &lt;slug&gt;</code> · <code>/decline &lt;slug&gt;</code>",
  "<code>/claude /next</code> — use Claude instead of DeepSeek for this run",
  "",
  "Draft cards have Approve / Rewrite / Decline buttons. Approve publishes to fitmetrics.net.",
].join("\n");
