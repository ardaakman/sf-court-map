import { SPORTS, bookingUrl, formatTime, timeRanges } from '../api.js'

export default function LocationPopup({
  location,
  sport,
  startTimes,
  totalCourtSlots,
}) {
  const ranges = timeRanges(startTimes)
  const courtCount =
    sport === 'tennis' ? location.tennisCourts : location.pickleballCourts

  return (
    <div className="popup">
      {location.thumbnail && (
        <img src={location.thumbnail} alt={location.name} className="popup-img" />
      )}
      <h2>{location.name}</h2>
      <p className="popup-address">{location.address}</p>
      <p className="popup-meta">
        {courtCount} {SPORTS[sport].label.toLowerCase()} court
        {courtCount === 1 ? '' : 's'}
        {totalCourtSlots > 0 && ` · ${totalCourtSlots} open court-slots`}
      </p>
      {ranges.length > 0 ? (
        <div className="popup-times">
          {ranges.map(([start, end]) => (
            <span key={start} className="time-chip">
              {formatTime(start)}–{formatTime(end)}
            </span>
          ))}
        </div>
      ) : (
        <p className="popup-none">No open times for this day/filter.</p>
      )}
      <a
        className="book-btn"
        href={bookingUrl(location.id)}
        target="_blank"
        rel="noreferrer"
      >
        Book on rec.us ↗
      </a>
      <p className="popup-hint">
        rec.us opens on today&apos;s date — re-pick your day there.
      </p>
    </div>
  )
}
