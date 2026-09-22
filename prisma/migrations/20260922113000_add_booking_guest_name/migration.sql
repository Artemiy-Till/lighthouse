alter table experience_bookings
  add column if not exists guest_name varchar(160);
