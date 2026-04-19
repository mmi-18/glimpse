-- glimpse. — initial schema
-- Run this file in the Supabase SQL Editor. Idempotent where practical.

set search_path = public;

-- ============================================================================
-- ENUMS
-- ============================================================================

do $$ begin create type user_type as enum ('creator', 'startup'); exception when duplicate_object then null; end $$;
do $$ begin create type discipline_type as enum ('video', 'photo', 'both'); exception when duplicate_object then null; end $$;
do $$ begin create type creative_discipline_type as enum ('videographer', 'photographer', 'both', 'motion_designer'); exception when duplicate_object then null; end $$;
do $$ begin create type availability_type as enum ('immediately', 'within_1_week', 'within_1_month', 'limited'); exception when duplicate_object then null; end $$;
do $$ begin create type turnaround_type as enum ('1_3_days', '1_week', '2_weeks', '1_month', 'flexible'); exception when duplicate_object then null; end $$;
do $$ begin create type travel_type as enum ('local_only', 'regional', 'national', 'international', 'worldwide'); exception when duplicate_object then null; end $$;
do $$ begin create type licensing_type as enum ('full_buyout', 'limited_usage', 'negotiable'); exception when duplicate_object then null; end $$;
do $$ begin create type company_stage_type as enum ('pre_seed', 'seed', 'series_a', 'series_b_plus', 'established'); exception when duplicate_object then null; end $$;
do $$ begin create type brand_guidelines_type as enum ('strict_brand_guide', 'loose_guidelines', 'no_guidelines', 'open_to_suggestions'); exception when duplicate_object then null; end $$;
do $$ begin create type usage_rights_type as enum ('full_buyout', 'limited_platform', 'time_limited', 'negotiable'); exception when duplicate_object then null; end $$;
do $$ begin create type timeline_pattern_type as enum ('urgent_1_week', 'standard_2_4_weeks', 'flexible', 'ongoing'); exception when duplicate_object then null; end $$;
do $$ begin create type post_type_enum as enum ('portfolio_piece', 'job_listing'); exception when duplicate_object then null; end $$;
do $$ begin create type format_type as enum ('vertical', 'horizontal', 'square'); exception when duplicate_object then null; end $$;

-- ============================================================================
-- USERS
-- ============================================================================

create table if not exists public.users (
  id uuid primary key,
  email text unique not null,
  user_type user_type not null,
  display_name text,
  avatar_url text,
  bio text,
  location_city text,
  location_country text,
  languages text[] default '{}',
  cultural_markets text[] default '{}',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- CREATOR PROFILES
-- ============================================================================

create table if not exists public.creator_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,

  -- Core
  discipline discipline_type,
  content_categories text[] default '{}',
  content_style_tags text[] default '{}',
  deliverable_types text[] default '{}',
  rate_min integer,
  rate_max integer,
  availability availability_type,
  portfolio_urls text[] default '{}',

  -- Important
  sub_specializations text[] default '{}',
  industry_experience text[] default '{}',
  minimum_acceptable_budget integer,
  typical_turnaround turnaround_type,
  travel_willingness travel_type,
  preferred_project_types text[] default '{}',
  unwanted_work_types text[] default '{}',
  usage_licensing_preference licensing_type,
  production_capabilities text[] default '{}',
  social_handles jsonb default '{}'::jsonb,
  creative_discipline creative_discipline_type,

  -- Later
  equipment text[] default '{}',
  audience_size integer,
  past_brand_collaborations text,
  creative_philosophy text,
  inspiration_creators text[] default '{}',
  showreel_url text,

  -- Style (1–10)
  style_production_value smallint,
  style_pacing smallint,
  style_focus smallint,
  style_framing smallint,
  style_staging smallint,
  style_color smallint,
  style_sound smallint,

  -- Derived / cached
  avg_rating numeric(3,2),
  review_count integer not null default 0,

  constraint creator_style_production_value_range check (style_production_value between 1 and 10),
  constraint creator_style_pacing_range check (style_pacing between 1 and 10),
  constraint creator_style_focus_range check (style_focus between 1 and 10),
  constraint creator_style_framing_range check (style_framing between 1 and 10),
  constraint creator_style_staging_range check (style_staging between 1 and 10),
  constraint creator_style_color_range check (style_color between 1 and 10),
  constraint creator_style_sound_range check (style_sound between 1 and 10)
);

-- ============================================================================
-- STARTUP PROFILES
-- ============================================================================

