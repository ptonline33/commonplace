-- Chalk & Cue — Supabase schema.
-- Run this once in your Supabase project's SQL Editor (or with `supabase db push`).
--
-- The browser talks to Supabase through the Vercel serverless routes in /api,
-- so the only key in play is the public anon key. Row Level Security is what
-- keeps the data safe: anon may READ published posts, READ clap counts and
-- INSERT a clap. It cannot create/edit/delete posts or delete claps.

create table if not exists public.blog_posts (
  slug          text primary key,
  title         text not null,
  dek           text not null default '',
  kicker        text not null default 'Field guide',
  author        text not null default 'Andrew',
  "date"        date not null default current_date,
  read_minutes  integer not null default 8,
  tags          text[] not null default '{}'::text[],
  accent        text[] not null default array['#ffb703', '#ff3d81']::text[],
  file          text,                 -- e.g. posts/my-post.json (bundled body)
  body          jsonb,               -- optional: full block array, no repo file needed
  published     boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

drop policy if exists "anon reads published posts" on public.blog_posts;
create policy "anon reads published posts" on public.blog_posts
  for select to anon using (published = true);

-- No insert/update/delete policy for anon: publishing is done from the
-- Supabase dashboard or with the service_role key on the server.

create table if not exists public.blog_reactions (
  id          bigint generated always as identity primary key,
  slug        text not null check (slug ~ '^[a-z0-9-]{1,80}$'),
  kind        text not null default 'clap' check (kind in ('clap')),
  created_at  timestamptz not null default now()
);

create index if not exists blog_reactions_slug_idx on public.blog_reactions (slug);

alter table public.blog_reactions enable row level security;

drop policy if exists "anon reads reactions" on public.blog_reactions;
create policy "anon reads reactions" on public.blog_reactions
  for select to anon using (true);

drop policy if exists "anon can clap" on public.blog_reactions;
create policy "anon can clap" on public.blog_reactions
  for insert to anon with check (kind = 'clap' and slug ~ '^[a-z0-9-]{1,80}$');

-- Refresh PostgREST's schema cache so the new tables are visible immediately.
notify pgrst, 'reload schema';
