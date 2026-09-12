-- Generated migration from active Base44 entity schemas
-- User and CollectorProfile intentionally map to public.profiles

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "user_id" text,
  "title" text,
  "messages_json" text,
  "last_message_preview" text,
  "message_count" numeric default 0
);

grant select, insert, update, delete on public.ai_conversations to authenticated;

create table if not exists public.ai_review_queue (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "user_id" text,
  "photo_urls_json" text,
  "ai_suggestions_json" text,
  "low_confidence_reason" text,
  "category_id" text,
  "category_name" text,
  "status" text default 'pending',
  "selected_match_json" text,
  "form_data_json" text
);

grant select, insert, update, delete on public.ai_review_queue to authenticated;

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "user_id" text,
  "badge_type" text,
  "badge_name" text,
  "badge_icon" text,
  "badge_description" text
);

grant select, insert, update, delete on public.achievements to authenticated;

create table if not exists public.achievement_templates (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "badge_type" text,
  "badge_name" text,
  "badge_icon" text,
  "badge_description" text,
  "category" text,
  "threshold" numeric,
  "threshold_unit" text,
  "active" boolean default true
);

grant select, insert, update, delete on public.achievement_templates to authenticated;

create table if not exists public.app_feature_flags (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "key" text,
  "label" text,
  "description" text,
  "enabled" boolean default true,
  "category" text
);

grant select, insert, update, delete on public.app_feature_flags to authenticated;

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "key" text,
  "value" text,
  "label" text,
  "description" text
);

grant select, insert, update, delete on public.app_settings to authenticated;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "user_id" text,
  "conversation_id" text,
  "action" text,
  "action_requested" text,
  "target_type" text,
  "target_id" text,
  "target_name" text,
  "previous_value" text,
  "new_value" text,
  "confirmation_status" text,
  "success" boolean default true,
  "details" text
);

grant select, insert, update, delete on public.audit_logs to authenticated;

create table if not exists public.collection_goals (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "user_id" text,
  "title" text,
  "goal_type" text default 'custom',
  "category_name" text,
  "set_name" text,
  "character_athlete_name" text,
  "product_line" text,
  "year" numeric,
  "target_count" numeric default 0,
  "status" text default 'active',
  "estimated_cost_to_finish" numeric default 0,
  "ai_recommendation" text,
  "notes" text
);

grant select, insert, update, delete on public.collection_goals to authenticated;

create table if not exists public.collection_health (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "overall_score" numeric,
  "completion_score" numeric,
  "accuracy_score" numeric,
  "freshness_score" numeric,
  "issues" text,
  "total_items" numeric,
  "items_missing_photos" numeric,
  "items_missing_values" numeric,
  "items_stale" numeric
);

grant select, insert, update, delete on public.collection_health to authenticated;

create table if not exists public.collection_value_snapshots (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "total_value" numeric,
  "verified_value" numeric,
  "manual_value" numeric,
  "total_cost" numeric,
  "item_count" numeric,
  "category_breakdown" text
);

grant select, insert, update, delete on public.collection_value_snapshots to authenticated;

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "follower_id" text,
  "following_id" text,
  "follower_name" text,
  "following_name" text,
  "follower_photo" text,
  "following_photo" text,
  "status" text default 'pending'
);

grant select, insert, update, delete on public.follows to authenticated;

create table if not exists public.founding_collectors (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "user_id" text,
  "display_name" text,
  "username" text,
  "profile_photo" text,
  "badge_type" text default 'founding_collector',
  "message" text,
  "joined_date" text
);

grant select, insert, update, delete on public.founding_collectors to authenticated;

create table if not exists public.hall_of_fame (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "user_id" text,
  "entry_type" text,
  "title" text,
  "description" text,
  "binder_id" text,
  "achievement_id" text,
  "photo_url" text,
  "completion_date" text,
  "metric_value" numeric
);

grant select, insert, update, delete on public.hall_of_fame to authenticated;

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "name" text,
  "description" text,
  "photo_url" text,
  "invite_code" text,
  "is_private" boolean default false,
  "owner_id" text,
  "owner_name" text,
  "member_count" numeric default 1,
  "category" text
);

