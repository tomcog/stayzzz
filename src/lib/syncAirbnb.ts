import ICAL from "ical.js";
import { supabase } from "https://bztecpeddbxzyezpfxvb.supabase.co"; // adjust path to your client

const AIRBNB_ICAL_URL = import.meta.env.VITE_AIRBNB_ICAL_URL;

interface RentalEvent {
  airbnb_uid: string;
  guest_name: string | null;
  start_date: string;
  end_date: string;
  status: string;
  last_synced_at: string;
}

export async function syncAirbnbCalendar(): Promise<{
  inserted: number;
  updated: number;
  errors: string[];
}> {
  // 1. Fetch the iCal feed via a CORS proxy (needed in the browser)
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(AIRBNB_ICAL_URL)}`;
  const response = await fetch(proxyUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch iCal feed: ${response.statusText}`);
  }

  const icsText = await response.text();

  // 2. Parse the iCal data
  const jcalData = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  const events: RentalEvent[] = vevents.map((vevent) => {
    const event = new ICAL.Event(vevent);
    const summary: string = event.summary ?? "";

    // Airbnb puts "BLOCKED" for blocked dates, or "Guest Name (CONFIRMED)" for bookings
    const isBlocked =
      summary.toUpperCase().includes("BLOCKED") ||
      summary.toUpperCase().includes("AIRBNB (NOT AVAILABLE)");

    const guestName = isBlocked ? null : summary.replace(/\s*\(.*?\)\s*$/, "").trim() || null;
    const status = isBlocked ? "blocked" : "confirmed";

    return {
      airbnb_uid: event.uid,
      guest_name: guestName,
      start_date: event.startDate.toJSDate().toISOString().split("T")[0],
      end_date: event.endDate.toJSDate().toISOString().split("T")[0],
      status,
      last_synced_at: new Date().toISOString(),
    };
  });

  // 3. Upsert into Supabase
  const { error } = await supabase.from("rentals").upsert(events, {
    onConflict: "airbnb_uid",
    ignoreDuplicates: false, // update existing rows
  });

  if (error) throw new Error(`Supabase upsert error: ${error.message}`);

  return {
    inserted: events.length,
    updated: 0, // Supabase doesn't split these out easily
    errors: [],
  };
}
```

---

## Step 5: Add your iCal URL to environment variables

In your `.env` file (create it if it doesn't exist):
```
VITE_AIRBNB_ICAL_URL=https://www.airbnb.com/calendar/ical/YOUR_ID.ics?s=YOUR_SECRET