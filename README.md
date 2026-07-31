# SF Court Map

Map view of San Francisco Rec & Park tennis and pickleball court availability,
built because [rec.us](https://www.rec.us/organizations/san-francisco-rec-park)
only shows locations as a text list — you can't see where courts are or which
ones have openings without clicking through each one.

**Live:** deployed on Netlify (see below). Linked from [ardaakman.info](https://ardaakman.info) under Projects.

## What it does

- Plots all 28 SF Rec & Park court locations on an OpenStreetMap map.
- Each pin shows the number of open court-slots (30-min court bookings) for the
  selected day; green = 10+, amber = 1–9, gray = none.
- Filters: sport (tennis / pickleball), day (rolling 7-day booking window),
  time of day (morning / afternoon / evening).
- Clicking a pin shows the open time ranges and a **Book on rec.us** button that
  deep-links to that location's booking page (`rec.us/locations/{id}`).
  Note: rec.us ignores date query params, so its page always opens on today —
  you re-pick the day there.

## How data flows

One unauthenticated request, made directly from the browser (CORS is `*`):

```
GET https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=san-francisco-rec-park
```

Returns every location with `lat`/`lng` and per-court `availableSlots` as local
SF time strings (`"2026-07-31 12:30:00"`, 30-min increments, ~7 days out).
Court sports are matched by sport ID (`src/api.js`): tennis
`bd745b6e-…`, pickleball `aaaaaaaa-…`.

**Fallback note:** the API's WAF blocks non-browser clients (curl without
`sec-fetch-*` headers) but allows any origin from real browsers. If rec.us ever
tightens CORS, add a Netlify Function that proxies this one GET with
browser-like headers and point `API_URL` in `src/api.js` at it.

## Develop

```
npm install
npm run dev
```

## Deploy

```
npm run build
netlify deploy --prod
```

`netlify.toml` sets build command, publish dir (`dist`), and the SPA redirect.
