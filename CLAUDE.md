# Stayzzz

Booking management PWA for "Andreas Palms" vacation rental property.

## Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Vite
- **UI**: shadcn/ui (Radix primitives) + Lucide icons
- **Backend**: Supabase (direct REST API calls, no auth — public anon key)
- **API routes**: Vercel serverless functions in `api/` (iCal feed endpoints)
- **PWA**: vite-plugin-pwa with standalone display mode
- **Calendar sync**: Airbnb + VRBO iCal imports via proxy

## Project Structure

```
src/
  App.tsx              # Main app component, all state management
  main.tsx             # Entry point
  components/
    ui/                # shadcn/ui primitives
    BookingList.tsx     # List view of bookings
    CalendarView.tsx    # Calendar view
    BookingCard.tsx     # Individual booking card
    BookingDetailsSheet.tsx  # Booking detail/edit sheet
    AddBookingDialog.tsx     # New booking form
    AlertsModal.tsx     # App alerts on load
    ContactMenu.tsx     # Contact actions
    ProviderAutocomplete.tsx # Service provider search
  lib/
    supabaseClient.ts   # Supabase client instance
    syncAirbnb.ts       # Airbnb iCal sync logic
    syncVrbo.ts         # VRBO iCal sync logic
    appAlerts.ts        # Alert generation logic
  utils/
    dateUtils.ts        # Date helpers, status calculation
    formatters.ts       # Display formatters
    shareMessage.ts     # SMS share message builder
    statusConfig.ts     # Booking status configuration
    googlePlaces.ts     # Google Places integration
    supabase/
      client.ts         # Alternate Supabase client
      info.ts           # Project ID and anon key
api/
  ical.ts              # iCal proxy endpoint
  feed.ts              # iCal feed endpoint
```

## Key Concepts

- **Booking types**: `guest`, `owner`, `service`, `unresolved`
- **Booking statuses**: `upcoming`, `current`, `completed` (computed from dates)
- **Pool heat tracking**: `not-asked`, `undecided`, `declined`, `requested`, `paid`
- **Supabase table**: `rentals` — all bookings stored here
- **iCal sync**: Bookings auto-sync from Airbnb/VRBO on app load and manual refresh
- **Hidden bookings**: Soft-delete via `hidden` flag, filtered from queries

## Development

```bash
npm run dev      # Vite dev server on port 5171
npm run build    # TypeScript check + Vite build
npm run preview  # Preview production build
```

## Environment Variables

- `VITE_AIRBNB_ICAL_URL` — Airbnb iCal calendar URL
- `VITE_VRBO_ICAL_URL` — VRBO iCal calendar URL

## Conventions

- Direct Supabase REST API calls (no ORM, no supabase-js query builder in App.tsx)
- All dates in `YYYY-MM-DD` format, Pacific timezone for display
- Path alias: `@/` maps to `src/`
- Tailwind v4 (CSS-based config, no tailwind.config.js)
