import type { Booking } from '../App';

const CHECK_IN_HOUR = 14; // 2pm Pacific
const ALERT_WINDOW_HOURS = 72;
const DISMISSED_KEY = 'stayzzz_dismissed_alerts';
const KNOWN_BOOKINGS_KEY = 'stayzzz_known_bookings';

interface KnownBooking {
  id: string;
  guest_name: string;
  start_date: string;
  end_date: string;
}

export interface AppAlert {
  id: string;
  message: string;
  type: 'warning' | 'info';
}

function getNowPacific() {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  );
}

function getTodayPacific() {
  const now = getNowPacific();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getDismissedAlerts(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

export function dismissAlert(alertId: string) {
  const dismissed = getDismissedAlerts();
  dismissed.add(alertId);
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed]));
}

export function getAppAlerts(bookings: Booking[]): AppAlert[] {
  const dismissed = getDismissedAlerts();
  const alerts: AppAlert[] = [];

  const nowPacific = getNowPacific();
  const today = getTodayPacific();
  const tomorrow = new Date(nowPacific);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowPacific = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  for (const booking of bookings) {
    if (booking.stay_type !== 'guest') continue;

    // Pool heat alert: within 72h of check-in, pool heat unresolved
    if (booking.pool_heat === 'not-asked' || booking.pool_heat === 'undecided') {
      const [year, month, day] = booking.start_date.split('-').map(Number);
      const checkInTime = new Date(year, month - 1, day, CHECK_IN_HOUR, 0, 0);
      const hoursUntilCheckIn =
        (checkInTime.getTime() - nowPacific.getTime()) / (1000 * 60 * 60);

      if (hoursUntilCheckIn > 0 && hoursUntilCheckIn <= ALERT_WINDOW_HOURS) {
        const id = `pool-heat-${booking.id}`;
        if (!dismissed.has(id)) {
          const name = booking.guest_name || 'A guest';
          alerts.push({
            id,
            message: `${name} is arriving soon and has not added or declined pool heat.`,
            type: 'warning',
          });
        }
      }
    }

    // Arriving tomorrow alert
    if (booking.start_date === tomorrowPacific) {
      const id = `arriving-${booking.id}-${tomorrowPacific}`;
      if (!dismissed.has(id)) {
        const name = booking.guest_name || 'A guest';
        const nights = Math.ceil(
          (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)
        );
        alerts.push({
          id,
          message: `${name} arrives tomorrow for ${nights} ${nights === 1 ? 'night' : 'nights'}.`,
          type: 'info',
        });
      }
    }

    // Checkout alert: end_date is today
    if (booking.end_date === today) {
      const id = `checkout-${booking.id}-${today}`;
      if (!dismissed.has(id)) {
        const name = booking.guest_name || 'A guest';
        alerts.push({
          id,
          message: `${name} is checking out today.`,
          type: 'info',
        });
      }
    }
  }

  // New / cancelled booking detection
  const currentGuests = bookings.filter(b => b.stay_type === 'guest' && b.end_date >= today);
  const currentIds = new Set(currentGuests.map(b => b.id));

  let knownBookings: KnownBooking[] = [];
  try {
    const stored = localStorage.getItem(KNOWN_BOOKINGS_KEY);
    if (stored) knownBookings = JSON.parse(stored);
  } catch { /* ignore */ }

  const knownIds = new Set(knownBookings.map(b => b.id));

  // Only show new/cancelled alerts if we had a previous snapshot
  if (knownBookings.length > 0) {
    // New reservations
    for (const booking of currentGuests) {
      if (!knownIds.has(booking.id)) {
        const id = `new-booking-${booking.id}`;
        if (!dismissed.has(id)) {
          const name = booking.guest_name || 'A guest';
          const nights = Math.ceil(
            (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)
          );
          alerts.push({
            id,
            message: `New reservation: ${name}, ${nights} ${nights === 1 ? 'night' : 'nights'} starting ${booking.start_date}.`,
            type: 'info',
          });
        }
      }
    }

    // Cancellations
    for (const known of knownBookings) {
      if (!currentIds.has(known.id) && known.end_date >= today) {
        const id = `cancelled-booking-${known.id}`;
        if (!dismissed.has(id)) {
          alerts.push({
            id,
            message: `Cancelled: ${known.guest_name}'s reservation (${known.start_date} – ${known.end_date}) is no longer on the calendar.`,
            type: 'warning',
          });
        }
      }
    }
  }

  // Save current snapshot for next launch
  localStorage.setItem(KNOWN_BOOKINGS_KEY, JSON.stringify(
    currentGuests.map(b => ({ id: b.id, guest_name: b.guest_name, start_date: b.start_date, end_date: b.end_date }))
  ));

  return alerts;
}
