// Database queries and data fetching utilities

import { supabase } from './supabase'

export const queries = {
  // Service queries - grease trap collection services
  services: {
    getAll: async (filters: any = {}) => {
      let query = supabase.from('services').select('*')

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.area) {
        query = query.eq('area', filters.area)
      }

      if (filters.zone) {
        query = query.eq('zone', filters.zone)
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.serviceProvider) {
        query = query.eq('service_provider', filters.serviceProvider)
      }

      if (filters.dateFrom) {
        query = query.gte('collected_date', filters.dateFrom)
      }

      if (filters.dateTo) {
        query = query.lte('collected_date', filters.dateTo)
      }

      const { data, error } = await query.order('collected_date', { ascending: false })
      
      if (error) throw error
      return data
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },

    getByStatus: async (status: string) => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('status', status)
        .order('collected_date', { ascending: false })

      if (error) throw error
      return data
    },

    getByServiceReport: async (serviceReport: string) => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('service_report', serviceReport)
        .single()

      if (error) throw error
      return data
    },

    getMetrics: async (dateRange: { start: string; end: string }) => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          gallons_collected,
          collected_date,
          area,
          category,
          service_provider
        `)
        .gte('collected_date', dateRange.start)
        .lte('collected_date', dateRange.end)

      if (error) throw error
      return data
    }
  },

  // Vehicle queries - grease collection trucks
  vehicles: {
    getAll: async (filters: any = {}) => {
      let query = supabase.from('vehicles').select(`
        *,
        service_provider:service_providers(*)
      `)

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.type) {
        query = query.eq('type', filters.type)
      }

      if (filters.serviceProviderId) {
        query = query.eq('service_provider_id', filters.serviceProviderId)
      }

      const { data, error } = await query.order('vehicle_number')
      
      if (error) throw error
      return data
    },

    getByNumber: async (vehicleNumber: number) => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('vehicle_number', vehicleNumber)
        .single()

      if (error) throw error
      return data
    },

    getActive: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active')
        .order('vehicle_number')

      if (error) throw error
      return data
    },

    getUtilization: async (vehicleNumber?: number) => {
      let query = supabase
        .from('services')
        .select(`
          assigned_vehicle,
          collected_date,
          gallons_collected
        `)

      if (vehicleNumber) {
        query = query.eq('assigned_vehicle', vehicleNumber)
      }

      const { data, error } = await query
        .gte('collected_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('collected_date')

      if (error) throw error
      return data
    }
  },

  // Service Provider queries
  serviceProviders: {
    getAll: async (filters: any = {}) => {
      let query = supabase.from('service_providers').select('*')

      if (filters.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      const { data, error } = await query.order('name')
      
      if (error) throw error
      return data
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },

    getPerformance: async (providerId?: string, dateRange?: { start: string; end: string }) => {
      let query = supabase
        .from('services')
        .select(`
          service_provider,
          gallons_collected,
          collected_date,
          area,
          category
        `)

      if (providerId) {
        query = query.eq('service_provider_id', providerId)
      }

      if (dateRange) {
        query = query
          .gte('collected_date', dateRange.start)
          .lte('collected_date', dateRange.end)
      }

      const { data, error } = await query

      if (error) throw error
      return data
    }
  },

  // Area queries
  areas: {
    getAll: async (filters: any = {}) => {
      let query = supabase.from('areas').select('*')

      if (filters.zone) {
        query = query.eq('zone', filters.zone)
      }

      if (filters.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      const { data, error } = await query.order('area_name')
      
      if (error) throw error
      return data
    },

    getByZone: async (zone: string) => {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .eq('zone', zone)
        .order('area_name')

      if (error) throw error
      return data
    }
  },

  // Business Category queries
  businessCategories: {
    getAll: async (filters: any = {}) => {
      let query = supabase.from('business_categories').select('*')

      if (filters.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      const { data, error } = await query.order('category')
      
      if (error) throw error
      return data
    }
  },

  // Entity queries
  entities: {
    getAll: async (filters: any = {}) => {
      let query = supabase.from('entities').select(`
        *,
        category:business_categories(*),
        area:areas(*)
      `)

      if (filters.active !== undefined) {
        query = query.eq('active', filters.active)
      }

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId)
      }

      if (filters.areaId) {
        query = query.eq('area_id', filters.areaId)
      }

      const { data, error } = await query.order('outlet_name')
      
      if (error) throw error
      return data
    },

    getByEntityId: async (entityId: string) => {
      const { data, error } = await supabase
        .from('entities')
        .select(`
          *,
          category:business_categories(*),
          area:areas(*)
        `)
        .eq('entity_id', entityId)
        .single()

      if (error) throw error
      return data
    }
  },


  // Dashboard Analytics queries - using views
  dashboard: {
    getGeographic: async (filters: any = {}) => {
      let query = supabase.from('dashboard_geographic').select('*')
      
      if (filters.area) {
        query = query.eq('area', filters.area)
      }
      
      if (filters.zone) {
        query = query.eq('zone', filters.zone)
      }

      const { data, error } = await query.order('total_gallons', { ascending: false })
      
      if (error) throw error
      return data
    },

    getCategories: async (filters: any = {}) => {
      let query = supabase.from('dashboard_categories').select('*')
      
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query.order('collection_count', { ascending: false })
      
      if (error) throw error
      return data
    },

    getVolumes: async (filters: any = {}) => {
      let query = supabase.from('dashboard_volumes').select('*')
      
      if (filters.monthsBack) {
        const cutoffDate = new Date()
        cutoffDate.setMonth(cutoffDate.getMonth() - filters.monthsBack)
        query = query.gte('month', cutoffDate.toISOString())
      }

      const { data, error } = await query.order('month', { ascending: false })
      
      if (error) throw error
      return data
    },

    getPerformance: async (filters: any = {}) => {
      let query = supabase.from('dashboard_performance').select('*')
      
      if (filters.serviceProvider) {
        query = query.eq('service_provider', filters.serviceProvider)
      }

      const { data, error } = await query.order('total_collections', { ascending: false })
      
      if (error) throw error
      return data
    },

    getDelays: async (filters: any = {}) => {
      let query = supabase.from('dashboard_delays').select('*')
      
      if (filters.priority) {
        query = query.eq('processing_priority', filters.priority)
      }
      
      if (filters.status) {
        query = query.eq('response_status', filters.status)
      }
      
      if (filters.area) {
        query = query.eq('area', filters.area)
      }

      const { data, error } = await query.order('processing_days', { ascending: false })
      
      if (error) throw error
      return data
    },

    getKPIs: async () => {
      const { data, error } = await supabase
        .from('dashboard_kpis')
        .select('*')
        .single()

      if (error) throw error
      return data
    },

    getRecentActivity: async (limit: number = 10) => {
      const { data, error } = await supabase
        .from('recent_activity')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data
    },

    getMonthlyTrends: async (filters: any = {}) => {
      let query = supabase.from('monthly_trends').select('*')
      
      if (filters.area) {
        query = query.eq('area', filters.area)
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query.order('month', { ascending: false })
      
      if (error) throw error
      return data
    }
  },

  // Delay queries
  delays: {
    getAlerts: async (status: string = 'active') => {
      const { data, error } = await supabase
        .from('delay_alerts')
        .select(`
          *,
          delivery:deliveries(*),
          order:orders(*)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },

    getPredictions: async () => {
      const { data, error } = await supabase
        .rpc('get_delay_predictions')

      if (error) throw error
      return data
    },

    getStatistics: async (dateRange: { start: string; end: string }) => {
      const { data, error } = await supabase
        .rpc('get_delay_statistics', {
          start_date: dateRange.start,
          end_date: dateRange.end
        })

      if (error) throw error
      return data
    }
  },

  // Customer queries
  customers: {
    getAll: async (filters: any = {}) => {
      let query = supabase.from('customers').select(`
        *,
        orders:orders(count),
        addresses:customer_addresses(*)
      `)

      if (filters.loyaltyTier) {
        query = query.eq('loyalty_tier', filters.loyaltyTier)
      }

      if (filters.businessCategory) {
        query = query.eq('business_category', filters.businessCategory)
      }

      const { data, error } = await query.order('name')
      
      if (error) throw error
      return data
    },

    getAnalytics: async (customerId?: string, dateRange?: { start: string; end: string }) => {
      const { data, error } = await supabase
        .rpc('get_customer_analytics', {
          customer_id: customerId,
          start_date: dateRange?.start,
          end_date: dateRange?.end
        })

      if (error) throw error
      return data
    }
  },

  // Performance queries
  performance: {
    getOverall: async (dateRange: { start: string; end: string }) => {
      const { data, error } = await supabase
        .rpc('get_overall_performance', {
          start_date: dateRange.start,
          end_date: dateRange.end
        })

      if (error) throw error
      return data
    },

    getTrends: async (metrics: string[], dateRange: { start: string; end: string }) => {
      const { data, error } = await supabase
        .rpc('get_performance_trends', {
          metric_names: metrics,
          start_date: dateRange.start,
          end_date: dateRange.end
        })

      if (error) throw error
      return data
    },

    getBenchmarks: async () => {
      const { data, error } = await supabase
        .from('performance_benchmarks')
        .select('*')
        .eq('active', true)

      if (error) throw error
      return data
    }
  },

  // Real-time queries
  realTime: {
    subscribeToDeliveries: (callback: (payload: any) => void) => {
      return supabase
        .channel('deliveries_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'deliveries' }, 
          callback
        )
        .subscribe()
    },

    subscribeToVehicles: (callback: (payload: any) => void) => {
      return supabase
        .channel('vehicles_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'vehicles' }, 
          callback
        )
        .subscribe()
    },

    subscribeToAlerts: (callback: (payload: any) => void) => {
      return supabase
        .channel('alerts_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'delay_alerts' }, 
          callback
        )
        .subscribe()
    }
  },

  // Search queries
  search: {
    global: async (searchTerm: string, limit: number = 20) => {
      const { data, error } = await supabase
        .rpc('global_search', {
          search_term: searchTerm,
          result_limit: limit
        })

      if (error) throw error
      return data
    },

    deliveries: async (searchTerm: string) => {
      const { data, error } = await supabase
        .from('deliveries')
        .select('*')
        .or(`order_id.ilike.%${searchTerm}%,customer_id.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) throw error
      return data
    },

    locations: async (searchTerm: string) => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) throw error
      return data
    }
  }
}