grant select, insert, update, delete on public.leagues to authenticated;

create table if not exists public.league_activities (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "league_id" text,
  "league_name" text,
  "user_id" text,
  "user_name" text,
  "user_photo" text,
  "activity_type" text,
  "description" text,
  "collectible_id" text,
  "collectible_name" text,
  "collectible_photo" text,
  "value" numeric default 0
);

grant select, insert, update, delete on public.league_activities to authenticated;

create table if not exists public.league_challenges (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "league_id" text,
  "league_name" text,
  "title" text,
  "description" text,
  "category" text,
  "metric" text,
  "start_date" text,
  "end_date" text,
  "prize" text,
  "status" text default 'active',
  "created_by" text
);

grant select, insert, update, delete on public.league_challenges to authenticated;

create table if not exists public.league_members (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "league_id" text,
  "league_name" text,
  "user_id" text,
  "user_name" text,
  "user_photo" text,
  "role" text default 'member'
);

grant select, insert, update, delete on public.league_members to authenticated;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "sender_id" text,
  "recipient_id" text,
  "sender_name" text,
  "recipient_name" text,
  "sender_photo" text,
  "recipient_photo" text,
  "body" text,
  "read" boolean default false,
  "attached_collectible_id" text,
  "attached_collectible_name" text,
  "attached_collectible_photo" text,
  "attached_collectible_value" numeric default 0
);

grant select, insert, update, delete on public.messages to authenticated;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "recipient_id" text,
  "type" text,
  "title" text,
  "body" text,
  "destination_route" text,
  "destination_id" text,
  "read" boolean default false,
  "icon" text
);

grant select, insert, update, delete on public.notifications to authenticated;

create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "user_id" text,
  "collectible_id" text,
  "collectible_name" text,
  "target_value" numeric,
  "direction" text default 'above',
  "status" text default 'active',
  "triggered_date" text,
  "triggered_value" numeric
);

grant select, insert, update, delete on public.price_alerts to authenticated;

create table if not exists public.pricing_history (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "collectible_id" text,
  "collectible_name" text,
  "estimated_value" numeric default 0,
  "low_value" numeric default 0,
  "high_value" numeric default 0,
  "average_price" numeric default 0,
  "pricing_source" text default 'Manual',
  "value_type" text default 'manual',
  "confidence" text default 'low',
  "comparables_count" numeric default 0,
  "most_recent_sale_date" text,
  "comparable_date_range" text,
  "matching_criteria" text,
  "includes_shipping" boolean default false,
  "is_stale" boolean default false,
  "valuation_notes" text
);

grant select, insert, update, delete on public.pricing_history to authenticated;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "reporter_id" text,
  "reported_id" text,
  "report_type" text,
  "target_id" text,
  "reason" text,
  "description" text,
  "status" text default 'pending'
);

grant select, insert, update, delete on public.reports to authenticated;

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "proposer_id" text,
  "recipient_id" text,
  "proposer_name" text,
  "recipient_name" text,
  "proposer_photo" text,
  "status" text default 'pending',
  "message" text,
  "response_message" text,
  "offered_items_json" text,
  "requested_items_json" text,
  "offered_value" numeric default 0,
  "requested_value" numeric default 0,
  "cash_adjustment" numeric default 0,
  "cash_direction" text default 'proposer_to_recipient',
  "is_counter_offer" boolean default false,
  "original_trade_id" text
);

grant select, insert, update, delete on public.trades to authenticated;

create table if not exists public.trade_reviews (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "trade_id" text,
  "reviewer_id" text,
  "reviewer_name" text,
  "reviewed_id" text,
  "rating_accuracy" numeric,
  "rating_communication" numeric,
  "rating_shipping" numeric,
  "rating_packaging" numeric,
  "would_trade_again" boolean default true,
  "comment" text
);

grant select, insert, update, delete on public.trade_reviews to authenticated;

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "blocker_id" text,
  "blocked_id" text,
  "blocked_name" text
);

