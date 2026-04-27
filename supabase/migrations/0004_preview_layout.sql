-- glimpse. — preview_layout: the mini-mosaic that lives inside each feed tile

set search_path = public;

-- The preview layout is a second user-arranged grid (array of
-- GridCell<PostCellData>) that renders inside the uniform feed tile — so
-- each post has its own internal composition while the outer tiles stay
-- aligned. Falls back to thumbnail_url when null.
alter table public.posts
  add column if not exists preview_layout jsonb;
