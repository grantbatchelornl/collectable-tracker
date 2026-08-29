create extension if not exists pgcrypto;

-- =========================================================
-- USERS / PROFILES
-- Replaces Base44 User + CollectorProfile
-- =========================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  legacy_base44_user_id text unique,

  role text not null default 'user',
  display_name text,
  username text unique,
  bio text,
  profile_photo text,

  has_completed_onboarding boolean not null default false,
  is_suspended boolean not null default false,

  show_public_value boolean not null default false,
  hide_collection_value boolean not null default false,
  hide_individual_collectibles boolean not null default false,
  hide_purchase_prices boolean not null default true,

  favorite_categories text,
  favorite_sets text,
  favorite_franchises text,
  favorite_athletes text,
  favorite_teams text,
  favorite_characters text,

  budget numeric,
  goals text,
  risk_tolerance text,

  leaderboard_opt_in boolean not null default false,
  leaderboard_scope text,

  price_increase_threshold numeric,
  price_decrease_threshold numeric,
  health_reminder_enabled boolean not null default true,

  binder_scan_count integer not null default 0,
  dashboard_widgets text,
  vacation_mode boolean not null default false,

  is_verified_trader boolean not null default false,
  is_influencer boolean not null default false,
  influencer_platform text,
  influencer_handle text,

  convention_mode_active boolean not null default false,
  convention_lat double precision,
  convention_lng double precision,
  convention_name text,

  trade_reputation_score numeric not null default 0,
  trade_review_count integer not null default 0,
  total_completed_trades integer not null default 0,

  xp integer not null default 0,
  level integer not null default 1,
  xp_to_next_level integer not null default 0,

  ai_enabled boolean not null default true,
  ai_response_detail text,
  ai_collector_level text,
  ai_recommendation_style text,
  ai_enable_recommendations boolean not null default true,
  ai_enable_binder_suggestions boolean not null default true,
  ai_enable_trade_suggestions boolean not null default true,
  ai_enable_grading_suggestions boolean not null default true,
  ai_enable_health_suggestions boolean not null default true,
  ai_include_purchase_price boolean not null default false,
  ai_include_manual_values boolean not null default false,
  ai_save_history boolean not null default true,
  ai_auto_confirm_routine boolean not null default false,

  notification_in_app_enabled boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- COLLECTIBLE CATEGORIES
-- =========================================================

create table public.collectible_categories (
  id text primary key default gen_random_uuid()::text,
  legacy_base44_id text unique,

  name text not null,
  slug text unique,
  icon text,
  active boolean not null default true,
  sort_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- COLLECTION FOLDERS
-- =========================================================

create table public.collection_folders (
  id text primary key default gen_random_uuid()::text,
  legacy_base44_id text unique,

  user_id uuid not null references public.profiles(id) on delete cascade,

  name text not null,
  description text,
  icon text,
  color text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index collection_folders_user_idx
  on public.collection_folders(user_id);

-- =========================================================
-- COLLECTIBLES
-- Replaces Base44 Collectible
-- =========================================================

create table public.collectibles (
  id text primary key default gen_random_uuid()::text,
  legacy_base44_id text unique,

  user_id uuid not null references public.profiles(id) on delete cascade,

  item_name text not null,
  category_id text references public.collectible_categories(id),
  category_name text,

  character_athlete_name text,
  brand text,
  product_line text,
  set_name text,
  set_number text,
  card_number text,
  year integer,
  team text,
  variant text,
  edition text,
  parallel text,
  serial_number text,
  language text,

  has_autograph boolean not null default false,
  grading_company text,
  grade text,
  box_condition text,
  item_condition text,
  authentication_company text,

  franchise text,
  box_number text,
  series text,
  is_exclusive boolean not null default false,
  has_sticker boolean not null default false,
  is_chase boolean not null default false,
  is_boxed boolean not null default false,

  country text,
  denomination text,
  mint_mark text,
  composition text,

  sport text,
  is_rookie boolean not null default false,
  has_patch boolean not null default false,
  item_type text,
  is_game_used boolean not null default false,

  quantity integer not null default 1,

  estimated_value numeric,
  low_value numeric,
  high_value numeric,
  average_price numeric,
  purchase_cost numeric,

  value_source text,
  value_type text,
  value_locked boolean not null default false,
  value_confidence text,
  comparables_count integer,
  most_recent_sale_date timestamptz,
  comparable_date_range text,
  matching_criteria text,
  includes_shipping boolean not null default false,
  is_stale boolean not null default false,
  valuation_notes text,

  for_sale boolean not null default false,
  asking_price numeric,
  trade_status text,
  privacy_status text not null default 'private',

  primary_photo_url text,
  notes text,

  is_deleted boolean not null default false,
  deleted_date timestamptz,
  is_favorite boolean not null default false,

  folder_id text references public.collection_folders(id) on delete set null,

  version integer not null default 1,

  acquisition_source text,
  seller_name text,
  purchase_date date,

  memory text,
  why_special text,
  memory_date date,
  memory_shared boolean not null default false,

  showcase_order integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index collectibles_user_idx
  on public.collectibles(user_id);

create index collectibles_category_idx
  on public.collectibles(category_id);

create index collectibles_folder_idx
  on public.collectibles(folder_id);

create index collectibles_user_deleted_idx
  on public.collectibles(user_id, is_deleted);

-- =========================================================
-- COLLECTIBLE PHOTOS
-- =========================================================

create table public.collectible_photos (
  id text primary key default gen_random_uuid()::text,
  legacy_base44_id text unique,

  user_id uuid not null references public.profiles(id) on delete cascade,
  collectible_id text not null references public.collectibles(id) on delete cascade,

  photo_type text,
  photo_url text not null,

  created_at timestamptz not null default now()
);

create index collectible_photos_collectible_idx
  on public.collectible_photos(collectible_id);

create index collectible_photos_user_idx
  on public.collectible_photos(user_id);

-- =========================================================
-- UPDATED_AT HELPER
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger collectible_categories_set_updated_at
before update on public.collectible_categories
for each row execute function public.set_updated_at();

create trigger collection_folders_set_updated_at
before update on public.collection_folders
for each row execute function public.set_updated_at();

create trigger collectibles_set_updated_at
before update on public.collectibles
for each row execute function public.set_updated_at();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles enable row level security;
alter table public.collectible_categories enable row level security;
alter table public.collection_folders enable row level security;
alter table public.collectibles enable row level security;
alter table public.collectible_photos enable row level security;

-- Profiles
create policy "users can read own profile"
on public.profiles
for select
using (id = auth.uid());

create policy "users can update own profile"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

-- Categories are safe for authenticated users to read.
create policy "authenticated users can read categories"
on public.collectible_categories
for select
to authenticated
using (true);

-- Collection folders
create policy "users own their folders"
on public.collection_folders
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Collectibles
create policy "users can read own collectibles"
on public.collectibles
for select
using (user_id = auth.uid());

create policy "users can create own collectibles"
on public.collectibles
for insert
with check (user_id = auth.uid());

create policy "users can update own collectibles"
on public.collectibles
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "users can delete own collectibles"
on public.collectibles
for delete
using (user_id = auth.uid());

-- Photos
create policy "users own their collectible photos"
on public.collectible_photos
for all
using (user_id = auth.uid())
with check (user_id = auth.uid());
