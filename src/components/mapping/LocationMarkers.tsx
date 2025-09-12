import { useEffect } from 'react'
import L from 'leaflet'

interface LocationMarkersProps {
  map: L.Map | null
}

const locations = [
  { id: 1, lat: 40.7589, lng: -73.9851, type: 'pickup', info: 'Pickup Location A' },
  { id: 2, lat: 40.7505, lng: -73.9934, type: 'delivery', info: 'Delivery Location B' },
  { id: 3, lat: 40.7282, lng: -74.0776, type: 'warehouse', info: 'Main Warehouse' },
  { id: 4, lat: 40.6892, lng: -74.0445, type: 'pickup', info: 'Pickup Location C' },
]

const getMarkerIcon = (type: string) => {
  const colors: Record<string, string> = {
    pickup: '#3b82f6',
    delivery: '#10b981',
    warehouse: '#f59e0b'
  }
  
  return L.divIcon({
    html: `<div style="background-color: ${colors[type] || '#6b7280'}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
    className: 'custom-marker',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  })
}

export default function LocationMarkers({ map }: LocationMarkersProps) {
  useEffect(() => {
    if (!map) return

    const markers: L.Marker[] = []

    locations.forEach(location => {
      const marker = L.marker([location.lat, location.lng], {
        icon: getMarkerIcon(location.type)
      })
        .bindPopup(`<strong>${location.info}</strong><br/>Type: ${location.type}`)
        .addTo(map)
      
      markers.push(marker)
    })

    return () => {
      markers.forEach(marker => map.removeLayer(marker))
    }
  }, [map])

  return null
}