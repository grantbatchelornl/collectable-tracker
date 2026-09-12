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
