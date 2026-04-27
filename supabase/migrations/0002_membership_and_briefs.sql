-- glimpse. — adds membership tier + Pro-only briefs

set search_path = public;

-- ---------------------------------------------------------------------------
-- Membership tier
-- ---------------------------------------------------------------------------

do $$ begin
  create type membership_tier as enum ('free', 'pro');
exception when duplicate_object then null; end $$;

alter table public.users
  add column if not exists membership_tier membership_tier not null default 'free';

-- ---------------------------------------------------------------------------
-- Briefs (Pro-only, created by startups)
-- ---------------------------------------------------------------------------

create table if not exists public.briefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  reference_image_urls text[] default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists briefs_user_idx on public.briefs (user_id);
create index if not exists briefs_active_idx on public.briefs (active);

alter table public.briefs enable row level security;

drop policy if exists "briefs_public_read" on public.briefs;
create policy "briefs_public_read" on public.briefs for select using (true);

drop policy if exists "briefs_owner_write" on public.briefs;
create policy "briefs_owner_write" on public.briefs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
