/* Vercel serverless route: GET /api/posts
 * Returns published posts from Supabase. The browser always keeps its bundled
 * posts/index.json as an offline source of truth, so an unconfigured or
 * unreachable backend simply returns an empty list and nothing breaks. */
"use strict";

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  if (req.method !== "GET") return res.status(405).json({ ok: false, posts: [] });

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ||
              process.env.SUPABASE_ANON_KEY ||
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return res.status(200).json({ ok: false, source: "unconfigured", posts: [] });

  try {
    const endpoint = url.replace(/\/+$/, "") +
      "/rest/v1/blog_posts?select=*&published=eq.true&order=date.desc";
    const r = await fetch(endpoint, {
      headers: { apikey: key, Authorization: "Bearer " + key }
    });
    if (!r.ok) return res.status(200).json({ ok: false, source: "supabase", posts: [] });

    const rows = await r.json();
    const posts = (Array.isArray(rows) ? rows : []).map((row) => ({
      slug: row.slug,
      title: row.title,
      dek: row.dek || "",
      kicker: row.kicker || "Field guide",
      author: row.author || "Andrew",
      date: row.date,
      readMinutes: row.read_minutes || 8,
      tags: row.tags || [],
      accent: row.accent || ["#b23a2b"],
      file: row.file || undefined,
      body: row.body || undefined,
      published: true
    }));
    return res.status(200).json({ ok: true, source: "supabase", posts });
  } catch (_) {
    return res.status(200).json({ ok: false, source: "error", posts: [] });
  }
};
