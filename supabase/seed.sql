-- Chalk & Cue — optional seed. Run after schema.sql.
-- The PWA already ships this guide as posts/best-pool-halls-gta.json, so the
-- site works with or without this row. Adding it lets you edit the post's
-- metadata (title, dek, tags, published flag) from Supabase without a redeploy.

insert into public.blog_posts
  (slug, title, dek, kicker, author, "date", read_minutes, tags, accent, file, published)
values
  (
    'best-pool-halls-gta',
    'Chalk, Cue & the 401: A Field Guide to the Best Pool Halls in the GTA',
    'Seven rooms worth the trip - from 35 Diamond tables in Scarborough to a 2 a.m. rack in Oakville - with addresses, rates, hours, transit and the unwritten rules nobody tells you before the break.',
    'Field Guide No. 01',
    'Andrew',
    '2026-11-09',
    12,
    array['Field Guide', 'GTA', 'Toronto', 'Pool Halls']::text[],
    array['#b23a2b']::text[],
    'posts/best-pool-halls-gta.json',
    true
  )
on conflict (slug) do update set
  title = excluded.title,
  dek = excluded.dek,
  read_minutes = excluded.read_minutes,
  tags = excluded.tags,
  published = excluded.published;
