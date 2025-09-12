// components/ui/Chart.tsx
import React, { useState, useCallback } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Brush,
  ReferenceLine,
  ReferenceArea
} from 'recharts';

interface ChartProps {
  data: any[];
  type: 'bar' | 'pie' | 'line' | 'area';
  xKey?: string;
  yKey: string;
  width?: number;
  height?: number;
  colors?: string[];
  onItemClick?: (data: any) => void;
  onFilter?: (filter: any) => void;
  interactive?: boolean;
  enableZoom?: boolean;
  enableBrush?: boolean;
}

export const Chart: React.FC<ChartProps> = ({
  data,
  type,
  xKey,
  yKey,
  width,
  height = 300,
  colors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'],
  onItemClick,
  onFilter,
  interactive = true,
  enableZoom = true,
  enableBrush = true
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [zoomArea, setZoomArea] = useState<{left?: number, right?: number}>({});
  // Enhanced tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-4 shadow-floating">
          <p className="font-bold text-neutral-800 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-neutral-700">
                {entry.name}: <span className="font-semibold">{entry.value?.toLocaleString()}</span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Click handler for filtering
  const handleItemClick = useCallback((data: any) => {
    if (!interactive) return;
    
    const itemKey = data[xKey || 'name'] || data.name;
    
    if (selectedItems.includes(itemKey)) {
      setSelectedItems(prev => prev.filter(item => item !== itemKey));
      onFilter?.({ type: 'remove', key: xKey, value: itemKey });
    } else {
      setSelectedItems(prev => [...prev, itemKey]);
      onFilter?.({ type: 'add', key: xKey, value: itemKey });
    }
    
    onItemClick?.(data);
  }, [interactive, selectedItems, xKey, onFilter, onItemClick]);

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart 
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar 
              dataKey={yKey} 
              fill={colors[0]}
              onClick={interactive ? handleItemClick : undefined}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
            >
              {data.map((entry, index) => {
                const itemKey = entry[xKey || 'name'] || entry.name;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={selectedItems.includes(itemKey) ? colors[1] : colors[0]}
                    stroke={selectedItems.includes(itemKey) ? '#000' : 'none'}
                    strokeWidth={selectedItems.includes(itemKey) ? 2 : 0}
                  />
                );
              })}
            </Bar>
            {enableBrush && height > 250 && (
              <Brush 
                dataKey={xKey} 
                height={30} 
                stroke={colors[0]}
                fill={colors[2]}
                opacity={0.3}
              />
            )}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <Pie
              data={data}
              dataKey={yKey}
              nameKey={xKey}
              cx="50%"
              cy="50%"
              outerRadius={Math.min(height * 0.25, 120)}
              onClick={interactive ? handleItemClick : undefined}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
              label={({percent}) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => {
                const itemKey = entry[xKey || 'name'] || entry.name;
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={colors[index % colors.length]}
                    stroke={selectedItems.includes(itemKey) ? '#000' : 'none'}
                    strokeWidth={selectedItems.includes(itemKey) ? 3 : 0}
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        );

      case 'line':
        return (
          <LineChart 
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke={colors[0]} 
              strokeWidth={3}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[1], strokeWidth: 2 }}
            />
            {enableBrush && height > 250 && (
              <Brush 
                dataKey={xKey} 
                height={30} 
                stroke={colors[0]}
                fill={colors[2]}
                opacity={0.3}
              />
            )}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart 
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={xKey} 
              tick={{ fontSize: 12 }}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey={yKey} 
              stroke={colors[0]} 
              fill={colors[0]}
              fillOpacity={0.4}
              strokeWidth={2}
            />
            {enableBrush && height > 250 && (
              <Brush 
                dataKey={xKey} 
                height={30} 
                stroke={colors[0]}
                fill={colors[2]}
                opacity={0.3}
              />
            )}
          </AreaChart>
        );

      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer width={width || "100%"} height={height}>
      {renderChart()}
    </ResponsiveContainer>
  );
};