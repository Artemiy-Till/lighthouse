create table if not exists experience_tour_chats (
  id uuid primary key default gen_random_uuid(),
  experience_id text not null,
  booking_date date not null,
  booking_time time not null,
  title varchar(200) not null,
  guide_max_user_id text not null,
  status varchar(20) not null default 'pending'
    check (status in ('pending', 'active')),
  chat_id bigint unique,
  invite_link text,
  guide_notified_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experience_tour_chats_slot_key
    unique (experience_id, booking_date, booking_time)
);
