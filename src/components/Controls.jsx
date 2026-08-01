import { useState } from 'react'
import { SPORTS, TIME_WINDOWS, formatDateChip, sfNow } from '../api.js'

function Segmented({ options, selected, onSelect, ariaLabel }) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={selected === value ? 'seg-active' : ''}
          onClick={() => onSelect(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function Controls({
  days,
  selectedDate,
  onSelectDate,
  sport,
  onSelectSport,
  timeOfDay,
  onSelectTimeOfDay,
  fetchedAt,
  onRefresh,
  loadingCount,
}) {
  const [open, setOpen] = useState(
    typeof window === 'undefined' || window.innerWidth > 640
  )
  const today = sfNow().date

  return (
    <div className="controls">
      <div className="controls-header">
        <button
          type="button"
          className="collapse-btn"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span className="title">🎾 SF Court Map</span>
          <span className={`chevron ${open ? 'up' : ''}`}>⌄</span>
        </button>
        <div className="refresh">
          {loadingCount > 0 ? (
            <span className="loading-note">
              <span className="spinner spinner-sm" /> {loadingCount}
            </span>
          ) : (
            fetchedAt && (
              <span className="loading-note">
                {fetchedAt.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            )
          )}
          <button
            type="button"
            className="refresh-btn"
            onClick={onRefresh}
            aria-label="Refresh data"
          >
            ⟳
          </button>
        </div>
      </div>

      {open && (
        <div className="controls-body">
          <Segmented
            ariaLabel="Sport"
            options={Object.entries(SPORTS).map(([value, { label }]) => ({
              value,
              label,
            }))}
            selected={sport}
            onSelect={onSelectSport}
          />
          <div className="day-row" role="group" aria-label="Date">
            {days.map((d) => (
              <button
                key={d}
                type="button"
                className={`day-chip ${selectedDate === d ? 'day-active' : ''}`}
                onClick={() => onSelectDate(d)}
              >
                {formatDateChip(d, today)}
              </button>
            ))}
          </div>
          <Segmented
            ariaLabel="Time of day"
            options={Object.entries(TIME_WINDOWS).map(([value, { label }]) => ({
              value,
              label,
            }))}
            selected={timeOfDay}
            onSelect={onSelectTimeOfDay}
          />
          <p className="credit">
            Pin = bookable windows · data from{' '}
            <a
              href="https://www.rec.us/organizations/san-francisco-rec-park"
              target="_blank"
              rel="noreferrer"
            >
              rec.us
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
