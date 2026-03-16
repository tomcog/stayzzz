import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Booking } from '../App';
import { parseLocalDate } from '../utils/dateUtils';
import { getBookingStatus, BOOKING_STATUSES } from '../utils/statusConfig';

interface CalendarViewProps {
  bookings: Booking[];
  onBookingClick: (booking: Booking) => void;
}

export function CalendarView({ bookings, onBookingClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getFirstName = (fullName: string) => fullName.trim().split(' ')[0];
  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return (day + 6) % 7; // shift so Monday = 0
  };

  const isDateInRange = (day: number, booking: Booking) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const checkIn = parseLocalDate(booking.start_date);
    const checkOut = parseLocalDate(booking.end_date);
    date.setHours(0, 0, 0, 0); checkIn.setHours(0, 0, 0, 0); checkOut.setHours(0, 0, 0, 0);
    return date >= checkIn && date < checkOut;
  };

  const isCheckoutDay = (day: number, booking: Booking) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const checkOut = parseLocalDate(booking.end_date);
    date.setHours(0, 0, 0, 0); checkOut.setHours(0, 0, 0, 0);
    return date.getTime() === checkOut.getTime();
  };

  const isCheckinDay = (day: number, booking: Booking) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const checkIn = parseLocalDate(booking.start_date);
    date.setHours(0, 0, 0, 0); checkIn.setHours(0, 0, 0, 0);
    return date.getTime() === checkIn.getTime();
  };

  const getBookingForDay = (day: number) => bookings.find(b => isDateInRange(day, b));
  const getCheckoutBookingForDay = (day: number) => bookings.find(b => isCheckoutDay(day, b));

  const renderCalendar = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const firstDay = firstDayOfMonth(currentDate);

    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="aspect-square" />);

    for (let day = 1; day <= totalDays; day++) {
      const booking = getBookingForDay(day);
      const checkoutBooking = getCheckoutBookingForDay(day);
      const isToday =
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div
          key={day}
          className={`aspect-square p-1 border border-gray-200 ${isToday ? 'bg-[var(--success)]' : ''}`}
        >
          <div className="h-full flex flex-col">
            <span className="text-center mb-1" style={isToday ? { color: 'white' } : undefined}>{day}</span>
            {booking && (() => {
              const status = getBookingStatus(booking, bookings);
              const isCheckIn = isCheckinDay(day, booking);
              let displayColor = status.color;

              if (status.code === 'guest-arrive') displayColor = BOOKING_STATUSES['guest-current'].color;
              if (status.code === 'turnover-sameday' && !isCheckIn) displayColor = booking.stay_type === 'owner' ? '#F49867' : '#1D4E5C';

              if (isCheckIn) {
                return (
                  <button onClick={() => onBookingClick(booking)} className="flex-1 p-1 rounded text-white relative overflow-hidden flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, transparent 0%, transparent 50%, ${displayColor} 50%, ${displayColor} 100%)`, fontSize: '14px' }}>
                    <span className="relative z-10" style={{ textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                      {booking.stay_type === 'owner' ? 'Owner' : booking.stay_type === 'unresolved' ? 'N/A' : getFirstName(booking.guest_name)}
                    </span>
                  </button>
                );
              }
              return (
                <button onClick={() => onBookingClick(booking)} className="flex-1 p-1 rounded text-white flex items-center justify-center"
                  style={{ backgroundColor: displayColor, fontSize: '14px' }}>
                  {booking.stay_type === 'owner' ? 'Owner' : booking.stay_type === 'unresolved' ? 'N/A' : getFirstName(booking.guest_name)}
                </button>
              );
            })()}
            {!booking && checkoutBooking && (() => {
              const status = getBookingStatus(checkoutBooking, bookings);
              let displayColor = status.color;
              if (status.code === 'turnover-sameday') displayColor = checkoutBooking.stay_type === 'owner' ? '#F49867' : '#1D4E5C';
              return (
                <button onClick={() => onBookingClick(checkoutBooking)} className="flex-1 p-1 rounded text-white relative overflow-hidden flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${displayColor} 0%, ${displayColor} 50%, transparent 50%, transparent 100%)`, fontSize: '14px' }}>
                  <span className="relative z-10" style={{ textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                    {checkoutBooking.stay_type === 'owner' ? 'Owner' : checkoutBooking.stay_type === 'unresolved' ? 'N/A' : getFirstName(checkoutBooking.guest_name)}
                  </span>
                </button>
              );
            })()}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} variant="outline" size="sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
          <Button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} variant="outline" size="sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-center text-gray-600 py-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
      </Card>

      <div className="flex gap-4 justify-center flex-wrap">
        {[
          { color: '#1D4E5C', label: 'Upcoming' },
          { color: '#1DD1A1', label: 'Current' },
          { color: '#F49867', label: 'Owner' },
          { color: '#E8C948', label: 'Service' },
          { color: '#EE5A7B', label: 'Quick turnover' },
          { color: 'var(--inert)', label: 'Past' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
