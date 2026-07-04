-- Multi-user migration: adds user_id, RLS, drops old global presets
-- Since this is a fresh start (no data migration needed), drop and recreate.

drop table if exists calendar_entries;
drop table if exists activities;

create extension if not exists pgcrypto;

create table activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name varchar(50) not null,
  color varchar(20) not null,
  is_preset boolean not null default false,
  created_at timestamptz not null default now()
);

create table calendar_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_date date not null,
  title varchar(100) not null,
  note text,
  activity_id uuid references activities(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, entry_date, activity_id)
);

create index idx_activities_user on activities(user_id);
create index idx_entries_user_date on calendar_entries(user_id, entry_date);
create index idx_entries_activity_date on calendar_entries(activity_id, entry_date);

-- Enable Row Level Security
alter table activities enable row level security;
alter table calendar_entries enable row level security;

-- RLS policies for activities
create policy "Users can view own activities" on activities
  for select using (auth.uid() = user_id);
create policy "Users can insert own activities" on activities
  for insert with check (auth.uid() = user_id);
create policy "Users can update own activities" on activities
  for update using (auth.uid() = user_id);
create policy "Users can delete own activities" on activities
  for delete using (auth.uid() = user_id);

-- RLS policies for calendar_entries
create policy "Users can view own entries" on calendar_entries
  for select using (auth.uid() = user_id);
create policy "Users can insert own entries" on calendar_entries
  for insert with check (auth.uid() = user_id);
create policy "Users can update own entries" on calendar_entries
  for update using (auth.uid() = user_id);
create policy "Users can delete own entries" on calendar_entries
  for delete using (auth.uid() = user_id);

-- Auto-create preset activities for new users
create or replace function public.create_preset_activities()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activities (user_id, name, color, is_preset)
  values
    (new.id, '俯卧撑', '#22c55e', true),
    (new.id, '引体向上', '#3b82f6', true),
    (new.id, '深蹲', '#f59e0b', true),
    (new.id, '爬行', '#ef4444', true);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.create_preset_activities();

-- Allow a user to delete their own account (cascades to activities + entries)
create or replace function public.delete_own_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;
