import { Booking } from '../App';
import { CardBooking } from './card-booking';

interface BookingCardProps {
  booking: Booking;
  onClick: () => void;
  allBookings?: Booking[];
  onUpdateBooking?: (booking: Booking) => Promise<void>;
  isNextBooking?: boolean;
}

export function BookingCard({ booking, onClick, allBookings, onUpdateBooking, isNextBooking }: BookingCardProps) {
  return (
    <CardBooking booking={booking} onClick={onClick} allBookings={allBookings} onUpdateBooking={onUpdateBooking} isNextBooking={isNextBooking} />
  );
}
