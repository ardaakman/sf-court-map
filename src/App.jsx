import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchLocations, fetchSchedule, next7Days, sfNow } from './api.js'
import Controls from './components/Controls.jsx'
import MapView from './components/MapView.jsx'

export default function App() {
  const [locations, setLocations] = useState(null)
  const [schedules, setSchedules] = useState({})
  const [pendingCount, setPendingCount] = useState(0)
  const [error, setError] = useState(null)
  const [fetchedAt, setFetchedAt] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => sfNow().date)
  const [sport, setSport] = useState('tennis')
  const [timeOfDay, setTimeOfDay] = useState('all')

  const days = useMemo(() => next7Days(), [])

  const load = useCallback(async () => {
    setError(null)
    try {
      const locs = await fetchLocations()
      setLocations(locs)
      setSchedules({})
      setPendingCount(locs.length)
      setFetchedAt(new Date())
      const [start, end] = [days[0], days[days.length - 1]]
      locs.forEach((loc) => {
        fetchSchedule(loc.id, start, end)
          .then((byDate) => {
            setSchedules((prev) => ({ ...prev, [loc.id]: byDate }))
          })
          .catch(() => {
            setSchedules((prev) => ({ ...prev, [loc.id]: {} }))
          })
          .finally(() => setPendingCount((n) => n - 1))
      })
    } catch (err) {
      setError(err.message || 'Failed to load availability')
    }
  }, [days])

  useEffect(() => {
    load()
  }, [load])

  if (error) {
    return (
      <div className="status-screen">
        <p>Could not load rec.us availability: {error}</p>
        <button type="button" className="retry" onClick={load}>
          Retry
        </button>
      </div>
    )
  }

  if (!locations) {
    return (
      <div className="status-screen">
        <div className="spinner" />
        <p>Loading SF court availability…</p>
      </div>
    )
  }

  return (
    <div className="app">
      <MapView
        locations={locations}
        schedules={schedules}
        selectedDate={selectedDate}
        sport={sport}
        timeOfDay={timeOfDay}
      />
      <Controls
        days={days}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        sport={sport}
        onSelectSport={setSport}
        timeOfDay={timeOfDay}
        onSelectTimeOfDay={setTimeOfDay}
        fetchedAt={fetchedAt}
        onRefresh={load}
        loadingCount={pendingCount}
      />
    </div>
  )
}
