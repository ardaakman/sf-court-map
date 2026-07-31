import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import { slotsFor } from '../api.js'
import LocationPopup from './LocationPopup.jsx'

const SF_CENTER = [37.762, -122.443]

function markerIcon(count) {
  const tier = count === 0 ? 'none' : count < 10 ? 'few' : 'many'
  return L.divIcon({
    className: '',
    html: `<div class="pin pin-${tier}">${count}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  })
}

export default function MapView({ locations, selectedDate, sport, timeOfDay }) {
  return (
    <MapContainer center={SF_CENTER} zoom={13} className="map" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc) => {
        const { startTimes, totalCourtSlots } = slotsFor(
          loc,
          selectedDate,
          sport,
          timeOfDay
        )
        return (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={markerIcon(totalCourtSlots)}
            zIndexOffset={totalCourtSlots > 0 ? 100 : 0}
          >
            <Popup maxWidth={320}>
              <LocationPopup
                location={loc}
                sport={sport}
                startTimes={startTimes}
                totalCourtSlots={totalCourtSlots}
              />
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