grant select, insert, update, delete on public.user_blocks to authenticated;

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by_id text,
  "user_id" text,
  "item_name" text,
  "category_id" text,
  "category_name" text,
  "collectible_id" text,
  "target_price" numeric default 0,
  "notes" text,
  "priority" text default 'medium',
  "visibility" text default 'private',
  "alerts_enabled" boolean default true,
  "raw_or_graded" text default 'any',
  "status" text default 'active',
  "alert_type" text default 'below'
);

grant select, insert, update, delete on public.watchlist to authenticated;
alter table public.ai_conversations enable row level security;

drop policy if exists "ai_conversations_select_own" on public.ai_conversations;

create policy "ai_conversations_select_own"
on public.ai_conversations
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "ai_conversations_insert_own" on public.ai_conversations;

create policy "ai_conversations_insert_own"
on public.ai_conversations
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "ai_conversations_update_own" on public.ai_conversations;

create policy "ai_conversations_update_own"
on public.ai_conversations
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "ai_conversations_delete_own" on public.ai_conversations;

create policy "ai_conversations_delete_own"
on public.ai_conversations
for delete
to authenticated
using (user_id = auth.uid()::text);

alter table public.ai_review_queue enable row level security;

drop policy if exists "ai_review_queue_select_own" on public.ai_review_queue;

create policy "ai_review_queue_select_own"
on public.ai_review_queue
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "ai_review_queue_insert_own" on public.ai_review_queue;

create policy "ai_review_queue_insert_own"
on public.ai_review_queue
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "ai_review_queue_update_own" on public.ai_review_queue;

create policy "ai_review_queue_update_own"
on public.ai_review_queue
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "ai_review_queue_delete_own" on public.ai_review_queue;

create policy "ai_review_queue_delete_own"
on public.ai_review_queue
for delete
to authenticated
using (user_id = auth.uid()::text);

alter table public.achievements enable row level security;

drop policy if exists "achievements_select_own" on public.achievements;

create policy "achievements_select_own"
on public.achievements
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "achievements_insert_own" on public.achievements;

create policy "achievements_insert_own"
on public.achievements
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "achievements_update_own" on public.achievements;

create policy "achievements_update_own"
on public.achievements
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "achievements_delete_own" on public.achievements;

create policy "achievements_delete_own"
on public.achievements
for delete
to authenticated
using (user_id = auth.uid()::text);

alter table public.collection_goals enable row level security;

drop policy if exists "collection_goals_select_own" on public.collection_goals;

create policy "collection_goals_select_own"
on public.collection_goals
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "collection_goals_insert_own" on public.collection_goals;

create policy "collection_goals_insert_own"
on public.collection_goals
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "collection_goals_update_own" on public.collection_goals;

create policy "collection_goals_update_own"
on public.collection_goals
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "collection_goals_delete_own" on public.collection_goals;

create policy "collection_goals_delete_own"
on public.collection_goals
for delete
to authenticated
using (user_id = auth.uid()::text);

alter table public.price_alerts enable row level security;

drop policy if exists "price_alerts_select_own" on public.price_alerts;

create policy "price_alerts_select_own"
on public.price_alerts
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "price_alerts_insert_own" on public.price_alerts;

create policy "price_alerts_insert_own"
on public.price_alerts
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "price_alerts_update_own" on public.price_alerts;

create policy "price_alerts_update_own"
on public.price_alerts
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "price_alerts_delete_own" on public.price_alerts;

create policy "price_alerts_delete_own"
on public.price_alerts
for delete
to authenticated
using (user_id = auth.uid()::text);

alter table public.watchlist enable row level security;

drop policy if exists "watchlist_select_own" on public.watchlist;

create policy "watchlist_select_own"
on public.watchlist
for select
to authenticated
using (user_id = auth.uid()::text);

drop policy if exists "watchlist_insert_own" on public.watchlist;

create policy "watchlist_insert_own"
on public.watchlist
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "watchlist_update_own" on public.watchlist;

create policy "watchlist_update_own"
on public.watchlist
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "watchlist_delete_own" on public.watchlist;

create policy "watchlist_delete_own"
on public.watchlist
for delete
to authenticated
using (user_id = auth.uid()::text);

