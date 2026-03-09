import { Flame, Phone } from 'lucide-react';
import { useState } from 'react';
import { Booking } from '../App';
import { parseLocalDate, getCurrentDatePacific } from '../utils/dateUtils';
import { formatPhoneNumber } from '../utils/formatters';
import { getBookingStatus, getPoolHeatStatus, POOL_HEAT_STATUSES, BOOKING_STATUSES } from '../utils/statusConfig';
import { ContactMenu } from './ContactMenu';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface CardBookingProps {
  booking: Booking;
  onClick: () => void;
  allBookings?: Booking[];
  onUpdateBooking?: (booking: Booking) => Promise<void>;
  isNextBooking?: boolean;
}

function CardTrim({ booking, allBookings, isNextBooking }: { booking: Booking; allBookings?: Booking[]; isNextBooking?: boolean }) {
  const status = getBookingStatus(booking, allBookings);

  let displayText = status.displayText;
  if (isNextBooking && status.code.includes('upcoming')) {
    const today = getCurrentDatePacific();
    today.setHours(0, 0, 0, 0);
    let targetDate: Date;
    if (booking.stay_type === 'service' && booking.start_date) {
      targetDate = new Date(booking.start_date);
    } else {
      targetDate = parseLocalDate(booking.start_date);
    }
    targetDate.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    displayText = booking.stay_type === 'service'
      ? `Scheduled in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`
      : `Begins in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`;
  }

  let backgroundStyle: React.CSSProperties = { backgroundColor: status.color };
  if (status.code === 'guest-arrive') {
    backgroundStyle = { background: `linear-gradient(to right, ${BOOKING_STATUSES['guest-upcoming'].color}, ${BOOKING_STATUSES['guest-current'].color})` };
  } else if (status.code === 'guest-tomorrow') {
    backgroundStyle = { background: `linear-gradient(to right, ${BOOKING_STATUSES['guest-tomorrow'].color}, ${BOOKING_STATUSES['guest-current'].color})` };
  } else if (status.code === 'turnover-sameday' && booking.stay_type === 'owner') {
    backgroundStyle = { background: `linear-gradient(to right, #F49867, #EE5A7B)` };
  }

  return (
    <div
      className="absolute box-border content-stretch flex font-bold items-center justify-between leading-[25.714px] left-0 overflow-clip px-[16px] py-[8px] text-[18px] text-nowrap text-white top-0 tracking-[-0.4395px] w-full whitespace-pre"
      style={backgroundStyle}
      data-name="card-trim"
    >
      <p className="guest_name-card relative shrink-0 text-[20px]">
        {booking.stay_type === 'owner' ? `${booking.guest_name} blocked` : booking.stay_type === 'unresolved' ? 'Not available' : booking.guest_name}
      </p>
      <p className="status-card relative shrink-0 uppercase">{displayText}</p>
    </div>
  );
}

