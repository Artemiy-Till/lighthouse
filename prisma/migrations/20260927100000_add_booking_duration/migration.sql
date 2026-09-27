alter table experience_bookings
  add column if not exists duration_minutes integer not null default 120;
