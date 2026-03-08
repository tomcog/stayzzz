import { Booking } from '../App';
import { BookingCard } from './BookingCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

interface BookingListProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
  onUpdateBooking?: (booking: Booking) => Promise<void>;
}

export function BookingList({ bookings, onBookingClick, onUpdateBooking }: BookingListProps) {
  const upcomingBookings = bookings.filter(b => b.status === 'upcoming');
  const currentBookings = bookings.filter(b => b.status === 'current');
  const completedBookings = bookings.filter(b => b.status === 'completed');

  const sortedUpcoming = [...upcomingBookings].sort((a, b) =>
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  const nextBookingId = sortedUpcoming.length > 0 ? sortedUpcoming[0].id : null;

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No bookings yet. Add your first booking to get started!</p>
      </div>
    );
  }

  return (
    <Accordion type="multiple" defaultValue={['current', 'upcoming']} className="space-y-4">
      {currentBookings.length > 0 && (
        <AccordionItem value="current" className="border-none">
          <AccordionTrigger className="py-0 px-[16px] hover:no-underline">
            <h2 className="mb-0">Current Guest</h2>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 px-[16px] py-[0px]">
              {currentBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} onClick={() => onBookingClick(booking)} allBookings={bookings} onUpdateBooking={onUpdateBooking} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {upcomingBookings.length > 0 && (
        <AccordionItem value="upcoming" className="border-none">
          <AccordionTrigger className="py-0 px-[16px] hover:no-underline">
            <h2 className="mb-0">UPCOMING</h2>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 px-[16px] py-[0px] p-[0px]">
              {sortedUpcoming.map(booking => (
                <BookingCard key={booking.id} booking={booking} onClick={() => onBookingClick(booking)} allBookings={bookings} onUpdateBooking={onUpdateBooking} isNextBooking={booking.id === nextBookingId} />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {completedBookings.length > 0 && (
        <AccordionItem value="past" className="border-none">
          <AccordionTrigger className="py-0 px-[16px] hover:no-underline">
            <h2 className="mb-0">Past</h2>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 px-[16px] pt-3">
              {completedBookings
                .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.checkOut).getTime())
                .map(booking => (
                  <BookingCard key={booking.id} booking={booking} onClick={() => onBookingClick(booking)} allBookings={bookings} onUpdateBooking={onUpdateBooking} />
                ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}
