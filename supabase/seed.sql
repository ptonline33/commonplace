-- Commonplace — optional seed. Run after schema.sql.
-- The PWA already ships all four issues as posts/*.json, so the site works
-- with or without these rows. Adding them lets you edit each post's metadata
-- (title, dek, tags, published flag) from Supabase without a redeploy.

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

-- Issue 02 — City Notes
insert into public.blog_posts
  (slug, title, dek, kicker, author, "date", read_minutes, tags, accent, file, published)
values
  (
    'one-fare-end-to-end-501-queen',
    'One Fare, End to End: A Slow Rider''s Guide to the 501 Queen',
    'Twenty-odd kilometres of Queen Street from the Humber to the Beaches, seen at streetcar speed - how the line really works, three acts of window-seat city, the stops worth getting off for, and the small unwritten rules of riding the whole thing in one sitting.',
    'City Notes No. 02',
    'Andrew',
    '2026-11-10',
    9,
    array['City Notes', 'Toronto', 'Transit', 'Slow Travel']::text[],
    array['#b23a2b']::text[],
    'posts/one-fare-end-to-end-501-queen.json',
    true
  )
on conflict (slug) do update set
  title = excluded.title,
  dek = excluded.dek,
  read_minutes = excluded.read_minutes,
  tags = excluded.tags,
  published = excluded.published;

-- Issue 03 — Essay / How-to
insert into public.blog_posts
  (slug, title, dek, kicker, author, "date", read_minutes, tags, accent, file, published)
values
  (
    'how-to-keep-a-commonplace-book',
    'How to Keep a Commonplace Book (and Why It''s Worth the Trouble)',
    'The journal is named after an old, unfashionable habit: copying down anything worth returning to. What a commonplace book is, how to start one in ten minutes, and how to keep it from becoming another abandoned system.',
    'Essay No. 03',
    'Andrew',
    '2026-11-10',
    7,
    array['Essay', 'How-to', 'Writing', 'Notes']::text[],
    array['#b23a2b']::text[],
    'posts/how-to-keep-a-commonplace-book.json',
    true
  )
on conflict (slug) do update set
  title = excluded.title,
  dek = excluded.dek,
  read_minutes = excluded.read_minutes,
  tags = excluded.tags,
  published = excluded.published;

-- Issue 04 - How-to / Tech note
insert into public.blog_posts
  (slug, title, dek, kicker, author, "date", read_minutes, tags, accent, file, published)
values
  (
    'the-quiet-download',
    'The Quiet Download: What Your ISP Sees When a Server Does the Torrenting',
    'Two ways to pull the same 17 GB file across the internet - BitTorrent straight to your laptop, or a small cloud box that does the torrenting and hands you the finished file over HTTPS. The privacy difference has less to do with encryption than you''d think.',
    'How-to No. 04',
    'Andrew',
    '2026-11-12',
    8,
    array['How-to', 'Networking', 'Privacy', 'Self-hosting']::text[],
    array['#b23a2b']::text[],
    'posts/the-quiet-download.json',
    true
  )
on conflict (slug) do update set
  title = excluded.title,
  dek = excluded.dek,
  read_minutes = excluded.read_minutes,
  tags = excluded.tags,
  published = excluded.published;