alter table public.collection_health enable row level security;

drop policy if exists "collection_health_select_own" on public.collection_health;

create policy "collection_health_select_own"
on public.collection_health
for select
to authenticated
using (created_by_id = auth.uid()::text);

drop policy if exists "collection_health_insert_own" on public.collection_health;

create policy "collection_health_insert_own"
on public.collection_health
for insert
to authenticated
with check (created_by_id = auth.uid()::text);

drop policy if exists "collection_health_update_own" on public.collection_health;

create policy "collection_health_update_own"
on public.collection_health
for update
to authenticated
using (created_by_id = auth.uid()::text)
with check (created_by_id = auth.uid()::text);

drop policy if exists "collection_health_delete_own" on public.collection_health;

create policy "collection_health_delete_own"
on public.collection_health
for delete
to authenticated
using (created_by_id = auth.uid()::text);

alter table public.collection_value_snapshots enable row level security;

drop policy if exists "collection_value_snapshots_select_own" on public.collection_value_snapshots;

create policy "collection_value_snapshots_select_own"
on public.collection_value_snapshots
for select
to authenticated
using (created_by_id = auth.uid()::text);

drop policy if exists "collection_value_snapshots_insert_own" on public.collection_value_snapshots;

create policy "collection_value_snapshots_insert_own"
on public.collection_value_snapshots
for insert
to authenticated
with check (created_by_id = auth.uid()::text);

drop policy if exists "collection_value_snapshots_update_own" on public.collection_value_snapshots;

create policy "collection_value_snapshots_update_own"
on public.collection_value_snapshots
for update
to authenticated
using (created_by_id = auth.uid()::text)
with check (created_by_id = auth.uid()::text);

drop policy if exists "collection_value_snapshots_delete_own" on public.collection_value_snapshots;

create policy "collection_value_snapshots_delete_own"
on public.collection_value_snapshots
for delete
to authenticated
using (created_by_id = auth.uid()::text);

alter table public.pricing_history enable row level security;

drop policy if exists "pricing_history_select_own" on public.pricing_history;

create policy "pricing_history_select_own"
on public.pricing_history
for select
to authenticated
using (created_by_id = auth.uid()::text);

drop policy if exists "pricing_history_insert_own" on public.pricing_history;

create policy "pricing_history_insert_own"
on public.pricing_history
for insert
to authenticated
with check (created_by_id = auth.uid()::text);

drop policy if exists "pricing_history_update_own" on public.pricing_history;

create policy "pricing_history_update_own"
on public.pricing_history
for update
to authenticated
using (created_by_id = auth.uid()::text)
with check (created_by_id = auth.uid()::text);

drop policy if exists "pricing_history_delete_own" on public.pricing_history;

create policy "pricing_history_delete_own"
on public.pricing_history
for delete
to authenticated
using (created_by_id = auth.uid()::text);

alter table public.founding_collectors enable row level security;

drop policy if exists "founding_collectors_read_authenticated" on public.founding_collectors;

create policy "founding_collectors_read_authenticated"
on public.founding_collectors
for select
to authenticated
using (true);

drop policy if exists "founding_collectors_insert_own" on public.founding_collectors;

create policy "founding_collectors_insert_own"
on public.founding_collectors
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "founding_collectors_update_own" on public.founding_collectors;

create policy "founding_collectors_update_own"
on public.founding_collectors
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "founding_collectors_delete_own" on public.founding_collectors;

create policy "founding_collectors_delete_own"
on public.founding_collectors
for delete
to authenticated
using (user_id = auth.uid()::text);

alter table public.hall_of_fame enable row level security;

drop policy if exists "hall_of_fame_read_authenticated" on public.hall_of_fame;

create policy "hall_of_fame_read_authenticated"
on public.hall_of_fame
for select
to authenticated
using (true);

drop policy if exists "hall_of_fame_insert_own" on public.hall_of_fame;

create policy "hall_of_fame_insert_own"
on public.hall_of_fame
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "hall_of_fame_update_own" on public.hall_of_fame;

