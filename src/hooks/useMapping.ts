// hooks/useMapping.ts
import { useState, useEffect } from 'react';
import { LocationPoint } from '../services/mappingService';
import { supabase } from '../services/supabaseClient';

export const useMapping = () => {
  const [locations, setLocations] = useState<LocationPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('entity_id, area, category, gallons_collected, outlet_name, collected_date')
        .limit(1000);

      if (error) throw error;

      // Convert to location points (with mock coordinates for demo)
      const locationData: LocationPoint[] = data.map((item, index) => ({
        entity_id: item.entity_id,
        latitude: 25.2048 + (Math.random() - 0.5) * 0.1,
        longitude: 55.2708 + (Math.random() - 0.5) * 0.1,
        area: item.area,
        category: item.category,
        gallons_collected: item.gallons_collected,
        outlet_name: item.outlet_name,
        last_collection: item.collected_date
      }));

      setLocations(locationData);
    } catch (err) {
      setError('Failed to load locations');
      console.error('Error loading locations:', err);
    } finally {
      setLoading(false);
    }
  };

  return { locations, loading, error, refreshLocations: loadLocations };
};