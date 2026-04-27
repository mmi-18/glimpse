-- glimpse. — authoring flow: saved cell layouts for user-editable grids

set search_path = public;

-- Save the user-arranged grid layout (an array of GridCell<PostCellData>) on
-- each post. When null, the Post Detail renderer falls back to the default
-- layout built by buildPostCells().
alter table public.posts
  add column if not exists cell_layout jsonb;

-- Portfolio grid layout saved on the creator profile. Same fallback pattern.
alter table public.creator_profiles
  add column if not exists portfolio_layout jsonb;

-- About-section grid layout. Separate so users can rearrange each half
-- independently.
alter table public.creator_profiles
  add column if not exists about_layout jsonb;
