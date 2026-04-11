-- Run this in your Supabase SQL Editor (supabase.com > your project > SQL Editor)

-- Journal entries table
create table journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  entry_date date not null,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- One entry per user per day
create unique index journal_entries_user_date on journal_entries(user_id, entry_date);

-- Index for fast lookups
create index journal_entries_user_id on journal_entries(user_id);

-- Row Level Security: users can only see/edit their own entries
alter table journal_entries enable row level security;

create policy "Users can read own entries"
  on journal_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on journal_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on journal_entries for delete
  using (auth.uid() = user_id);

-- Auto-update the updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger journal_entries_updated_at
  before update on journal_entries
  for each row execute function update_updated_at();

-- ============================================================
-- MIGRATION: Add journal_type support (run if table exists)
-- ============================================================
-- Add journal_type column (existing rows default to 'wealth')
alter table journal_entries
  add column if not exists journal_type text not null default 'wealth';

-- Drop old unique index (user_id, entry_date) and replace with
-- (user_id, entry_date, journal_type) to allow same date across journals
drop index if exists journal_entries_user_date;
create unique index if not exists journal_entries_user_date_type
  on journal_entries(user_id, entry_date, journal_type);

-- ============================================================
-- MIGRATION: Add journal_intentions table for AI-generated prompts
-- ============================================================
create table if not exists journal_intentions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  journal_type text not null,
  intention text not null,
  generated_prompts jsonb not null default '{}',
  created_at timestamptz default now(),
  unique(user_id, journal_type)
);

alter table journal_intentions enable row level security;

create policy "Users can read own intentions"
  on journal_intentions for select
  using (auth.uid() = user_id);

create policy "Users can insert own intentions"
  on journal_intentions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own intentions"
  on journal_intentions for update
  using (auth.uid() = user_id);

-- ============================================================
-- MIGRATION: Add weekly_reflections table for AI-generated weekly letters
-- ============================================================
create table if not exists weekly_reflections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  journal_type text not null,
  week_number integer not null,
  reflection_text text not null,
  entries_count integer not null default 0,
  generated_at timestamptz default now(),
  unique(user_id, journal_type, week_number)
);

alter table weekly_reflections enable row level security;

create policy "Users can read own reflections"
  on weekly_reflections for select
  using (auth.uid() = user_id);

create policy "Users can insert own reflections"
  on weekly_reflections for insert
  with check (auth.uid() = user_id);

create policy "Users can update own reflections"
  on weekly_reflections for update
  using (auth.uid() = user_id);
