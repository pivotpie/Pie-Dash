// components/mapping/MapContainer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { MappingService, LocationPoint } from '../../services/mappingService';
import { MapControls } from './MapControls';
import { MapFilters } from './MapFilters';
import { supabase } from '../../services/supabaseClient';

interface MapContainerProps {
  highlightArea?: string;
  selectedCategory?: string;
  onLocationClick?: (location: LocationPoint) => void;
  className?: string;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  highlightArea,
  selectedCategory,
  onLocationClick,
  className = "h-96 w-full"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mapRef.current) {
      MappingService.initializeMap('map-container');
      loadLocations();
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [highlightArea, selectedCategory, locations]);

  const loadLocations = async () => {
    try {
      // Load locations with coordinates (you'll need to add lat/lng to your data)
      const { data, error } = await supabase
        .from('services')
        .select(`
          entity_id,
          area,
          category,
          gallons_collected,
          outlet_name,
          collected_date,
          latitude,
          longitude
        `)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(1000); // Limit for performance

      if (error) throw error;

      const locationData: LocationPoint[] = data.map(item => ({
        entity_id: item.entity_id,
        latitude: item.latitude,
        longitude: item.longitude,
        area: item.area,
        category: item.category,
        gallons_collected: item.gallons_collected,
        outlet_name: item.outlet_name,
        last_collection: item.collected_date
      }));

      setLocations(locationData);
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...locations];

    if (highlightArea) {
      filtered = filtered.filter(loc => loc.area === highlightArea);
    }

    if (selectedCategory) {
      filtered = filtered.filter(loc => loc.category === selectedCategory);
    }

    setFilteredLocations(filtered);
    MappingService.addLocations(filtered);
  };

  const handleFilterChange = (filters: any) => {
    let filtered = [...locations];

    if (filters.area) {
      filtered = filtered.filter(loc => loc.area === filters.area);
    }

    if (filters.category) {
      filtered = filtered.filter(loc => loc.category === filters.category);
    }

    if (filters.volumeRange) {
      filtered = filtered.filter(loc => 
        loc.gallons_collected >= filters.volumeRange[0] && 
        loc.gallons_collected <= filters.volumeRange[1]
      );
    }

    setFilteredLocations(filtered);
    MappingService.addLocations(filtered);
  };

  if (loading) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      <MapFilters onFilterChange={handleFilterChange} />
      <div
        ref={mapRef}
        id="map-container"
        className={`${className} rounded-lg border`}
      />
      <MapControls 
        totalLocations={filteredLocations.length}
        onZoomToAll={() => {
          // Implement zoom to show all filtered locations
        }}
      />
    </div>
  );
};