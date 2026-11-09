# Changelog

## 2026-11-09 — Rebrand to Commonplace

- Reframed the site as a **general blog** (the pool-hall guide is just issue 01, not the theme) and renamed it **Commonplace** across the site, manifest, icons, repo (`ptonline33/commonplace`) and Vercel project.
- Live at https://commonplace-notes.vercel.app (the short `commonplace.vercel.app` was already taken); disabled deployment SSO protection for the public blog.
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
