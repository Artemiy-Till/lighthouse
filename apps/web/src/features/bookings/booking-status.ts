import type { Booking } from '../../api/client';

export function isUpcomingBooking(booking: Booking) {
  return booking.status === 'confirmed';
}
