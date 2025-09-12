// Dashboard-related types

export interface KPI {
  id: string
  title: string
  value: string | number
  change: string
  trend: 'up' | 'down' | 'stable'
  unit?: string
  description?: string
  target?: number
  status: 'good' | 'warning' | 'critical'
}

export interface ChartData {
  id: string
  name: string
  value: number
  date?: string
  category?: string
  [key: string]: any
}

export interface DashboardConfig {
  id: string
  name: string
  type: 'overview' | 'geographic' | 'category' | 'volume' | 'performance' | 'delays'
  layout: {
    kpis: string[]
    charts: ChartConfig[]
    tables: TableConfig[]
  }
  filters: FilterConfig[]
  refreshInterval: number // in seconds
  permissions: string[]
}

export interface ChartConfig {
  id: string
  title: string
  type: 'line' | 'bar' | 'pie' | 'area' | 'donut' | 'gauge' | 'scatter' | 'map' | 'heatmap'
  dataSource: string
  xAxis?: string
  yAxis?: string
  groupBy?: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  colors?: string[]
  size: 'sm' | 'md' | 'lg' | 'xl'
  position: {
    row: number
    col: number
    width: number
    height: number
  }
}

export interface TableConfig {
  id: string
  title: string
  dataSource: string
  columns: {
    key: string
    title: string
    type: 'text' | 'number' | 'date' | 'status' | 'action'
    sortable: boolean
    filterable: boolean
    width?: string
  }[]
  pagination: boolean
  pageSize: number
  exportable: boolean
}

export interface FilterConfig {
  id: string
  name: string
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'text'
  options?: { label: string; value: any }[]
  defaultValue?: any
  required: boolean
  dependsOn?: string[]
}

export interface DashboardData {
  kpis: KPI[]
  charts: Record<string, ChartData[]>
  tables: Record<string, any[]>
  lastUpdated: string
  metadata: {
    totalRecords: number
    processingTime: number
    dataQuality: 'high' | 'medium' | 'low'
  }
}

// Geographic Dashboard Types
export interface GeographicData {
  regions: Region[]
  performance: RegionalPerformance[]
  heatmapData: HeatmapPoint[]
}

export interface Region {
  id: string
  name: string
  code: string
  boundaries: {
    type: 'Polygon'
    coordinates: number[][][]
  }
  center: {
    lat: number
    lng: number
  }
  population: number
  area: number // in sq km
}

export interface RegionalPerformance {
  regionId: string
  regionName: string
  totalDeliveries: number
  onTimeRate: number
  averageDeliveryTime: number
  customerSatisfaction: number
  revenue: number
  costs: number
  profitMargin: number
  growthRate: number
  issues: string[]
}

export interface HeatmapPoint {
  lat: number
  lng: number
  intensity: number
  value: number
  type: 'delivery_density' | 'delay_frequency' | 'customer_satisfaction'
}

// Volume Dashboard Types
export interface VolumeData {
  daily: DailyVolume[]
  monthly: MonthlyVolume[]
  byCategory: CategoryVolume[]
  capacity: CapacityData
}

export interface DailyVolume {
  date: string
  packages: number
  weight: number
  revenue: number
  averagePackageWeight: number
  peakHour: string
  efficiency: number
}

export interface MonthlyVolume {
  month: string
  packages: number
  weight: number
  revenue: number
  growthRate: number
  seasonalIndex: number
}

export interface CategoryVolume {
  category: string
  packages: number
  weight: number
  revenue: number
  averageDeliveryTime: number
  profitMargin: number
}

export interface CapacityData {
  total: number
  used: number
  available: number
  utilization: number
  forecast: {
    period: string
    projected: number
    confidence: number
  }[]
}

// Performance Dashboard Types
export interface PerformanceData {
  overall: OverallPerformance
  drivers: DriverPerformance[]
  vehicles: VehiclePerformance[]
  routes: RoutePerformance[]
  trends: PerformanceTrend[]
}

export interface OverallPerformance {
  onTimeRate: number
  averageDeliveryTime: number
  customerSatisfaction: number
  costPerDelivery: number
  fuelEfficiency: number
  driverUtilization: number
  vehicleUtilization: number
}

export interface DriverPerformance {
  driverId: string
  name: string
  deliveries: number
  onTimeRate: number
  averageDeliveryTime: number
  customerRating: number
  fuelEfficiency: number
  incidentCount: number
  workingHours: number
  earnings: number
}

export interface VehiclePerformance {
  vehicleId: string
  name: string
  type: string
  deliveries: number
  distance: number
  fuelConsumption: number
  maintenanceCost: number
  downtime: number
  utilization: number
  efficiency: number
}

export interface RoutePerformance {
  routeId: string
  name: string
  distance: number
  averageTime: number
  onTimeRate: number
  trafficImpact: number
  fuelEfficiency: number
  deliveryDensity: number
  profitability: number
}

export interface PerformanceTrend {
  metric: string
  period: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  benchmark: number
}

// Export and Filter Types
export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf' | 'json'
  includeCharts: boolean
  includeRawData: boolean
  dateRange?: {
    start: string
    end: string
  }
  filters?: Record<string, any>
}

export interface DashboardFilter {
  dateRange: {
    start: string
    end: string
    period: 'day' | 'week' | 'month' | 'quarter' | 'year'
  }
  regions: string[]
  categories: string[]
  drivers: string[]
  vehicles: string[]
  status: string[]
  priority: string[]
}