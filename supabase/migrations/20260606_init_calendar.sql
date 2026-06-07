create extension if not exists pgcrypto;

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  name varchar(50) not null,
  color varchar(20) not null,
  is_preset boolean not null default true,
  created_at timestamp not null default now()
);

create table if not exists calendar_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  title varchar(100) not null,
  note text,
  activity_id uuid references activities(id) on delete set null,
  created_at timestamp not null default now(),
  updated_at timestamp not null default now(),
  unique(entry_date, activity_id)
);

create index if not exists idx_entries_activity_date on calendar_entries(activity_id, entry_date);

insert into activities(name, color, is_preset)
values
  ('运动', '#22c55e', true),
  ('学习', '#3b82f6', true),
  ('阅读', '#f59e0b', true),
  ('旅行', '#ef4444', true)
on conflict do nothing;
