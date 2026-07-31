export const SPORTS = {
  tennis: { id: 'bd745b6e-1dd6-43e2-a69f-06f094808a96', label: 'Tennis' },
  pickleball: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', label: 'Pickleball' },
}

const API_URL =
  'https://api.rec.us/v1/locations/availability?publishedSites=true&organizationSlug=san-francisco-rec-park'

export const bookingUrl = (locationId) => `https://www.rec.us/locations/${locationId}`

export async function fetchAvailability() {
  const res = await fetch(API_URL, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`rec.us API returned ${res.status}`)
  const payload = await res.json()
  return payload
    .map(({ location }) => transformLocation(location))
    .filter((loc) => loc.tennisCourts > 0 || loc.pickleballCourts > 0)
}

// Slot strings are local SF time, e.g. "2026-07-31 12:30:00", one entry per
// court per open half hour. We fold them into, per location:
//   slotsByDate[date][sport] = Map<"HH:MM", numberOfOpenCourts>
function transformLocation(location) {
  const slotsByDate = {}
  let tennisCourts = 0
  let pickleballCourts = 0

  for (const court of location.courts ?? []) {
    const sportIds = (court.sports ?? []).map((s) => s.sportId)
    const courtSports = Object.keys(SPORTS).filter((key) =>
      sportIds.includes(SPORTS[key].id)
    )
    if (courtSports.length === 0) continue
    if (courtSports.includes('tennis')) tennisCourts++
    if (courtSports.includes('pickleball')) pickleballCourts++

    for (const slot of court.availableSlots ?? []) {
      const [date, time] = slot.split(' ')
      if (!date || !time) continue
      const hhmm = time.slice(0, 5)
      const day = (slotsByDate[date] ??= {})
      for (const sport of courtSports) {
        const times = (day[sport] ??= new Map())
        times.set(hhmm, (times.get(hhmm) ?? 0) + 1)
      }
    }
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
    slotsByDate,
  }
}

export const TIME_WINDOWS = {
  all: { label: 'All day', from: 0, to: 24 },
  morning: { label: 'Morning', from: 0, to: 12 },
  afternoon: { label: 'Afternoon', from: 12, to: 17 },
  evening: { label: 'Evening', from: 17, to: 24 },
}

function inWindow(hhmm, windowKey) {
  const hour = Number(hhmm.slice(0, 2))
  const { from, to } = TIME_WINDOWS[windowKey]
  return hour >= from && hour < to
}

// Distinct open start times (sorted) and total court-slot count for the filters.
export function slotsFor(location, date, sport, timeOfDay) {
  const times = location.slotsByDate[date]?.[sport]
  if (!times) return { startTimes: [], totalCourtSlots: 0 }
  const startTimes = [...times.keys()]
    .filter((t) => inWindow(t, timeOfDay))
    .sort()
  const totalCourtSlots = startTimes.reduce((sum, t) => sum + times.get(t), 0)
  return { startTimes, totalCourtSlots }
}

// Union of dates present in the data, sorted ascending.
export function availableDates(locations) {
  const dates = new Set()
  for (const loc of locations) {
    for (const d of Object.keys(loc.slotsByDate)) dates.add(d)
  }
  return [...dates].sort()
}

export function formatTime(hhmm) {
  let [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'p' : 'a'
  h = h % 12 || 12
  return m === 0 ? `${h}${suffix}` : `${h}:${String(m).padStart(2, '0')}${suffix}`
}

// Merge sorted "HH:MM" start times into contiguous ranges of 30-min slots:
// ["07:00","07:30","08:00","16:00"] -> [["07:00","08:30"], ["16:00","16:30"]]
// (range end = end of the last slot, i.e. last start + 30 min)
export function timeRanges(startTimes) {
  const ranges = []
  for (const t of startTimes) {
    const [h, m] = t.split(':').map(Number)
    const minutes = h * 60 + m
    const last = ranges[ranges.length - 1]
    if (last && minutes === last.endMinutes) {
      last.endMinutes = minutes + 30
    } else {
      ranges.push({ startMinutes: minutes, endMinutes: minutes + 30 })
    }
  }
  const toHHMM = (mins) =>
    `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
  return ranges.map((r) => [toHHMM(r.startMinutes), toHHMM(r.endMinutes)])
}

export function formatDateChip(dateStr, todayStr) {
  if (dateStr === todayStr) return 'Today'
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  return `${weekday} ${m}/${d}`
}

// Today in SF regardless of viewer timezone.
export function sfToday() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
