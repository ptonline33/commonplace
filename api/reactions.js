/* Vercel serverless route: /api/reactions
 *   GET  ?slug=...  -> { ok, count }  (clap count for a post)
 *   POST { slug }   -> { ok, count }  (records one clap)
 * Credentials stay server-side in Vercel environment variables. If Supabase
 * is not configured, the route reports { ok:false } and the PWA quietly keeps
 * claps in localStorage until a connection is available. */
"use strict";

const SLUG = /^[a-z0-9-]{1,80}$/;

function config() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ||
              process.env.SUPABASE_ANON_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

function headers(key, extra) {
  return Object.assign({ apikey: key, Authorization: "Bearer " + key }, extra || {});
}

async function count(cfg, slug) {
  const r = await fetch(
    cfg.url + "/rest/v1/blog_reactions?select=id&slug=eq." + encodeURIComponent(slug),
    { headers: headers(cfg.key) }
  );
  if (!r.ok) throw new Error("count failed");
  const rows = await r.json();
  return Array.isArray(rows) ? rows.length : 0;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const cfg = config();
  const slug = String((req.query && req.query.slug) || (req.body && req.body.slug) || "");

  if (req.method === "GET") {
    if (!cfg || !SLUG.test(slug)) return res.status(200).json({ ok: false, count: 0 });
    try {
      return res.status(200).json({ ok: true, count: await count(cfg, slug) });
    } catch (_) {
      return res.status(200).json({ ok: false, count: 0 });
    }
  }

  if (req.method === "POST") {
    if (!cfg || !SLUG.test(slug)) return res.status(200).json({ ok: false, count: 0 });
    try {
      const r = await fetch(cfg.url + "/rest/v1/blog_reactions", {
        method: "POST",
        headers: headers(cfg.key, {
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        }),
        body: JSON.stringify({ slug, kind: "clap" })
      });
      if (!r.ok) return res.status(200).json({ ok: false, count: 0 });
      return res.status(200).json({ ok: true, count: await count(cfg, slug) });
    } catch (_) {
      return res.status(200).json({ ok: false, count: 0 });
    }
  }

  return res.status(405).json({ ok: false, count: 0 });
};
