// components/mapping/MapFilters.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { FilterIcon, XIcon } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface MapFiltersProps {
  onFilterChange: (filters: any) => void;
}

export const MapFilters: React.FC<MapFiltersProps> = ({ onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [areas, setAreas] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    area: '',
    category: '',
    volumeRange: [0, 1000]
  });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const { data: areaData } = await supabase
        .from('services')
        .select('area')
        .not('area', 'is', null);

      const { data: categoryData } = await supabase
        .from('services')
        .select('category')
        .not('category', 'is', null);

      setAreas(Array.from(new Set(areaData?.map(item => item.area) || [])));
      setCategories(Array.from(new Set(categoryData?.map(item => item.category) || [])));
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      area: '',
      category: '',
      volumeRange: [0, 1000]
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="m-2"
      >
        <FilterIcon className="mr-2 h-4 w-4" />
        Filters
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border rounded-lg shadow-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Map Filters</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area
            </label>
            <select
              value={filters.area}
              onChange={(e) => handleFilterChange({ ...filters, area: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All Areas</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange({ ...filters, category: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Volume Range (gallons)
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.volumeRange[0]}
                onChange={(e) => handleFilterChange({ 
                  ...filters, 
                  volumeRange: [parseInt(e.target.value) || 0, filters.volumeRange[1]]
                })}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.volumeRange[1]}
                onChange={(e) => handleFilterChange({ 
                  ...filters, 
                  volumeRange: [filters.volumeRange[0], parseInt(e.target.value) || 1000]
                })}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};