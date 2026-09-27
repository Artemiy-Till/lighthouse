import type { Booking } from '../../api/client';

export function isUpcomingBooking(booking: Booking) {
  const startsAt = new Date(`${booking.date}T${booking.time}:00`).getTime();
  return booking.status === 'confirmed' && startsAt > Date.now();
}
