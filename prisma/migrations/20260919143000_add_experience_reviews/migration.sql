create table if not exists experience_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references experience_bookings(id) on delete cascade,
  max_user_id text not null,
  experience_id text not null,
  author_name varchar(160) not null,
  author_photo_url text,
  rating integer not null check (rating between 1 and 5),
  comment varchar(1000) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists experience_reviews_experience_created_idx
  on experience_reviews (experience_id, created_at desc);
