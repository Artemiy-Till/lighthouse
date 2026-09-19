create table if not exists experience_bookings (
  id uuid primary key default gen_random_uuid(),
  max_user_id text not null,
  experience_id text not null,
  title varchar(120) not null,
  city_id varchar(40) not null,
  image_url text not null,
  meeting_point varchar(240) not null,
  booking_date date not null,
  booking_time time not null,
  participants integer not null check (participants between 1 and 100),
  unit_price_rub integer not null check (unit_price_rub > 0),
  total_price_rub integer not null check (total_price_rub > 0),
  status varchar(20) not null default 'confirmed'
    check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experience_bookings_user_date_idx
  on experience_bookings (max_user_id, booking_date desc, created_at desc);