export function CardBooking({ booking, onClick, allBookings, onUpdateBooking, isNextBooking }: CardBookingProps) {
  const bookingStatus = getBookingStatus(booking, allBookings);
  const [isPoolHeatDialogOpen, setIsPoolHeatDialogOpen] = useState(false);
  const [selectedPoolHeat, setSelectedPoolHeat] = useState<string>(booking.pool_heat || 'not-asked');

  const formatDate = (dateString: string, includeYear: boolean) => {
    const date = parseLocalDate(dateString);
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    if (includeYear) options.year = 'numeric';
    return date.toLocaleDateString('en-US', options);
  };

  const formatServiceDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short', month: 'short', day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    return { date: date.toLocaleDateString('en-US', dateOptions), time: date.toLocaleTimeString('en-US', timeOptions) };
  };

  const shouldShowYear = (dateString: string) => parseLocalDate(dateString).getFullYear() !== new Date().getFullYear();

  const calculateNights = () => {
    const checkIn = parseLocalDate(booking.start_date);
    const checkOut = parseLocalDate(booking.end_date);
    return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateNightsLeft = () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const checkOut = parseLocalDate(booking.end_date); checkOut.setHours(0, 0, 0, 0);
    return Math.max(0, Math.ceil((checkOut.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const isStayInProgress = () =>
    ['guest-arrive', 'guest-current', 'guest-leave', 'owner-arrive', 'owner-current', 'owner-leave'].includes(bookingStatus.code);

  const handlePoolHeatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPoolHeat(booking.pool_heat || 'not-asked');
    setIsPoolHeatDialogOpen(true);
  };

  const handlePoolHeatUpdate = async () => {
    if (onUpdateBooking && selectedPoolHeat !== booking.pool_heat) {
      const updatedBooking = { ...booking, pool_heat: selectedPoolHeat as Booking['pool_heat'] };
      try { await onUpdateBooking(updatedBooking); } catch (error) { console.error('Failed to update pool heat status:', error); }
    }
    setIsPoolHeatDialogOpen(false);
  };

  const isCompleted = bookingStatus.code === 'guest-past' || bookingStatus.code === 'owner-past';

  return (
    <div
      className="overflow-clip relative rounded-[8px] w-full cursor-pointer transition-shadow"
      style={{ boxShadow: '0 4px 16px 0 rgba(0, 0, 0, 0.16)', backgroundColor: isCompleted ? '#cccccc' : '#ffffff' }}
      data-name="card-booking"
      onClick={onClick}
    >
      <CardTrim booking={booking} allBookings={allBookings} isNextBooking={isNextBooking} />

      <div className="pt-[50px] px-[16px] pb-[12px] my-[16px] mx-[0px]">
        <div className="my-[8px] mx-[0px] m-[0px] py-[4px] p-[0px] text-center text-[16px] font-bold">
          {booking.stay_type === 'service' && booking.start_date ? (
            <>
              <div>
                <span className="card-date text-black font-bold text-[22px]">{formatServiceDateTime(booking.start_date).date}</span>
                <span className="card-date text-gray-500"> at </span>
                <span className="card-date text-black">{formatServiceDateTime(booking.start_date).time}</span>
              </div>
              {booking.notes && <div className="text-[18px] font-medium text-gray-700 mt-1">{booking.notes}</div>}
            </>
          ) : (
            <>
              <span className="card-date text-black font-bold text-[22px]">{formatDate(booking.start_date, shouldShowYear(booking.start_date))}</span>
              <span className="card-date text-gray-500"> – </span>
              <span className="card-date text-black">{formatDate(booking.end_date, shouldShowYear(booking.end_date))}</span>
            </>
          )}
        </div>

        {booking.phone_number ? (
          <ContactMenu phoneNumber={booking.phone_number} name={booking.guest_name}>
            <div className="mx-[0px] my-[8px] px-[0px] py-[8px] flex items-center justify-center gap-2 cursor-pointer">
              <button className="h-[44px] w-[44px] rounded-full shadow-lg bg-cta hover:bg-cta/90 flex items-center justify-center transition-colors" aria-label="Contact guest">
                <Phone className="w-5 h-5 text-white" />
              </button>
              <span className="text-cta hover:underline font-medium text-[18px] text-left">{formatPhoneNumber(booking.phone_number)}</span>
            </div>
          </ContactMenu>
        ) : booking.stay_type === 'guest' && (
          <div className="mx-[0px] my-[8px] px-[0px] py-[8px] flex items-center justify-center gap-2">
            <div className="h-[44px] w-[44px] rounded-full shadow-lg flex items-center justify-center" style={{ backgroundColor: '#ee5a7b' }}>
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="font-medium text-[18px]" style={{ color: '#ee5a7b' }}>MISSING</span>
          </div>
        )}


        <div className="flex justify-between items-center pt-[8px] mt-[8px]">
          {booking.stay_type !== 'service' && (
            <span className="card-small text-gray-600 text-[15px]">
              {isStayInProgress()
                ? `${calculateNightsLeft()} ${calculateNightsLeft() === 1 ? 'night' : 'nights'} left`
                : `${calculateNights()} ${calculateNights() === 1 ? 'night' : 'nights'}`}
            </span>
          )}
          {booking.stay_type === 'guest' && booking.pool_heat && (
            <div className="flex items-center gap-1 text-gray-600">
              <span className="card-small text-[16px]">Pool heat</span>
              <Flame className="w-4 h-4" style={{ color: getPoolHeatStatus(booking.pool_heat).color }} />
              <span className="card-small cursor-pointer hover:opacity-70 transition-opacity text-[16px]"
                style={{ color: getPoolHeatStatus(booking.pool_heat).color }}
                onClick={handlePoolHeatClick}>
                {getPoolHeatStatus(booking.pool_heat).displayText}
              </span>
            </div>
          )}
        </div>

        {booking.notes && (
          <div className="mt-2 pt-2 border-t border-gray-200 text-sm text-gray-600">{booking.notes}</div>
        )}
      </div>

      <Dialog open={isPoolHeatDialogOpen} onOpenChange={setIsPoolHeatDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Pool Heat Status</DialogTitle>
            <DialogDescription>Update the pool heat status for this booking.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={selectedPoolHeat} onValueChange={setSelectedPoolHeat}>
              {Object.values(POOL_HEAT_STATUSES).map((status) => (
                <div key={status.code} className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value={status.code} id={`pool-heat-${status.code}`} />
                  <Label htmlFor={`pool-heat-${status.code}`} className="cursor-pointer flex items-center gap-2">
                    <Flame className="w-4 h-4" style={{ color: status.color }} />
                    <span style={{ color: status.color }}>{status.name}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setIsPoolHeatDialogOpen(false)} className="px-4 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50">Cancel</button>
            <button onClick={handlePoolHeatUpdate} className="px-4 py-2 text-sm rounded-md bg-cta text-cta-foreground hover:bg-cta/90">Update</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
