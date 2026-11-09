/* Commonplace — public client configuration.
 *
 * The Supabase URL and anon (publishable) key are PUBLIC by design: they ship
 * to every browser. Security lives in Row Level Security policies, not in
 * hiding this key. See supabase/schema.sql — anon can only read published
 * posts and insert a clap; it cannot edit or delete anything.
 *
 * In production the values come from Vercel environment variables via the
 * serverless /api routes. The values below are the same public values, kept
 * here so a purely static preview (e.g. `python3 -m http.server`) still works.
 */
window.COMMONPLACE_CONFIG = {
  site: "Commonplace",
  supabaseUrl: "https://zwwpxslfpjyykpadxiuc.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3d3B4c2xmcGp5eWtwYWR4aXVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyOTkxMDAsImV4cCI6MjEwMzg3NTEwMH0.fOROcr2qJ1WWOf2d_M9UosTqWqOxC9tgOaZuFrCYtU4",
  postsTable: "blog_posts",
  reactionsTable: "blog_reactions",
  apiBase: "/api"
};
