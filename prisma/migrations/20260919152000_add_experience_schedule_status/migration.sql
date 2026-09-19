alter table experience_booking_slots
add column if not exists status varchar(20) not null default 'scheduled'
check (status in ('scheduled', 'completed'));
