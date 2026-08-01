export const SPORTS = {
  tennis: { id: 'bd745b6e-1dd6-43e2-a69f-06f094808a96', label: 'Tennis' },
  pickleball: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', label: 'Pickleball' },
}

const API = 'https://api.rec.us/v1'
const ORG_SLUG = 'san-francisco-rec-park'

export const bookingUrl = (locationId) => `https://www.rec.us/locations/${locationId}`

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`rec.us API returned ${res.status}`)
  return res.json()
}

// Location metadata (name, coordinates, images, which sports have courts).
// Availability itself comes from fetchSchedule — the availableSlots on this
// endpoint list free court time that is NOT necessarily bookable (SF uses
// fixed timeslots), which is why it can't be trusted for open spots.
export async function fetchLocations() {
  const payload = await getJson(
    `${API}/locations/availability?publishedSites=true&organizationSlug=${ORG_SLUG}`
  )
  return payload
    .map(({ location }) => {
      let tennisCourts = 0
      let pickleballCourts = 0
      for (const court of location.courts ?? []) {
        const ids = (court.sports ?? []).map((s) => s.sportId)
        if (ids.includes(SPORTS.tennis.id)) tennisCourts++
        if (ids.includes(SPORTS.pickleball.id)) pickleballCourts++
      }
      return {
        id: location.id,
        name: location.name,
        lat: Number(location.lat),
        lng: Number(location.lng),
        address: location.formattedAddress,
        thumbnail: location.images?.thumbnail ?? null,
        tennisCourts,
        pickleballCourts,
      }
    })
    .filter((loc) => loc.tennisCourts > 0 || loc.pickleballCourts > 0)
}

// The schedule endpoint is what rec.us's own "Book Now" tab uses. Every court
// day is a list of spans, each RESERVATION (taken), RESERVABLE (bookable) or
// OPEN (free walk-up play, not bookable).
// Returns { 'YYYY-MM-DD': { tennis: {reservable: Span[], open: Span[]}, pickleball: {...} } }
// where Span = { court, startMin, endMin }.
export async function fetchSchedule(locationId, startDate, endDate) {
  const data = await getJson(
    `${API}/locations/${locationId}/schedule?startDate=${startDate}&endDate=${endDate}`
  )
  const byDate = {}
  for (const [compact, courts] of Object.entries(data.dates ?? {})) {
    const date = `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`
    const day = (byDate[date] ??= {})
    for (const court of courts) {
      const sportKeys = Object.keys(SPORTS).filter((key) =>
        (court.sports ?? []).some((s) => s.id === SPORTS[key].id)
      )
      if (sportKeys.length === 0) continue
      for (const [span, ref] of Object.entries(court.schedule ?? {})) {
        const type = ref?.referenceType
        if (type !== 'RESERVABLE' && type !== 'OPEN') continue
        const [start, end] = span.split(',').map((s) => s.trim())
        const entry = {
          court: court.courtNumber,
          startMin: toMinutes(start),
          endMin: toMinutes(end),
        }
        for (const key of sportKeys) {
          const bucket = (day[key] ??= { reservable: [], open: [] })
          bucket[type === 'RESERVABLE' ? 'reservable' : 'open'].push(entry)
        }
      }
    }
    for (const bucket of Object.values(day)) {
      bucket.reservable.sort((a, b) => a.startMin - b.startMin)
      bucket.open.sort((a, b) => a.startMin - b.startMin)
    }
  }
  return byDate
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export const TIME_WINDOWS = {
  all: { label: 'Any time', from: 0, to: 24 * 60 },
  morning: { label: 'Morning', from: 0, to: 12 * 60 },
  afternoon: { label: 'Afternoon', from: 12 * 60, to: 17 * 60 },
  evening: { label: 'Evening', from: 17 * 60, to: 24 * 60 },
}

// Spans matching the filters. Past windows are dropped on today's date.
export function spansFor(schedule, date, sport, timeOfDay, nowMin) {
  const bucket = schedule?.[date]?.[sport]
  if (!bucket) return { reservable: [], open: [] }
  const { from, to } = TIME_WINDOWS[timeOfDay]
  const keep = (s) =>
    s.startMin < to && s.endMin > from && (nowMin == null || s.endMin > nowMin)
  return {
    reservable: bucket.reservable.filter(keep),
    open: bucket.open.filter(keep),
  }
}

export function formatMinutes(min) {
  let h = Math.floor(min / 60)
  const m = min % 60
  const suffix = h >= 12 ? 'p' : 'a'
  h = h % 12 || 12
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, '0')}${suffix}`
}

export function formatDateChip(dateStr, todayStr) {
  if (dateStr === todayStr) return 'Today'
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${date.toLocaleDateString('en-US', { weekday: 'short' })} ${m}/${d}`
}

// Today and current minutes-of-day in SF, regardless of viewer timezone.
export function sfNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const get = (type) => parts.find((p) => p.type === type)?.value
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  }
}

export function next7Days() {
  const { date } = sfNow()
  const [y, m, d] = date.split('-').map(Number)
  const days = []
  for (let i = 0; i < 7; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i))
    days.push(dt.toISOString().slice(0, 10))
  }
  return days
}