create policy "hall_of_fame_update_own"
on public.hall_of_fame
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "hall_of_fame_delete_own" on public.hall_of_fame;

create policy "hall_of_fame_delete_own"
on public.hall_of_fame
for delete
to authenticated
using (user_id = auth.uid()::text);

alter table public.follows enable row level security;

drop policy if exists "follows_read_authenticated" on public.follows;

create policy "follows_read_authenticated"
on public.follows
for select
to authenticated
using (true);

drop policy if exists "follows_insert_own" on public.follows;

create policy "follows_insert_own"
on public.follows
for insert
to authenticated
with check (follower_id = auth.uid()::text);

drop policy if exists "follows_update_own" on public.follows;

create policy "follows_update_own"
on public.follows
for update
to authenticated
using (follower_id = auth.uid()::text)
with check (follower_id = auth.uid()::text);

drop policy if exists "follows_delete_own" on public.follows;

create policy "follows_delete_own"
on public.follows
for delete
to authenticated
using (follower_id = auth.uid()::text);

alter table public.trade_reviews enable row level security;

drop policy if exists "trade_reviews_read_authenticated" on public.trade_reviews;

create policy "trade_reviews_read_authenticated"
on public.trade_reviews
for select
to authenticated
using (true);

drop policy if exists "trade_reviews_insert_own" on public.trade_reviews;

create policy "trade_reviews_insert_own"
on public.trade_reviews
for insert
to authenticated
with check (reviewer_id = auth.uid()::text);

drop policy if exists "trade_reviews_update_own" on public.trade_reviews;

create policy "trade_reviews_update_own"
on public.trade_reviews
for update
to authenticated
using (reviewer_id = auth.uid()::text)
with check (reviewer_id = auth.uid()::text);

drop policy if exists "trade_reviews_delete_own" on public.trade_reviews;

create policy "trade_reviews_delete_own"
on public.trade_reviews
for delete
to authenticated
using (reviewer_id = auth.uid()::text);

alter table public.leagues enable row level security;

drop policy if exists "leagues_read_authenticated" on public.leagues;

create policy "leagues_read_authenticated"
on public.leagues
for select
to authenticated
using (true);

drop policy if exists "leagues_insert_own" on public.leagues;

create policy "leagues_insert_own"
on public.leagues
for insert
to authenticated
with check (owner_id = auth.uid()::text);

drop policy if exists "leagues_update_own" on public.leagues;

create policy "leagues_update_own"
on public.leagues
for update
to authenticated
using (owner_id = auth.uid()::text)
with check (owner_id = auth.uid()::text);

drop policy if exists "leagues_delete_own" on public.leagues;

create policy "leagues_delete_own"
on public.leagues
for delete
to authenticated
using (owner_id = auth.uid()::text);

alter table public.league_members enable row level security;

drop policy if exists "league_members_read_authenticated" on public.league_members;

create policy "league_members_read_authenticated"
on public.league_members
for select
to authenticated
using (true);

drop policy if exists "league_members_insert_own" on public.league_members;

create policy "league_members_insert_own"
on public.league_members
for insert
to authenticated
with check (user_id = auth.uid()::text);

drop policy if exists "league_members_update_own" on public.league_members;

create policy "league_members_update_own"
on public.league_members
for update
to authenticated
using (user_id = auth.uid()::text)
with check (user_id = auth.uid()::text);

drop policy if exists "league_members_delete_own" on public.league_members;

create policy "league_members_delete_own"
on public.league_members
for delete
to authenticated
using (user_id = auth.uid()::text);

alter table public.league_activities enable row level security;

drop policy if exists "league_activities_read_authenticated" on public.league_activities;

create policy "league_activities_read_authenticated"
on public.league_activities
for select
to authenticated
using (true);

drop policy if exists "league_activities_insert_creator" on public.league_activities;

create policy "league_activities_insert_creator"
on public.league_activities
for insert
to authenticated
with check (created_by_id = auth.uid()::text);

drop policy if exists "league_activities_update_creator" on public.league_activities;

create policy "league_activities_update_creator"
on public.league_activities
for update
to authenticated
using (created_by_id = auth.uid()::text)
with check (created_by_id = auth.uid()::text);

