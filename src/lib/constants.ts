// lib/constants.ts
export const APP_CONFIG = {
  name: 'Waste Collection Platform',
  version: '1.0.0',
  author: 'Your Organization'
};

export const API_ENDPOINTS = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  },
  anthropic: {
    apiUrl: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514'
  },
  osrm: {
    baseUrl: 'https://router.project-osrm.org'
  }
};

export const DATA_CONSTANTS = {
  TOTAL_RECORDS: 29999,
  TOTAL_LOCATIONS: 3315,
  TOTAL_VEHICLES: 167,
  TOTAL_PROVIDERS: 66,
  GEOGRAPHIC_CENTER: [25.2048, 55.2708] as [number, number],
  DEFAULT_PAGE_SIZE: 15,
  MAX_QUERY_RESULTS: 1000
};

export const BUSINESS_CATEGORIES = [
  'Restaurant',
  'Accommodation', 
  'Cafeteria',
  'Catering',
  'Supermarket',
  'Hospital',
  'School',
  'Office',
  'Mall',
  'Hotel',
  'Other'
];

export const ZONES = [
  'Al Quoz',
  'Bur Dub', 
  'Der',
  'Rs Al Khor',
  'Al Quss',
  'Other Zone 1',
  'Other Zone 2'
];

export const COLLECTION_VOLUMES = [5, 10, 11, 15, 25, 28, 40, 100, 135, 250, 600, 1578];

export const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6'
};