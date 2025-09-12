// components/dashboard/components/FilterControls.tsx
import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { FilterIcon, XIcon, ChevronDownIcon } from 'lucide-react';

interface FilterControlsProps {
  onFilter: (filters: any) => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({ onFilter }) => {
  const [filters, setFilters] = useState({
    zone: '',
    minCollections: '',
    dateRange: { start: '', end: '' }
  });

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      zone: '',
      minCollections: '',
      dateRange: { start: '', end: '' }
    };
    setFilters(clearedFilters);
    onFilter(clearedFilters);
  };

  const hasActiveFilters = filters.zone || filters.minCollections || filters.dateRange.start || filters.dateRange.end;

  return (
    <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FilterIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <Button onClick={clearFilters} variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
            <XIcon className="h-4 w-4 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Zone Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Zone
          </label>
          <div className="relative">
            <select
              value={filters.zone}
              onChange={(e) => handleFilterChange('zone', e.target.value)}
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Zones</option>
              <option value="Al Quoz">Al Quoz</option>
              <option value="Bur Dub">Bur Dub</option>
              <option value="Der">Der</option>
              <option value="Rs Al Khor">Rs Al Khor</option>
              <option value="Al Quss">Al Quss</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Minimum Collections Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Minimum Collections
          </label>
          <input
            type="number"
            value={filters.minCollections}
            onChange={(e) => handleFilterChange('minCollections', e.target.value)}
            placeholder="e.g., 100"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Start Date Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* End Date Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};