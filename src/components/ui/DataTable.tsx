// components/ui/DataTable.tsx - Excel-style in-column filters
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from './button';
import { ChevronUpIcon, ChevronDownIcon, SearchIcon, FilterIcon, XIcon, Check } from 'lucide-react';

interface Column {
  key: string;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  onRowClick?: (row: any) => void;
  pagination?: boolean;
  pageSize?: number;
  searchable?: boolean;
  title?: string;
  enableColumnFilters?: boolean;
}

interface ColumnFilter {
  searchValue: string;
  selectedValues: Set<string>;
  showAll: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  onRowClick,
  pagination = true,
  pageSize = 10,
  searchable = true,
  title,
  enableColumnFilters = true
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilter>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const filterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeFilterColumn && filterRefs.current[activeFilterColumn]) {
        const rect = filterRefs.current[activeFilterColumn]?.getBoundingClientRect();
        if (rect) {
          const clickX = event.clientX;
          const clickY = event.clientY;
          if (
            clickX < rect.left ||
            clickX > rect.right ||
            clickY < rect.top ||
            clickY > rect.bottom
          ) {
            setActiveFilterColumn(null);
          }
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeFilterColumn]);

  // Get unique values for a column
  const getUniqueColumnValues = (columnKey: string) => {
    const values = data.map(row => String(row[columnKey] || '')).filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Initialize column filter
  const initializeColumnFilter = (columnKey: string): ColumnFilter => {
    if (columnFilters[columnKey]) return columnFilters[columnKey];
    
    const uniqueValues = getUniqueColumnValues(columnKey);
    return {
      searchValue: '',
      selectedValues: new Set(uniqueValues),
      showAll: true
    };
  };

  const filteredData = useMemo(() => {
    let filtered = data;
    
    // Apply global search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(column =>
          String(row[column.key] || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    
    // Apply column filters
    Object.entries(columnFilters).forEach(([columnKey, filter]) => {
      if (!filter.showAll && filter.selectedValues.size > 0) {
        filtered = filtered.filter(row => {
          const value = String(row[columnKey] || '');
          return filter.selectedValues.has(value);
        });
      }
    });
    
    return filtered;
  }, [data, searchTerm, columns, columnFilters]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleColumnFilter = (columnKey: string) => {
    if (activeFilterColumn === columnKey) {
      setActiveFilterColumn(null);
    } else {
      setActiveFilterColumn(columnKey);
      if (!columnFilters[columnKey]) {
        setColumnFilters(prev => ({
          ...prev,
          [columnKey]: initializeColumnFilter(columnKey)
        }));
      }
    }
  };

  const updateColumnFilter = (columnKey: string, updates: Partial<ColumnFilter>) => {
    setColumnFilters(prev => ({
      ...prev,
      [columnKey]: { ...prev[columnKey], ...updates }
    }));
    setCurrentPage(1);
  };

  const clearColumnFilter = (columnKey: string) => {
    const uniqueValues = getUniqueColumnValues(columnKey);
    updateColumnFilter(columnKey, {
      searchValue: '',
      selectedValues: new Set(uniqueValues),
      showAll: true
    });
  };

  const clearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
    setCurrentPage(1);
    setActiveFilterColumn(null);
  };

  const hasActiveFilters = searchTerm || Object.values(columnFilters).some(filter => !filter.showAll);

  const renderColumnFilter = (column: Column) => {
    if (activeFilterColumn !== column.key) return null;

    const filter = columnFilters[column.key];
    if (!filter) return null;

    const uniqueValues = getUniqueColumnValues(column.key);
    const filteredValues = uniqueValues.filter(value =>
      value.toLowerCase().includes(filter.searchValue.toLowerCase())
    );

    return (
      <div
        ref={el => filterRefs.current[column.key] = el}
        className="absolute top-full left-0 z-50 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-3 border-b border-gray-200">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={filter.searchValue}
              onChange={(e) => updateColumnFilter(column.key, { searchValue: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                const allSelected = filter.selectedValues.size === uniqueValues.length;
                updateColumnFilter(column.key, {
                  selectedValues: allSelected ? new Set() : new Set(uniqueValues),
                  showAll: !allSelected
                });
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {filter.selectedValues.size === uniqueValues.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={() => clearColumnFilter(column.key)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredValues.map(value => (
              <label key={value} className="flex items-center space-x-2 py-1 px-2 hover:bg-gray-50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={filter.selectedValues.has(value)}
                  onChange={(e) => {
                    const newSelectedValues = new Set(filter.selectedValues);
                    if (e.target.checked) {
                      newSelectedValues.add(value);
                    } else {
                      newSelectedValues.delete(value);
                    }
                    updateColumnFilter(column.key, {
                      selectedValues: newSelectedValues,
                      showAll: newSelectedValues.size === uniqueValues.length
                    });
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700 truncate">{value}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="p-2 border-t border-gray-200 flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveFilterColumn(null)}
          >
            Close
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {(title || searchable) && (
        <div className="flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          <div className="flex items-center space-x-3">
            {searchable && (
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search all columns..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-red-600 hover:bg-red-50"
              >
                <XIcon className="h-4 w-4 mr-1" />
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(column => (
                  <th
                    key={column.key}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex items-center space-x-1 ${
                          column.sortable ? 'cursor-pointer hover:text-gray-700' : ''
                        }`}
                        onClick={() => column.sortable && handleSort(column.key)}
                      >
                        <span>{column.title}</span>
                        {column.sortable && (
                          <div className="flex flex-col">
                            <ChevronUpIcon 
                              className={`h-3 w-3 ${
                                sortConfig?.key === column.key && sortConfig.direction === 'asc' 
                                  ? 'text-blue-500' 
                                  : 'text-gray-300'
                              }`} 
                            />
                            <ChevronDownIcon 
                              className={`h-3 w-3 -mt-1 ${
                                sortConfig?.key === column.key && sortConfig.direction === 'desc' 
                                  ? 'text-blue-500' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          </div>
                        )}
                      </div>
                      
                      {enableColumnFilters && column.filterable !== false && (
                        <div className="relative">
                          <button
                            onClick={() => toggleColumnFilter(column.key)}
                            className={`p-1 hover:bg-gray-200 rounded ${
                              columnFilters[column.key] && !columnFilters[column.key].showAll
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-gray-400'
                            }`}
                          >
                            <FilterIcon className="h-4 w-4" />
                          </button>
                          {renderColumnFilter(column)}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, index) => (
                <tr
                  key={index}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map(column => (
                    <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                      {column.render 
                        ? column.render(row[column.key], row)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && totalPages > 1 && (
          <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)} to{' '}
              {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  Math.abs(page - currentPage) <= 2
                )
                .map(page => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};