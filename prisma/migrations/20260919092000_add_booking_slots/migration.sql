create table if not exists experience_booking_slots (
  experience_id text not null,
  booking_date date not null,
  booking_time time not null,
  capacity integer not null check (capacity between 1 and 100),
  booked integer not null default 0 check (booked >= 0),
  primary key (experience_id, booking_date, booking_time)
);
