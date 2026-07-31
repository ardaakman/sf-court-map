import { SPORTS, TIME_WINDOWS, formatDateChip, sfToday } from '../api.js'

function ChipRow({ options, selected, onSelect, ariaLabel }) {
  return (
    <div className="chip-row" role="group" aria-label={ariaLabel}>
      {options.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          className={`chip ${selected === value ? 'chip-active' : ''}`}
          onClick={() => onSelect(value)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default function Controls({
  dates,
  selectedDate,
  onSelectDate,
  sport,
  onSelectSport,
  timeOfDay,
  onSelectTimeOfDay,
  fetchedAt,
  onRefresh,
}) {
  const today = sfToday()
  return (
    <div className="controls">
      <div className="controls-header">
        <h1>SF Court Map</h1>
        <div className="refresh">
          {fetchedAt && (
            <span>
              updated{' '}
              {fetchedAt.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          )}
          <button type="button" onClick={onRefresh} aria-label="Refresh data">
            ⟳
          </button>
        </div>
      </div>
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
        options={dates.map((d) => ({ value: d, label: formatDateChip(d, today) }))}
        selected={selectedDate}
        onSelect={onSelectDate}
      />
      <ChipRow
        ariaLabel="Time of day"
        options={Object.entries(TIME_WINDOWS).map(([value, { label }]) => ({
          value,
          label,
        }))}
        selected={timeOfDay}
        onSelect={onSelectTimeOfDay}
      />
      <p className="credit">
        Data from{' '}
        <a
          href="https://www.rec.us/organizations/san-francisco-rec-park"
          target="_blank"
          rel="noreferrer"
        >
          rec.us
        </a>{' '}
        · pin number = open court-slots
      </p>
    </div>
  )
}
