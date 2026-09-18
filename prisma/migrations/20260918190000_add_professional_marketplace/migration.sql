create extension if not exists pgcrypto;

create table if not exists guide_profiles (
  id uuid primary key default gen_random_uuid(),
  max_user_id text not null unique,
  display_name varchar(80) not null,
  bio varchar(1000) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists published_experiences (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references guide_profiles(id) on delete cascade,
  city_id varchar(40) not null,
  category varchar(40) not null,
  title varchar(120) not null,
  intro varchar(240) not null,
  description varchar(3000) not null,
  duration_minutes integer not null check (duration_minutes between 30 and 720),
  format varchar(80) not null,
  group_size integer not null check (group_size between 1 and 100),
  children_policy varchar(160) not null,
  meeting_point varchar(240) not null,
  price_rub integer not null check (price_rub between 100 and 1000000),
  status varchar(20) not null default 'published' check (status in ('published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists published_experiences_city_status_created_idx
  on published_experiences (city_id, status, created_at desc);