create table if not exists public.startup_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,

  -- Core
  company_name text,
  industry text,
  location_market text[] default '{}',
  contact_person text,
  contact_role text,
  contact_email text,
  typical_budget_range_min integer,
  typical_budget_range_max integer,
  project_goal text[] default '{}',
  desired_look_feeling text[] default '{}',
  deliverables_needed text[] default '{}',
  quantity_volume integer,
  deadline date,
  budget_for_project integer,
  content_usage_platforms text[] default '{}',

  -- Important
  company_stage company_stage_type,
  website_url text,
  company_description text,
  content_categories_hired text[] default '{}',
  brand_look_guidelines brand_guidelines_type,
  language text[] default '{}',
  target_audience text[] default '{}',
  qualities_in_creator text[] default '{}',
  content_communication_goal text[] default '{}',
  success_criteria text,
  usage_rights_scope usage_rights_type,
  location_production_constraints text[] default '{}',
  equipment_needed text[] default '{}',

  -- Later
  brand_values text[] default '{}',
  past_creator_collaborations text,
  typical_timeline_pattern timeline_pattern_type,
  brand_guidelines_url text,
  reference_content_urls text[] default '{}',
  brand_description text,

  -- Style (1–10)
  style_production_value smallint,
  style_pacing smallint,
  style_focus smallint,
  style_framing smallint,
  style_staging smallint,
  style_color smallint,
  style_sound smallint,

  constraint startup_style_production_value_range check (style_production_value between 1 and 10),
  constraint startup_style_pacing_range check (style_pacing between 1 and 10),
  constraint startup_style_focus_range check (style_focus between 1 and 10),
  constraint startup_style_framing_range check (style_framing between 1 and 10),
  constraint startup_style_staging_range check (style_staging between 1 and 10),
  constraint startup_style_color_range check (style_color between 1 and 10),
  constraint startup_style_sound_range check (style_sound between 1 and 10)
);

-- ============================================================================
-- POSTS
-- ============================================================================

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  post_type post_type_enum not null,
  title text,
  description text,
  media_urls text[] default '{}',
  thumbnail_url text,

  content_type text,
  industry text,
  format format_type,
  duration_seconds integer,
  equipment_used text[] default '{}',

  style_production_value smallint,
  style_pacing smallint,
  style_focus smallint,
  style_framing smallint,
  style_staging smallint,
  style_color smallint,
  style_sound smallint,

  likes_count integer not null default 0,
  views_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists posts_post_type_idx on public.posts (post_type);
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- ============================================================================
-- CONVERSATIONS & MESSAGES
-- ============================================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references public.users(id) on delete cascade,
  participant_b uuid not null references public.users(id) on delete cascade,
  match_score double precision,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  constraint conversations_distinct_participants check (participant_a <> participant_b),
  constraint conversations_unique_pair unique (participant_a, participant_b)
);

create index if not exists conversations_participant_a_idx on public.conversations (participant_a);
create index if not exists conversations_participant_b_idx on public.conversations (participant_b);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  match_score double precision,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);
create index if not exists messages_receiver_idx on public.messages (receiver_id, read);

-- ============================================================================
-- REVIEWS
-- ============================================================================

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  reviewer_id uuid not null references public.users(id) on delete cascade,
  reviewed_id uuid not null references public.users(id) on delete cascade,
  project_description text,
  rating_overall smallint check (rating_overall between 1 and 5),
  rating_reliability smallint check (rating_reliability between 1 and 5),
  rating_quality smallint check (rating_quality between 1 and 5),
  rating_collaboration smallint check (rating_collaboration between 1 and 5),
  review_text text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_reviewed_idx on public.reviews (reviewed_id);

-- ============================================================================
-- INDUSTRY SIMILARITY
-- ============================================================================

create table if not exists public.industry_similarity (
  industry_a text not null,
  industry_b text not null,
  similarity_score double precision not null check (similarity_score >= 0 and similarity_score <= 1),
  primary key (industry_a, industry_b)
);

insert into public.industry_similarity (industry_a, industry_b, similarity_score) values
  ('outdoor_sport', 'travel_adventure', 0.85),
  ('outdoor_sport', 'lifestyle', 0.60),
  ('tech_saas', 'fintech', 0.70),
  ('tech_saas', 'fashion', 0.15),
  ('food_bev', 'lifestyle', 0.65),
  ('sustainability', 'outdoor_sport', 0.55),
  ('automotive', 'tech_saas', 0.50),
  ('fashion', 'lifestyle', 0.75),
  ('health', 'lifestyle', 0.55),
  ('ecommerce', 'fashion', 0.60),
  ('education', 'tech_saas', 0.45),
  ('real_estate', 'architecture', 0.80),
  ('manufacturing', 'automotive', 0.60),
  ('manufacturing', 'tech_saas', 0.40),
  ('luxury_lifestyle', 'travel_adventure', 0.70),
  ('luxury_lifestyle', 'fashion', 0.65),
  ('luxury_lifestyle', 'automotive', 0.55),
  ('music_entertainment', 'lifestyle', 0.60),
  ('music_entertainment', 'fashion', 0.55),
  ('travel_adventure', 'lifestyle', 0.65)
