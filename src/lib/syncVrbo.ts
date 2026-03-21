import ICAL from "ical.js";
import { supabase } from "./supabaseClient";

interface RentalEvent {
  airbnb_uid: string;
  guest_name: string | null;
  stay_type: string;
  start_date: string;
  end_date: string;
  last_synced_at: string;
}

export async function syncVrboCalendar(): Promise<{
  inserted: number;
  errors: string[];
  feedUids: string[];
}> {
  const response = await fetch('/api/vrbo-ical');

  if (!response.ok) {
    throw new Error(`Failed to fetch VRBO iCal feed: ${response.statusText}`);
  }

  const icsText = await response.text();

  const jcalData = ICAL.parse(icsText);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const events: RentalEvent[] = vevents
    .map((vevent) => {
      const event = new ICAL.Event(vevent);
      const summary: string = event.summary ?? "";
      const endDate = event.endDate.toJSDate();

      // Skip past events
      if (endDate <= today) return null;

      // "Reserved - FirstName" → guest booking
      // "Blocked" → unresolved (owner hold or manual block)
      const reservedMatch = summary.match(/^Reserved\s*-\s*(.+)$/i);
      const isReservation = !!reservedMatch;
      const guestName: string | null = reservedMatch ? reservedMatch[1].trim() : null;

      return {
        airbnb_uid: event.uid,
        guest_name: guestName,
        stay_type: isReservation ? "guest" : "unresolved",
        start_date: event.startDate.toJSDate().toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        last_synced_at: new Date().toISOString(),
      } satisfies RentalEvent;
    })
    .filter((e): e is RentalEvent => e !== null);

  if (events.length === 0) {
    return { inserted: 0, errors: [], feedUids: [] };
  }

  // Detect new vs existing to preserve manually-set stay_type
  const incomingUids = events.map(e => e.airbnb_uid);
  const { data: existing, error: existingError } = await supabase
    .from("rentals")
    .select("airbnb_uid")
    .in("airbnb_uid", incomingUids);

  if (existingError) throw new Error(`Failed to fetch existing VRBO records: ${existingError.message}`);

  const existingUids = new Set((existing ?? []).map(r => r.airbnb_uid));
  const newEvents = events.filter(e => !existingUids.has(e.airbnb_uid));
  const existingEvents = events.filter(e => existingUids.has(e.airbnb_uid));

  // Insert new records with stay_type and guest_name
  if (newEvents.length > 0) {
    const { error } = await supabase.from("rentals").upsert(newEvents, {
      onConflict: "airbnb_uid",
      ignoreDuplicates: false,
    });
    if (error) throw new Error(`VRBO insert error: ${error.message}`);
  }

  // Update existing records — only touch sync-safe fields, never stay_type or guest_name
  for (const event of existingEvents) {
    const { error } = await supabase
      .from("rentals")
      .update({
        start_date: event.start_date,
        end_date: event.end_date,
        last_synced_at: event.last_synced_at,
      })
      .eq("airbnb_uid", event.airbnb_uid);
    if (error) console.error(`Failed to update VRBO ${event.airbnb_uid}:`, error.message);
  }

  return { inserted: newEvents.length, errors: [], feedUids: incomingUids };
}
