import { useCallback, useEffect, useMemo, useState } from 'react'
import { availableDates, fetchAvailability, sfToday } from './api.js'
import Controls from './components/Controls.jsx'
import MapView from './components/MapView.jsx'

export default function App() {
  const [locations, setLocations] = useState(null)
  const [error, setError] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [sport, setSport] = useState('tennis')
  const [timeOfDay, setTimeOfDay] = useState('all')

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await fetchAvailability()
      setLocations(data)
      setFetchedAt(new Date())
      setSelectedDate((current) => {
        const dates = availableDates(data)
        if (current && dates.includes(current)) return current
        const today = sfToday()
        return dates.includes(today) ? today : dates[0] ?? null
      })
    } catch (err) {
      setError(err.message || 'Failed to load availability')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const dates = useMemo(
    () => (locations ? availableDates(locations) : []),
    [locations]
  )

  if (error) {
    return (
      <div className="status-screen">
        <p>Could not load rec.us availability: {error}</p>
        <button type="button" onClick={load}>
          Retry
        </button>
      </div>
    )
  }

  if (!locations) {
    return (
      <div className="status-screen">
        <p>Loading SF court availability…</p>
      </div>
    )
  }

  return (
    <div className="app">
      <MapView
        locations={locations}
        selectedDate={selectedDate}
        sport={sport}
        timeOfDay={timeOfDay}
      />
      <Controls
        dates={dates}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        sport={sport}
        onSelectSport={setSport}
        timeOfDay={timeOfDay}
        onSelectTimeOfDay={setTimeOfDay}
        fetchedAt={fetchedAt}
        onRefresh={load}
      />
    </div>
  )
}
