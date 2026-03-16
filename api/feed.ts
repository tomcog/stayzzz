import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Booking {
  id: string;
  stay_type: string;
  guest_name: string;
  start_date: string;
  end_date: string;
  notes?: string;
  confirmation_code?: string;
  hidden?: boolean;
}

function escapeIcal(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function formatDateValue(dateStr: string): string {
  // Dates are YYYY-MM-DD, output as VALUE=DATE (all-day events)
  return dateStr.replace(/-/g, '');
}

function buildVEvent(booking: Booking): string {
  const summary =
    booking.stay_type === 'guest'
      ? `Guest: ${booking.guest_name}`
      : booking.stay_type === 'owner'
        ? `Owner: ${booking.guest_name}`
        : booking.stay_type === 'service'
          ? `Service: ${booking.guest_name}`
          : booking.guest_name;

  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${booking.id}@stayzzz`,
    `DTSTART;VALUE=DATE:${formatDateValue(booking.start_date)}`,
    `DTEND;VALUE=DATE:${formatDateValue(booking.end_date)}`,
    `SUMMARY:${escapeIcal(summary)}`,
  ];

  const descParts: string[] = [];
  if (booking.confirmation_code) descParts.push(`Confirmation: ${booking.confirmation_code}`);
  if (booking.notes) descParts.push(booking.notes);
  if (descParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeIcal(descParts.join('\n'))}`);
  }

  lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`);
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = `https://tmrbzyrnuzwjrqvflgvb.supabase.co/rest/v1/rentals`;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_2sneomY7ZPB88TkNUoc-ig_QIMpJlYY';

  try {
    const response = await fetch(
      `${supabaseUrl}?hidden=neq.true&select=id,stay_type,guest_name,start_date,end_date,notes,confirmation_code,hidden&order=start_date.asc`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: `Supabase returned ${response.status}` });
    }

    const bookings: Booking[] = await response.json();

    const vevents = bookings.map(buildVEvent).join('\r\n');

    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Stayzzz//Booking Feed//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Stayzzz Bookings',
      'X-WR-TIMEZONE:America/Los_Angeles',
      vevents,
      'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).send(ical);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate calendar feed' });
  }
}