drop policy if exists "league_activities_delete_creator" on public.league_activities;

create policy "league_activities_delete_creator"
on public.league_activities
for delete
to authenticated
using (created_by_id = auth.uid()::text);

alter table public.league_challenges enable row level security;

drop policy if exists "league_challenges_read_authenticated" on public.league_challenges;

create policy "league_challenges_read_authenticated"
on public.league_challenges
for select
to authenticated
using (true);

drop policy if exists "league_challenges_insert_creator" on public.league_challenges;

create policy "league_challenges_insert_creator"
on public.league_challenges
for insert
to authenticated
with check (created_by_id = auth.uid()::text);

drop policy if exists "league_challenges_update_creator" on public.league_challenges;

create policy "league_challenges_update_creator"
on public.league_challenges
for update
to authenticated
using (created_by_id = auth.uid()::text)
with check (created_by_id = auth.uid()::text);

drop policy if exists "league_challenges_delete_creator" on public.league_challenges;

create policy "league_challenges_delete_creator"
on public.league_challenges
for delete
to authenticated
using (created_by_id = auth.uid()::text);

alter table public.messages enable row level security;

drop policy if exists "messages_participant_read" on public.messages;

create policy "messages_participant_read"
on public.messages
for select
to authenticated
using (sender_id = auth.uid()::text
or recipient_id = auth.uid()::text);

drop policy if exists "messages_sender_insert" on public.messages;

create policy "messages_sender_insert"
on public.messages
for insert
to authenticated
with check (sender_id = auth.uid()::text);

drop policy if exists "messages_participant_update" on public.messages;

create policy "messages_participant_update"
on public.messages
for update
to authenticated
using (sender_id = auth.uid()::text
or recipient_id = auth.uid()::text)
with check (sender_id = auth.uid()::text
or recipient_id = auth.uid()::text);

drop policy if exists "messages_participant_delete" on public.messages;

create policy "messages_participant_delete"
on public.messages
for delete
to authenticated
using (sender_id = auth.uid()::text
or recipient_id = auth.uid()::text);

alter table public.trades enable row level security;

drop policy if exists "trades_participant_read" on public.trades;

create policy "trades_participant_read"
on public.trades
for select
to authenticated
using (proposer_id = auth.uid()::text
or recipient_id = auth.uid()::text);

drop policy if exists "trades_proposer_insert" on public.trades;

create policy "trades_proposer_insert"
on public.trades
for insert
to authenticated
with check (proposer_id = auth.uid()::text);

drop policy if exists "trades_participant_update" on public.trades;

create policy "trades_participant_update"
on public.trades
for update
to authenticated
using (proposer_id = auth.uid()::text
or recipient_id = auth.uid()::text)
with check (proposer_id = auth.uid()::text
or recipient_id = auth.uid()::text);

drop policy if exists "trades_participant_delete" on public.trades;

create policy "trades_participant_delete"
on public.trades
for delete
to authenticated
using (proposer_id = auth.uid()::text
or recipient_id = auth.uid()::text);

alter table public.user_blocks enable row level security;

drop policy if exists "user_blocks_select_own" on public.user_blocks;

create policy "user_blocks_select_own"
on public.user_blocks
for select
to authenticated
using (blocker_id = auth.uid()::text);

drop policy if exists "user_blocks_insert_own" on public.user_blocks;

create policy "user_blocks_insert_own"
on public.user_blocks
for insert
to authenticated
with check (blocker_id = auth.uid()::text);

drop policy if exists "user_blocks_update_own" on public.user_blocks;

create policy "user_blocks_update_own"
on public.user_blocks
for update
to authenticated
using (blocker_id = auth.uid()::text)
with check (blocker_id = auth.uid()::text);

drop policy if exists "user_blocks_delete_own" on public.user_blocks;

create policy "user_blocks_delete_own"
on public.user_blocks
for delete
to authenticated
using (blocker_id = auth.uid()::text);

alter table public.notifications enable row level security;

drop policy if exists "notifications_recipient_read" on public.notifications;

