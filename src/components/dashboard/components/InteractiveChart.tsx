// components/dashboard/components/InteractiveChart.tsx
import React, { useState } from 'react';
import { Chart } from '../../ui/Chart';
import { FilterIcon, ZoomInIcon, RefreshCwIcon } from 'lucide-react';
import { Button } from '../../ui/button';

interface InteractiveChartProps {
  title: string;
  type: 'bar' | 'pie' | 'line' | 'area' | 'treemap';
  data: any[];
  xKey: string;
  yKey: string;
  height?: number;
  onBarClick?: (data: any) => void;
  onFilter?: (filter: any) => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  title,
  type,
  data,
  xKey,
  yKey,
  height = 400,
  onBarClick,
  onFilter
}) => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleFilter = (filter: any) => {
    if (filter.type === 'add') {
      setActiveFilters(prev => [...prev, filter.value]);
    } else {
      setActiveFilters(prev => prev.filter(f => f !== filter.value));
    }
    onFilter?.(filter);
  };

  const resetFilters = () => {
    setActiveFilters([]);
    setIsZoomed(false);
    onFilter?.({ type: 'reset' });
  };

  return (
    <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-3xl shadow-glass-strong p-6 relative overflow-hidden">
      {/* Background mesh */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-60 rounded-3xl pointer-events-none"></div>
      
      <div className="relative z-10">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {activeFilters.length > 0 && (
              <div className="flex items-center space-x-2 text-xs">
                <FilterIcon className="h-4 w-4 text-primary-600" />
                <span className="text-neutral-600">
                  {activeFilters.length} filter{activeFilters.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="bg-glass-white hover:bg-white transition-all duration-200"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active filters display */}
        {activeFilters.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeFilters.map((filter, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800 border border-primary-200"
              >
                {filter}
                <button
                  onClick={() => handleFilter({ type: 'remove', value: filter })}
                  className="ml-2 hover:text-primary-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Chart container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
          <Chart
            data={data}
            type={type === 'treemap' ? 'bar' : type}
            xKey={xKey}
            yKey={yKey}
            height={height}
            onItemClick={onBarClick}
            onFilter={handleFilter}
            interactive={true}
            enableZoom={true}
            enableBrush={height > 300}
          />
        </div>

        {/* Chart interaction hints */}
        <div className="mt-4 flex justify-between text-xs text-neutral-500">
          <span>💡 Click items to filter • Drag to zoom • Hover for details</span>
          <span>{data.length} data points</span>
        </div>
      </div>
    </div>
  );
};