# Changelog

## 2026-11-09 — Issue 01

- Built Chalk & Cue as an offline-first blog PWA with the Readalong visual language (Atkinson Hyperlegible, indigo base, yellow/pink/cyan gradients, pill controls).
- Published **"Chalk, Cue & the 401: A Field Guide to the Best Pool Halls in the GTA"** — seven rooms (Corner Bank, Le Spot, Shoxs, VIP, Crooked Cue, Long Shot), honourable mentions, three pool crawls, etiquette, checklist, budget and sources.
- Added install prompt, manifest shortcuts, generated icons, service worker with full offline precache, reading progress, sticky TOC with scroll spy.
- Added reader controls: font family, reading theme (night / sepia / light / contrast) and text size, all persisted.
- Added Supabase integration: `blog_posts` + `blog_reactions` schema with RLS, optional seed, Vercel serverless `/api/posts` and `/api/reactions` proxies, clap reactions with localStorage fallback.
- Created the GitHub repo and Vercel production deployment.