create policy "notifications_recipient_read"
on public.notifications
for select
to authenticated
using (recipient_id = auth.uid()::text);

drop policy if exists "notifications_authenticated_insert" on public.notifications;

create policy "notifications_authenticated_insert"
on public.notifications
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "notifications_recipient_update" on public.notifications;

create policy "notifications_recipient_update"
on public.notifications
for update
to authenticated
using (recipient_id = auth.uid()::text)
with check (recipient_id = auth.uid()::text);

drop policy if exists "notifications_recipient_delete" on public.notifications;

create policy "notifications_recipient_delete"
on public.notifications
for delete
to authenticated
using (recipient_id = auth.uid()::text);

alter table public.reports enable row level security;

drop policy if exists "reports_insert_own" on public.reports;

create policy "reports_insert_own"
on public.reports
for insert
to authenticated
with check (reporter_id = auth.uid()::text);

drop policy if exists "reports_read_own" on public.reports;

create policy "reports_read_own"
on public.reports
for select
to authenticated
using (reporter_id = auth.uid()::text);

alter table public.achievement_templates enable row level security;

drop policy if exists "achievement_templates_read_authenticated" on public.achievement_templates;

create policy "achievement_templates_read_authenticated"
on public.achievement_templates
for select
to authenticated
using (true);

drop policy if exists "achievement_templates_admin_insert" on public.achievement_templates;

create policy "achievement_templates_admin_insert"
on public.achievement_templates
for insert
to authenticated
with check (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ));

drop policy if exists "achievement_templates_admin_update" on public.achievement_templates;

create policy "achievement_templates_admin_update"
on public.achievement_templates
for update
to authenticated
using (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ))
with check (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ));

drop policy if exists "achievement_templates_admin_delete" on public.achievement_templates;

create policy "achievement_templates_admin_delete"
on public.achievement_templates
for delete
to authenticated
using (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ));

alter table public.app_feature_flags enable row level security;

drop policy if exists "app_feature_flags_read_authenticated" on public.app_feature_flags;

create policy "app_feature_flags_read_authenticated"
on public.app_feature_flags
for select
to authenticated
using (true);

drop policy if exists "app_feature_flags_admin_insert" on public.app_feature_flags;

create policy "app_feature_flags_admin_insert"
on public.app_feature_flags
for insert
to authenticated
with check (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ));

drop policy if exists "app_feature_flags_admin_update" on public.app_feature_flags;

create policy "app_feature_flags_admin_update"
on public.app_feature_flags
for update
to authenticated
using (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ))
with check (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ));

drop policy if exists "app_feature_flags_admin_delete" on public.app_feature_flags;

create policy "app_feature_flags_admin_delete"
on public.app_feature_flags
for delete
to authenticated
using (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ));

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_read_authenticated" on public.app_settings;

create policy "app_settings_read_authenticated"
on public.app_settings
for select
to authenticated
using (true);

drop policy if exists "app_settings_admin_insert" on public.app_settings;

create policy "app_settings_admin_insert"
on public.app_settings
for insert
to authenticated
with check (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ));

drop policy if exists "app_settings_admin_update" on public.app_settings;

create policy "app_settings_admin_update"
on public.app_settings
for update
to authenticated
using (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ))
with check (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ));

drop policy if exists "app_settings_admin_delete" on public.app_settings;

create policy "app_settings_admin_delete"
on public.app_settings
for delete
to authenticated
using (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ));

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_read_authenticated" on public.audit_logs;

create policy "audit_logs_read_authenticated"
on public.audit_logs
for select
to authenticated
using (true);

drop policy if exists "audit_logs_admin_insert" on public.audit_logs;

create policy "audit_logs_admin_insert"
on public.audit_logs
for insert
to authenticated
with check (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ));

drop policy if exists "audit_logs_admin_update" on public.audit_logs;

create policy "audit_logs_admin_update"
on public.audit_logs
for update
to authenticated
using (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ))
with check (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ));

drop policy if exists "audit_logs_admin_delete" on public.audit_logs;

create policy "audit_logs_admin_delete"
on public.audit_logs
for delete
to authenticated
using (exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('admin', 'super_admin')
    ));
