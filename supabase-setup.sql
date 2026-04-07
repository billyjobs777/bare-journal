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
