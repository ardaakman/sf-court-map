import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { sfNow, spansFor } from '../api.js'
import LocationPopup from './LocationPopup.jsx'

const SF_CENTER = [37.762, -122.443]

function markerIcon(count, loaded) {
  const tier = !loaded ? 'wait' : count === 0 ? 'none' : count < 4 ? 'few' : 'many'
  const label = loaded ? count : '·'
  return L.divIcon({
    className: '',
    html: `<div class="pin pin-${tier}"><span>${label}</span><i></i></div>`,
    iconSize: [32, 40],
    iconAnchor: [16, 38],
    popupAnchor: [0, -36],
  })
}

export default function MapView({
  locations,
  schedules,
  selectedDate,
  sport,
  timeOfDay,
}) {
  const now = sfNow()
  const nowMin = selectedDate === now.date ? now.minutes : null

  return (
    <MapContainer
      center={SF_CENTER}
      zoom={13}
      className="map"
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      {locations.map((loc) => {
        const schedule = schedules[loc.id]
        const loaded = schedule !== undefined
        const { reservable, open } = spansFor(
          schedule,
          selectedDate,
          sport,
          timeOfDay,
          nowMin
        )
        return (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={markerIcon(reservable.length, loaded)}
            zIndexOffset={reservable.length > 0 ? 100 : 0}
          >
            <Popup maxWidth={300}>
              <LocationPopup
                location={loc}
                sport={sport}
                reservable={reservable}
                open={open}
              />
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
