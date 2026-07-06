-- Core Row Level Security policies for Intellectus.
-- Run after the Drizzle-generated schema migrations.
--
-- Supabase Realtime's Postgres Changes stream reads from the WAL and is NOT
-- filtered by application-level SELECT queries or client-supplied channel
-- filter strings. RLS on the underlying table is the only real enforcement
-- boundary for what a given subscriber's socket receives — this is what
-- fixes the shadow-ban leak: without it, a shadow-banned user's comment
-- would broadcast to every subscriber the instant it's inserted, regardless
-- of how the client filters what it displays.

alter table users enable row level security;
alter table comments enable row level security;
alter table comment_votes enable row level security;
alter table moderation_flags enable row level security;
alter table reading_progress enable row level security;
alter table privacy_settings enable row level security;

-- users: readers can see public profile fields for everyone, but only
-- modify their own row.
create policy users_select_all on users
  for select using (true);

create policy users_update_own on users
  for update using (auth.uid() = id);

-- comments: this is the policy that actually plugs the realtime leak.
-- A shadow-banned comment is invisible to every viewer except its own
-- author — enforced at the database layer, not just in app queries, so it
-- also governs what Postgres Changes broadcasts over the wire.
create policy comments_select_public on comments
  for select using (
    is_shadow_banned = false or user_id = auth.uid()
  );

create policy comments_insert_own on comments
  for insert with check (auth.uid() = user_id);

create policy comments_update_own on comments
  for update using (auth.uid() = user_id);

-- comment_votes: users can only write their own vote rows; two-dimensional
-- voting relies on the unique(comment_id, user_id, vote_type) constraint in
-- the schema to prevent double-voting within a dimension.
create policy comment_votes_select_all on comment_votes
  for select using (true);

create policy comment_votes_insert_own on comment_votes
  for insert with check (auth.uid() = user_id);

create policy comment_votes_delete_own on comment_votes
  for delete using (auth.uid() = user_id);

-- moderation_flags: only moderators/editors/admins may read the queue;
-- enforced via a role lookup against the app-level users table.
create policy moderation_flags_select_staff on moderation_flags
  for select using (
    exists (
      select 1 from users
      where users.id = auth.uid()
        and users.role in ('moderator', 'editor', 'admin')
    )
  );

create policy moderation_flags_insert_any_authenticated on moderation_flags
  for insert with check (auth.uid() is not null);

-- reading_progress / privacy_settings: strictly own-row only.
create policy reading_progress_owner on reading_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy privacy_settings_owner on privacy_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Enable the comments table for Realtime Postgres Changes. RLS above is
-- what makes this safe — without it, every INSERT would broadcast to every
-- subscribed socket regardless of the shadow-ban state.
alter publication supabase_realtime add table comments;