on conflict (industry_a, industry_b) do update set similarity_score = excluded.similarity_score;

-- Make similarity symmetric
insert into public.industry_similarity (industry_a, industry_b, similarity_score)
select industry_b, industry_a, similarity_score
from public.industry_similarity
on conflict (industry_a, industry_b) do nothing;

-- ============================================================================
-- TRIGGERS: auto-create public.users row on auth signup
-- ============================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, user_type, display_name)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'user_type')::user_type, 'creator'),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================================
-- TRIGGERS: keep creator avg_rating in sync
-- ============================================================================

create or replace function public.refresh_creator_rating()
returns trigger
language plpgsql
as $$
declare
  target_user uuid := coalesce(new.reviewed_id, old.reviewed_id);
begin
  update public.creator_profiles c
  set
    avg_rating = sub.avg_rating,
    review_count = sub.review_count
  from (
    select reviewed_id,
           round(avg(rating_overall)::numeric, 2) as avg_rating,
           count(*)::int as review_count
    from public.reviews
    where reviewed_id = target_user
    group by reviewed_id
  ) sub
  where c.user_id = sub.reviewed_id;
  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_after_change on public.reviews;
create trigger reviews_after_change
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_creator_rating();

-- ============================================================================
-- RLS
-- ============================================================================

alter table public.users enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.startup_profiles enable row level security;
alter table public.posts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reviews enable row level security;
alter table public.industry_similarity enable row level security;

-- Public read for directory / feed
drop policy if exists "users_public_read" on public.users;
create policy "users_public_read" on public.users for select using (true);

drop policy if exists "creator_profiles_public_read" on public.creator_profiles;
create policy "creator_profiles_public_read" on public.creator_profiles for select using (true);

drop policy if exists "startup_profiles_public_read" on public.startup_profiles;
create policy "startup_profiles_public_read" on public.startup_profiles for select using (true);

drop policy if exists "posts_public_read" on public.posts;
create policy "posts_public_read" on public.posts for select using (true);

drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews for select using (true);

drop policy if exists "industry_similarity_public_read" on public.industry_similarity;
create policy "industry_similarity_public_read" on public.industry_similarity for select using (true);

-- Writes restricted to owners
drop policy if exists "users_self_update" on public.users;
create policy "users_self_update" on public.users for update using (auth.uid() = id);

drop policy if exists "users_self_insert" on public.users;
create policy "users_self_insert" on public.users for insert with check (auth.uid() = id);

drop policy if exists "creator_profiles_owner_write" on public.creator_profiles;
create policy "creator_profiles_owner_write" on public.creator_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "startup_profiles_owner_write" on public.startup_profiles;
create policy "startup_profiles_owner_write" on public.startup_profiles for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "posts_owner_write" on public.posts;
create policy "posts_owner_write" on public.posts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reviews_owner_write" on public.reviews;
create policy "reviews_owner_write" on public.reviews for all using (auth.uid() = reviewer_id) with check (auth.uid() = reviewer_id);

-- Conversations: participants can read, either side can create
drop policy if exists "conversations_participants_read" on public.conversations;
create policy "conversations_participants_read" on public.conversations for select using (auth.uid() in (participant_a, participant_b));

drop policy if exists "conversations_insert" on public.conversations;
create policy "conversations_insert" on public.conversations for insert with check (auth.uid() in (participant_a, participant_b));

drop policy if exists "conversations_update" on public.conversations;
create policy "conversations_update" on public.conversations for update using (auth.uid() in (participant_a, participant_b));

-- Messages: sender/receiver can read; sender can write
drop policy if exists "messages_participants_read" on public.messages;
create policy "messages_participants_read" on public.messages for select using (auth.uid() in (sender_id, receiver_id));

drop policy if exists "messages_sender_write" on public.messages;
create policy "messages_sender_write" on public.messages for insert with check (auth.uid() = sender_id);

drop policy if exists "messages_receiver_update" on public.messages;
create policy "messages_receiver_update" on public.messages for update using (auth.uid() = receiver_id);
