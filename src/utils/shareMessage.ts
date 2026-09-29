import type { Booking } from '../App';
import { toast } from 'sonner';
import { parseLocalDate } from './dateUtils';

export const SMS_RECIPIENTS = '4157864282,4422184858,7609698962';

// sms: links only open Messages on a phone; desktop browsers silently ignore them,
// so fall back to copying the message there.
export async function sendShareMessage(bookings: Booking[]) {
  const body = buildShareMessage(bookings);
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    window.location.href = `sms:/open?addresses=${SMS_RECIPIENTS}&body=${encodeURIComponent(body)}`;
    return;
  }
  try {
    await navigator.clipboard.writeText(body);
    toast.success('Message copied — texting only works from your phone');
  } catch {
    toast.error('Texting only works from your phone');
  }
}

function formatStartDate(dateStr: string) {
  const d = parseLocalDate(dateStr);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${weekday} ${monthDay}`;
}

function formatEndDate(dateStr: string) {
  return parseLocalDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatGuestInfo(b: Booking) {
  return `${b.guest_name}${b.phone_number ? ` ${b.phone_number}` : ''} staying ${formatStartDate(b.start_date)} to ${formatEndDate(b.end_date)}`;
}

export function buildShareMessage(bookings: Booking[]): string {
  const upcoming = bookings
    .filter(b => b.status === 'upcoming' && b.stay_type === 'guest' && !b.hidden)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));

  let body = '';
  if (upcoming.length === 0) {
    body = 'No upcoming guests scheduled.';
  } else if (upcoming.length === 1) {
    body = `Next guest at 1935 E. Andreas is ${formatGuestInfo(upcoming[0])}.`;
  } else {
    body = `Next guest at 1935 E. Andreas is ${formatGuestInfo(upcoming[0])}, followed by ${formatGuestInfo(upcoming[1])}.`;
  }
  body += ' Latest info at https://stayzzz.vercel.app';

  return body;
}
