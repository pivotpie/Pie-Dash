// services/mappingService.ts
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';

export interface LocationPoint {
  entity_id: string;
  latitude: number;
  longitude: number;
  area: string;
  category: string;
  gallons_collected: number;
  outlet_name: string;
  last_collection: string;
}

export class MappingService {
  private static map: L.Map | null = null;
  private static markers: L.LayerGroup | null = null;
  private static clusterGroup: L.MarkerClusterGroup | null = null;

  static initializeMap(containerId: string, center: [number, number] = [25.2048, 55.2708]): L.Map {
    this.map = L.map(containerId).setView(center, 11);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(this.map);

    // Initialize cluster group
    this.clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      chunkInterval: 200,
      chunkDelay: 50,
      maxClusterRadius: 50
    });

    this.map.addLayer(this.clusterGroup);
    return this.map;
  }

  static addLocations(locations: LocationPoint[]) {
    if (!this.clusterGroup) return;

    this.clusterGroup.clearLayers();

    locations.forEach(location => {
      const marker = this.createLocationMarker(location);
      this.clusterGroup!.addLayer(marker);
    });
  }

  private static createLocationMarker(location: LocationPoint): L.Marker {
    const icon = this.getIconByCategory(location.category);
    
    const marker = L.marker([location.latitude, location.longitude], { icon });
    
    const popupContent = `
      <div class="p-3 min-w-[200px]">
        <h3 class="font-semibold text-gray-900">${location.outlet_name}</h3>
        <div class="text-sm text-gray-600 mt-2 space-y-1">
          <div><strong>Category:</strong> ${location.category}</div>
          <div><strong>Area:</strong> ${location.area}</div>
          <div><strong>Last Collection:</strong> ${location.gallons_collected} gallons</div>
          <div><strong>Date:</strong> ${new Date(location.last_collection).toLocaleDateString()}</div>
        </div>
        <button class="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
          View Details
        </button>
      </div>
    `;
    
    marker.bindPopup(popupContent);
    return marker;
  }

  private static getIconByCategory(category: string): L.Icon {
    const iconColors: Record<string, string> = {
      'Restaurant': '#ef4444', // red
      'Accommodation': '#3b82f6', // blue
      'Cafeteria': '#f97316', // orange
      'Supermarket': '#10b981', // green
      'default': '#6b7280' // gray
    };

    const color = iconColors[category] || iconColors['default'];
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
  }

  static filterByArea(area: string, locations: LocationPoint[]) {
    const filtered = locations.filter(loc => loc.area === area);
    this.addLocations(filtered);
    
    if (filtered.length > 0 && this.map) {
      const group = new L.featureGroup(this.clusterGroup!.getLayers());
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  static highlightLocation(entityId: string) {
    // Implementation for highlighting specific location
    if (!this.clusterGroup) return;
    
    this.clusterGroup.eachLayer((layer: any) => {
      if (layer.options.entityId === entityId) {
        layer.openPopup();
        this.map?.setView(layer.getLatLng(), 15);
      }
    });
  }
}