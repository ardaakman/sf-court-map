import { SPORTS, bookingUrl, formatMinutes } from '../api.js'

export default function LocationPopup({ location, sport, reservable, open }) {
  const courtCount =
    sport === 'tennis' ? location.tennisCourts : location.pickleballCourts

  return (
    <div className="popup">
      {location.thumbnail && (
        <img src={location.thumbnail} alt={location.name} className="popup-img" />
      )}
      <div className="popup-body">
        <h2>{location.name}</h2>
        <p className="popup-address">{location.address}</p>
        <p className="popup-meta">
          {courtCount} {SPORTS[sport].label.toLowerCase()} court
          {courtCount === 1 ? '' : 's'}
        </p>

        {reservable.length > 0 ? (
          <div className="popup-times">
            {reservable.map((s, i) => (
              <span key={i} className="time-chip">
                {formatMinutes(s.startMin)}–{formatMinutes(s.endMin)}
                <em>{s.court.replace(/^Court\s*/i, 'Ct ')}</em>
              </span>
            ))}
          </div>
        ) : (
          <p className="popup-none">Nothing bookable for this day / filter.</p>
        )}

        {open.length > 0 && (
          <p className="popup-open">
            Open play (walk-up):{' '}
            {dedupeSpans(open)
              .map((s) => `${formatMinutes(s.startMin)}–${formatMinutes(s.endMin)}`)
              .join(', ')}
          </p>
        )}

        <a
          className="book-btn"
          href={bookingUrl(location.id)}
          target="_blank"
          rel="noreferrer"
        >
          Book on rec.us
        </a>
        <p className="popup-hint">rec.us opens on today — re-pick your day there.</p>
      </div>
    </div>
  )
}

const dedupeSpans = (spans) => {
  const seen = new Set()
  return spans.filter((s) => {
    const key = `${s.startMin}-${s.endMin}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
