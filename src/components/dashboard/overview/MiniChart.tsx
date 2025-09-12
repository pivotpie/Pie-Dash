// components/dashboard/overview/MiniChart.tsx
import React, { useState, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  Brush
} from 'recharts';
import { ArrowUpIcon } from 'lucide-react';

interface MiniChartProps {
  type: string;
  data: any[];
  color: string;
  onDrillDown?: (item: any) => void;
  interactive?: boolean;
  height?: number;
  showLegend?: boolean;
  isDrillDownEnabled?: boolean;
  chartTitle?: string;
  drillLevel?: 'primary' | 'secondary';
  onDrillUp?: () => void;
}

export const MiniChart: React.FC<MiniChartProps> = ({ 
  type, 
  data, 
  color, 
  onDrillDown,
  interactive = true,
  height = 96,
  showLegend = false,
  isDrillDownEnabled = true,
  chartTitle,
  drillLevel = 'primary',
  onDrillUp
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const colors = {
    blue: ['#3b82f6', '#1e40af', '#60a5fa'],
    green: ['#10b981', '#047857', '#34d399'],
    purple: ['#8b5cf6', '#6d28d9', '#a78bfa'],
    orange: ['#f59e0b', '#d97706', '#fbbf24'],
    red: ['#ef4444', '#dc2626', '#f87171'],
    yellow: ['#eab308', '#ca8a04', '#facc15']
  };

  const colorPalette = colors[color as keyof typeof colors] || colors.blue;


  const renderDrillUpButton = () => {
    if (drillLevel !== 'secondary' || !onDrillUp) return null;
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDrillUp();
        }}
        className="absolute top-1 right-1 z-10 p-2 bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-lg hover:bg-white/80 transition-all duration-200 text-primary-600 shadow-lg"
        title="Drill up to previous level"
      >
        <ArrowUpIcon className="h-4 w-4" />
      </button>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-glass-strong backdrop-blur-strong p-3 rounded-lg shadow-glass-strong border border-glass-border-strong">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toLocaleString()}
            </p>
          ))}
          {isDrillDownEnabled && (
            <p className="text-xs text-blue-600 mt-1">Click to drill down</p>
          )}
        </div>
      );
    }
    return null;
  };

  const handleClick = useCallback((data: any) => {
    if (!interactive || !isDrillDownEnabled || !onDrillDown) return;
    
    const itemKey = data.area || data.category || data.gallons_collected || data.service_provider || data.name;
    onDrillDown({ ...data, key: itemKey });
  }, [interactive, isDrillDownEnabled, onDrillDown]);

  if (type === 'donut' || type === 'pie') {
    const chartData = data && data.length > 0 ? data.slice(0, 6) : [];
    
    if (chartData.length === 0) {
      return (
        <div className="relative flex items-center justify-center" style={{ height }}>
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      );
    }
    
    return (
      <div className="relative">
        {renderDrillUpButton()}
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="collection_count"
              nameKey="area"
              cx="50%"
              cy="50%"
              innerRadius={type === 'donut' ? height * 0.15 : 0}
              outerRadius={height * 0.3}
              onClick={interactive ? handleClick : undefined}
              style={{ cursor: interactive && isDrillDownEnabled ? 'pointer' : 'default' }}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={index} 
                  fill={colorPalette[index % colorPalette.length]}
                  stroke={selectedItems.includes(entry.area) ? '#000' : 'none'}
                  strokeWidth={selectedItems.includes(entry.area) ? 2 : 0}
                />
              ))}
            </Pie>
            {interactive && <Tooltip content={<CustomTooltip />} />}
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className="relative">
        {renderDrillUpButton()}
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="area" 
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Line 
              type="monotone" 
              dataKey="collection_count" 
              stroke={colorPalette[0]}
              strokeWidth={2}
              dot={{ fill: colorPalette[0], strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: colorPalette[1], strokeWidth: 2 }}
            />
            {interactive && <Tooltip content={<CustomTooltip />} />}
            {interactive && height > 150 && (
              <Brush 
                dataKey="area" 
                height={20} 
                stroke={colorPalette[0]}
                fill={colorPalette[2]}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'area') {
    return (
      <div className="relative">
        {renderDrillUpButton()}
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data.slice(0, 10)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="area" 
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Area 
              type="monotone" 
              dataKey="collection_count" 
              stroke={colorPalette[0]}
              fill={colorPalette[2]}
              fillOpacity={0.6}
            />
            {interactive && <Tooltip content={<CustomTooltip />} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Handle specific chart types that don't have drill-down
  if (type === 'status' || type === 'alerts') {
    return (
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={[
            {area: 'Online', collection_count: 85},
            {area: 'Processing', collection_count: 12},
            {area: 'Offline', collection_count: 3}
          ]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="area" 
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Bar 
              dataKey="collection_count" 
              fill={colorPalette[0]}
            />
            {interactive && <Tooltip content={<CustomTooltip />} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Handle column chart (vertical bar)
  if (type === 'column') {
    const chartData = data && data.length > 0 ? data.slice(0, 8) : [];
    
    if (chartData.length === 0) {
      return (
        <div className="relative flex items-center justify-center" style={{ height }}>
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      );
    }
    
    return (
      <div className="relative">
        {renderDrillUpButton()}
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="area" 
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Bar 
              dataKey="collection_count" 
              fill={colorPalette[0]}
              onClick={interactive ? handleClick : undefined}
              style={{ cursor: interactive && isDrillDownEnabled ? 'pointer' : 'default' }}
            />
            {interactive && <Tooltip content={<CustomTooltip />} />}
            {interactive && height > 150 && (
              <Brush 
                dataKey="area" 
                height={20} 
                stroke={colorPalette[0]}
                fill={colorPalette[2]}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Handle horizontal bar chart
  if (type === 'horizontal-bar') {
    const chartData = data && data.length > 0 ? data.slice(0, 6) : [];
    
    if (chartData.length === 0) {
      return (
        <div className="relative flex items-center justify-center" style={{ height }}>
          <p className="text-gray-500 text-sm">No data available</p>
        </div>
      );
    }
    
    return (
      <div className="relative">
        {renderDrillUpButton()}
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={chartData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis 
              type="category"
              dataKey="area" 
              tick={{ fontSize: 8 }}
              width={120}
              tickFormatter={(value) => {
                if (value && value.length > 12) {
                  return value.substring(0, 12) + '...';
                }
                return value;
              }}
            />
            <Bar 
              dataKey="collection_count" 
              fill={colorPalette[0]}
              onClick={interactive ? handleClick : undefined}
              style={{ cursor: interactive && isDrillDownEnabled ? 'pointer' : 'default' }}
            />
            {interactive && <Tooltip content={<CustomTooltip />} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Default bar chart
  const chartData = data && data.length > 0 ? data.slice(0, 8) : [];
  
  if (chartData.length === 0) {
    return (
      <div className="relative flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );
  }
  
  return (
    <div className="relative">
      {renderDrillUpButton()}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="area" 
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 10 }} />
          <Bar 
            dataKey="collection_count" 
            fill={colorPalette[0]}
            onClick={interactive ? handleClick : undefined}
            style={{ cursor: interactive && isDrillDownEnabled ? 'pointer' : 'default' }}
          />
          {interactive && <Tooltip content={<CustomTooltip />} />}
          {interactive && height > 150 && (
            <Brush 
              dataKey="area" 
              height={20} 
              stroke={colorPalette[0]}
              fill={colorPalette[2]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};