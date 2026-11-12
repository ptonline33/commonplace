# Changelog

## 2026-11-12 — Simpler layout + hideable header

- Simplified the whole UI to a flat, text-first look: removed the body gradient, card borders/shadows, decorative cover art, stat strip, topics row, about strip, tag pills, chips and the big accent clap button. Post cards are now a plain ruled list; article blocks are separated by thin rules instead of boxes.
- The header is **no longer sticky** (`position: static`), so it scrolls away while reading a post.
- Added a **Hide header** control (or `H`) that removes the header entirely, plus a small floating **Show header** control (or `H` / `Esc`) to restore it. The choice is persisted with the other reader prefs.
- Adjusted TOC scroll offsets and scroll-spy thresholds for the non-fixed header.
- Bumped `sw.js` to `commonplace-v4` so the new shell is picked up immediately.

## 2026-11-12 — Issue 04

- Added **"The Quiet Download: What Your ISP Sees When a Server Does the Torrenting"** (How-to No. 04). A tech note comparing a direct BitTorrent download with a cloud box that torrents on your behalf and streams the finished file over HTTPS: what TLS hides, what the ISP still sees, the loopback hop behind a Cloudflare Tunnel, and the small serving details (URL decoding, Range support, partial-file guards) that make it work.
- Registered it in `posts/index.json`, precached it in `sw.js` (bumped `VERSION` to `commonplace-v3`), and added a matching optional row to `supabase/seed.sql`. The journal now has four posts.

## 2026-11-10 — Issues 02 & 03

- Added **"One Fare, End to End: A Slow Rider's Guide to the 501 Queen"** (City Notes No. 02) and **"How to Keep a Commonplace Book (and Why It's Worth the Trouble)"** (Essay No. 03). The journal now has three posts across three of its stated topics: a field guide, city notes and an essay/how-to.
- Registered both in `posts/index.json`, precached them in `sw.js` (bumped `VERSION` to `commonplace-v2`), and added matching optional rows to `supabase/seed.sql`.
- Gave each post a stable `issue` number used for its cover numeral (replacing the hardcoded `01`), made the homepage post count dynamic, and refreshed the stale "Issue 01" homepage copy so the site reads correctly with more than one issue.

## 2026-11-09 — Rebrand to Commonplace

- Reframed the site as a **general blog** (the pool-hall guide is just issue 01, not the theme) and renamed it **Commonplace** across the site, manifest, icons, repo (`ptonline33/commonplace`) and Vercel project.
- Live at https://commonplace-notes.vercel.app (the short `commonplace.vercel.app` was already taken); added it as a project-level production domain so every push updates it, and disabled deployment SSO protection for the public blog.
- Replaced the pool-specific 8-ball identity with a neutral "C." monogram and editorial cover art (issue numerals + rules).
- Replaced the Readalong dark-purple/tri-gradient look with a fresh **editorial light/dark theme**: warm paper or charcoal, a single oxide-red accent, Atkinson Hyperlegible for UI and Literata for display headings, thin rules and quiet cards.
- Added a system-aware light/dark appearance toggle in the header (persisted); simplified the reader tools to font choice + text size.
- Homepage now has general copy, general stats and a "What goes here" topics row instead of the pool-hall lineup.
- Kept all PWA, offline, Supabase and reader-control behaviour intact.

## 2026-11-09 — Issue 01

- Built the offline-first blog PWA and published **"Chalk, Cue & the 401: A Field Guide to the Best Pool Halls in the GTA"** — seven rooms (Corner Bank, Le Spot, Shoxs, VIP, Crooked Cue, Long Shot), honourable mentions, three pool crawls, etiquette, checklist, budget and sources.
- Added install prompt, manifest shortcuts, generated icons, service worker with full offline precache, reading progress, sticky TOC with scroll spy.
- Added reader controls: font family, reading theme and text size, all persisted.
- Added Supabase integration: `blog_posts` + `blog_reactions` schema with RLS, optional seed, Vercel serverless `/api/posts` and `/api/reactions` proxies, clap reactions with localStorage fallback.
- Created the GitHub repo and Vercel production deployment.
