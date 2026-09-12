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
