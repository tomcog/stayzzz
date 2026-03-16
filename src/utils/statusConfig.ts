import { Booking } from '../App';
import { parseLocalDate, getCurrentDatePacific } from './dateUtils';

export interface BookingStatus {
  code: string;
  displayText: string;
  color: string;
}

export interface PoolHeatStatus {
  code: string;
  name: string;
  displayText: string;
  color: string;
}

export const BOOKING_STATUSES: Record<string, BookingStatus> = {
  'guest-upcoming': { code: 'guest-upcoming', displayText: 'Upcoming', color: '#1D4E5C' },
  'guest-tomorrow': { code: 'guest-tomorrow', displayText: 'Tomorrow', color: '#DFB315' },
  'guest-arrive': { code: 'guest-arrive', displayText: 'Check-in today', color: '#F5D347' },
  'guest-current': { code: 'guest-current', displayText: 'Current stay', color: '#1DD1A1' },
  'guest-leave': { code: 'guest-leave', displayText: 'Check-out today', color: 'var(--alert)' },
  'guest-past': { code: 'guest-past', displayText: 'Completed', color: 'var(--inert)' },

  'owner-upcoming': { code: 'owner-upcoming', displayText: 'Owner', color: '#F49867' },
  'owner-tomorrow': { code: 'owner-tomorrow', displayText: 'Tomorrow', color: '#F49867' },
  'owner-arrive': { code: 'owner-arrive', displayText: 'Arrive today', color: '#F49867' },
  'owner-current': { code: 'owner-current', displayText: 'Owner stay', color: '#F49867' },
  'owner-leave': { code: 'owner-leave', displayText: 'Leave today', color: '#F49867' },
  'owner-past': { code: 'owner-past', displayText: 'Complete', color: 'var(--inert)' },

  'service-upcoming': { code: 'service-upcoming', displayText: 'Scheduled', color: '#E8C948' },
  'service-tomorrow': { code: 'service-tomorrow', displayText: 'Tomorrow', color: '#E8C948' },
  'service-today': { code: 'service-today', displayText: 'Today', color: '#E8C948' },
  'service-past': { code: 'service-past', displayText: 'Completed', color: 'var(--inert)' },

  'unresolved-upcoming': { code: 'unresolved-upcoming', displayText: 'Needs attention', color: '#999999' },
  'unresolved-tomorrow': { code: 'unresolved-tomorrow', displayText: 'Tomorrow', color: '#999999' },
  'unresolved-arrive': { code: 'unresolved-arrive', displayText: 'Today', color: '#999999' },
  'unresolved-current': { code: 'unresolved-current', displayText: 'In progress', color: '#999999' },
  'unresolved-leave': { code: 'unresolved-leave', displayText: 'Ends today', color: '#999999' },
  'unresolved-past': { code: 'unresolved-past', displayText: 'Completed', color: 'var(--inert)' },

  'turnover-sameday': { code: 'turnover-sameday', displayText: 'Quick turnover', color: '#EE5A7B' },
};

export const POOL_HEAT_STATUSES: Record<string, PoolHeatStatus> = {
  'not-asked': { code: 'not-asked', name: 'Not asked', displayText: 'Ask at check-in', color: '#6B7280' },
  'undecided': { code: 'undecided', name: 'Asked', displayText: 'Asked', color: '#000000' },
  'declined': { code: 'declined', name: 'Declined', displayText: 'Declined', color: '#C41E3A' },
  'requested': { code: 'requested', name: 'Requested', displayText: 'Requested', color: '#E69714' },
  'paid': { code: 'paid', name: 'Paid', displayText: 'Paid', color: '#2D9D78' },
};

export const getPoolHeatStatus = (code: string): PoolHeatStatus => {
  return POOL_HEAT_STATUSES[code] || POOL_HEAT_STATUSES['not-asked'];
};

export const getBookingStatus = (booking: Booking, allBookings?: Booking[]): BookingStatus => {
  const today = getCurrentDatePacific();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);

  if (booking.stay_type === 'service') {
    const serviceDate = parseLocalDate(booking.start_date);
    serviceDate.setHours(0, 0, 0, 0);

    if (serviceDate.getTime() < today.getTime()) return BOOKING_STATUSES['service-past'];
    else if (serviceDate.getTime() === today.getTime()) return BOOKING_STATUSES['service-today'];
    else if (serviceDate.getTime() === tomorrow.getTime()) return BOOKING_STATUSES['service-tomorrow'];
    else return BOOKING_STATUSES['service-upcoming'];
  }

  const startDate = parseLocalDate(booking.start_date);
  const endDate = parseLocalDate(booking.end_date);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const isCheckInDay = startDate.getTime() === today.getTime();
  const isTomorrow = startDate.getTime() === tomorrow.getTime();
  const isCurrent = today >= startDate && today <= endDate;
  const isPast = today > endDate;
  const isUpcoming = today < startDate;

  const prefix = booking.stay_type === 'unresolved' ? 'unresolved' : booking.stay_type === 'guest' ? 'guest' : 'owner';

  if (allBookings) {
    const hasSameDayCheckout = allBookings.some(b => {
      if (b.id === booking.id) return false;
      const otherEndDate = parseLocalDate(b.end_date);
      otherEndDate.setHours(0, 0, 0, 0);
      return otherEndDate.getTime() === startDate.getTime();
    });

    if (hasSameDayCheckout && today.getTime() <= startDate.getTime()) {
      return BOOKING_STATUSES['turnover-sameday'];
    }
  }

  if (isPast) return BOOKING_STATUSES[`${prefix}-past`];
  else if (isCheckInDay) return BOOKING_STATUSES[`${prefix}-arrive`];
  else if (isCurrent) return BOOKING_STATUSES[`${prefix}-current`];
  else if (isTomorrow) return BOOKING_STATUSES[`${prefix}-tomorrow`];
  else if (isUpcoming) return BOOKING_STATUSES[`${prefix}-upcoming`];

  return BOOKING_STATUSES[`${prefix}-upcoming`];
};
