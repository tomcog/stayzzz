# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stayzzz

Booking management PWA for the "Andreas Palms" vacation rental property.

## Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 + Vite, shadcn/ui (Radix) + Lucide
- **Backend**: Supabase (no auth — public anon key, single `rentals` table)
- **API routes**: Vercel serverless functions in `api/` (iCal proxy + outbound feed)
- **PWA**: vite-plugin-pwa, standalone display
- **Calendar sync**: Airbnb + VRBO iCal imports

## Commands

```bash
npm run dev      # Vite dev server (port from ../ports.json, currently 5171)
npm run build    # tsc -b && vite build — the only correctness gate (no tests, no lint)
npm run preview  # Preview production build
```

## Architecture

**State lives in `App.tsx`.** Bookings are loaded once, mutated via direct REST calls, and re-fetched. Child components are presentational + receive callbacks.

**Two Supabase access patterns coexist — pick the one that matches the file you're in:**
- `App.tsx` and other UI code: raw `fetch` against `https://${projectId}.supabase.co/rest/v1`, headers built from `utils/supabase/info.ts` (`projectId`, `publicAnonKey`). No supabase-js query builder.
- `lib/syncAirbnb.ts`, `lib/syncVrbo.ts`: the `supabase-js` client from `lib/supabaseClient.ts`.

**iCal flows in two directions — don't confuse them:**
- **Inbound** (`api/ical.ts` + `lib/syncAirbnb.ts`, plus VRBO equivalents): serverless proxy fetches the Airbnb/VRBO feed; `syncAirbnbCalendar` parses with `ical.js` and upserts into `rentals`. In dev, Vite proxies `/api/ical` directly to Airbnb (see `vite.config.ts`) — so the serverless function is only exercised in prod.
- **Outbound** (`api/feed.ts`): publishes a `text/calendar` feed of all non-hidden rentals for Apple Calendar / Google Calendar subscription. Implements RFC 5545 line folding at 75 octets — Apple Calendar rejects unfolded feeds. If you change the feed, preserve the `foldLine` pass.

**Sync invariant (`syncAirbnb.ts`):** for *existing* `airbnb_uid` rows, only sync-safe fields are touched (`start_date`, `end_date`, `confirmation_code`, `phone_last_four`, `booking_url`, `last_synced_at`). `stay_type` and `guest_name` are **never** overwritten — they may have been manually edited. New rows get the full payload including `stay_type`.

**Alerts** (`lib/appAlerts.ts`) compare the current bookings against the latest iCal feed UIDs to surface check-in reminders and "disappeared booking" warnings. Dismissal state and known-booking snapshots are kept in `localStorage` under `stayzzz_dismissed_alerts`, `stayzzz_known_bookings`, `stayzzz_last_share_message`.

**Hidden bookings**: soft-delete via the `hidden` boolean on `rentals`; all queries (UI + outbound feed) filter with `hidden=not.is.true` / `hidden=neq.true`.

## Domain model

- `stay_type`: `guest` | `owner` | `service` | `unresolved` (`unresolved` = blocked dates from Airbnb without a real reservation, i.e. summary contains "NOT AVAILABLE")
- `status`: `upcoming` | `current` | `completed` — **computed** from dates in `utils/dateUtils.ts`, not stored
- `pool_heat`: `not-asked` | `undecided` | `declined` | `requested` | `paid`

## Conventions

- Dates are `YYYY-MM-DD` strings; all date math goes through `utils/dateUtils.ts` and uses `America/Los_Angeles`. Don't compare raw `Date` objects across timezones.
- Path alias `@/` → `src/`.
- Tailwind v4 (CSS-based config — no `tailwind.config.js`).

## Environment

- `VITE_AIRBNB_ICAL_URL`, `VITE_VRBO_ICAL_URL` — feed URLs read by both Vite's dev proxy and the Vercel functions.
- `VITE_SUPABASE_ANON_KEY` — used by `api/feed.ts` (with a hardcoded fallback for the public key).
