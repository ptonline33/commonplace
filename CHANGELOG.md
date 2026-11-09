# Changelog

## 2026-11-09 — Issue 01

- Built Chalk & Cue as an offline-first blog PWA with the Readalong visual language (Atkinson Hyperlegible, indigo base, yellow/pink/cyan gradients, pill controls).
- Published **"Chalk, Cue & the 401: A Field Guide to the Best Pool Halls in the GTA"** — seven rooms (Corner Bank, Le Spot, Shoxs, VIP, Crooked Cue, Long Shot), honourable mentions, three pool crawls, etiquette, checklist, budget and sources.
- Added install prompt, manifest shortcuts, generated icons, service worker with full offline precache, reading progress, sticky TOC with scroll spy.
- Added reader controls: font family, reading theme (night / sepia / light / contrast) and text size, all persisted.
- Added Supabase integration: `blog_posts` + `blog_reactions` schema with RLS, optional seed, Vercel serverless `/api/posts` and `/api/reactions` proxies, clap reactions with localStorage fallback.
- Added shareable section deep links (`#/post/<slug>/<section-id>`).
- Created the GitHub repo (`ptonline33/chalk-and-cue`, branch `main`) and linked it to the Vercel project for automatic production deploys: https://chalk-and-cue.vercel.app
- Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` Vercel environment variables; serverless routes degrade gracefully until `supabase/schema.sql` is run in the Supabase SQL Editor.
