import ICAL from "ical.js";
import { supabase } from "./supabaseClient";

interface RentalEvent {
  airbnb_uid: string;
  guest_name: string | null;
  confirmation_code: string | null;
  phone_last_four: string | null;
  start_date: string;
  end_date: string;
  stay_type: string;
  booking_url: string | null;
  last_synced_at: string;
}

export async function syncAirbnbCalendar(): Promise<{
  inserted: number;
  errors: string[];
}> {
  // 1. Fetch the iCal feed via serverless proxy
  const response = await fetch('/api/ical');

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
    const description: string = String(vevent.getFirstPropertyValue("description") ?? "");

    // Determine if this is a blocked date or a real reservation
    const isBlocked = summary.toUpperCase().includes("NOT AVAILABLE");
    const stayType = isBlocked ? "unresolved" : "guest";

    // Extract reservation URL and confirmation code
    // e.g. "https://www.airbnb.com/hosting/reservations/details/HMTZ8YA4ZC"
    const urlMatch = description.match(/(https:\/\/www\.airbnb\.com\/hosting\/reservations\/details\/\w+)/);
    const bookingUrl = urlMatch ? urlMatch[1] : null;
    const confirmationMatch = description.match(/reservations\/details\/(\w+)/);
    const confirmationCode = confirmationMatch ? confirmationMatch[1] : null;

    // Extract last 4 digits of phone number
    // e.g. "Phone Number (Last 4 Digits): 1925"
    const phoneMatch = description.match(/Phone Number \(Last 4 Digits\):\s*(\d{4})/);
    const phoneLastFour = phoneMatch ? phoneMatch[1] : null;

    return {
      airbnb_uid: event.uid,
      guest_name: isBlocked ? "Not available" : null,
      confirmation_code: confirmationCode,
      phone_last_four: phoneLastFour,
      booking_url: bookingUrl,
      start_date: event.startDate.toJSDate().toISOString().split("T")[0],
      end_date: event.endDate.toJSDate().toISOString().split("T")[0],
      stay_type: stayType,
      last_synced_at: new Date().toISOString(),
    };
  });

  // 3. Upsert into Supabase — updates existing rows, inserts new ones
  const { error } = await supabase.from("rentals").upsert(events, {
    onConflict: "airbnb_uid",
    ignoreDuplicates: false,
  });

  if (error) {
    console.error('Supabase upsert error:', error);
    throw new Error(`Supabase upsert error: ${error.message}`);
  }

  return {
    inserted: events.length,
    errors: [],
  };
}