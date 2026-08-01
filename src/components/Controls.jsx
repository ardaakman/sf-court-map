import { useState } from 'react'
import { SPORTS, TIME_WINDOWS, formatDateChip, sfNow } from '../api.js'

function ChipRow({ options, selected, onSelect, ariaLabel }) {
  return (
    <div className="chip-row" role="group" aria-label={ariaLabel}>
      {options.map(({ value, label, disabled }) => (
        <button
          key={value}
          type="button"
          disabled={disabled && selected !== value}
          className={[
            'chip',
            selected === value ? 'chip-active' : '',
            disabled ? 'chip-disabled' : '',
          ].join(' ')}
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
  emptyDays,
  emptyWindows,
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
          SF Court Map
          <span className={`chevron ${open ? 'up' : ''}`}>⌄</span>
        </button>
        <div className="refresh">
          {loadingCount > 0 ? (
            <span className="loading-note">loading {loadingCount}…</span>
          ) : (
            fetchedAt && (
              <span className="loading-note">
                updated{' '}
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
          <ChipRow
            ariaLabel="Sport"
            options={Object.entries(SPORTS).map(([value, { label }]) => ({
              value,
              label,
            }))}
            selected={sport}
            onSelect={onSelectSport}
          />
          <ChipRow
            ariaLabel="Date"
            options={days.map((d) => ({
              value: d,
              label: formatDateChip(d, today),
              disabled: emptyDays.has(d),
            }))}
            selected={selectedDate}
            onSelect={onSelectDate}
          />
          <ChipRow
            ariaLabel="Time of day"
            options={Object.entries(TIME_WINDOWS).map(([value, { label }]) => ({
              value,
              label,
              disabled: emptyWindows.has(value),
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
