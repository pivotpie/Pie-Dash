// Examples of how to use the new zones and areas functionality

import { AnalyticsService } from '../services/supabaseClient';

// Example 1: Get all zones
async function getAllZones() {
  try {
    const zones = await AnalyticsService.getZones();
    console.log('All zones:', zones);
    return zones;
  } catch (error) {
    console.error('Error fetching zones:', error);
  }
}

// Example 2: Get areas for a specific zone
async function getAreasForZone(zoneId: string) {
  try {
    const areas = await AnalyticsService.getAreas(zoneId);
    console.log(`Areas in zone ${zoneId}:`, areas);
    return areas;
  } catch (error) {
    console.error('Error fetching areas:', error);
  }
}

// Example 3: Get areas with zone information
async function getAreasWithZoneInfo() {
  try {
    const areasWithZones = await AnalyticsService.getAreasWithZones();
    console.log('Areas with zone info:', areasWithZones);
    return areasWithZones;
  } catch (error) {
    console.error('Error fetching areas with zones:', error);
  }
}

// Example 4: Get location hierarchy summary
async function getLocationStats() {
  try {
    const summary = await AnalyticsService.getLocationHierarchy();
    console.log('Location summary:', summary);
    return summary;
  } catch (error) {
    console.error('Error fetching location hierarchy:', error);
  }
}

// Example 5: Get services with full location information
async function getServicesWithLocationInfo() {
  try {
    const services = await AnalyticsService.getServicesWithLocation(50);
    console.log('Services with location info:', services);
    return services;
  } catch (error) {
    console.error('Error fetching services with location:', error);
  }
}

// Example 6: Create a new zone
async function createNewZone(zoneId: string, zoneName: string) {
  try {
    const newZone = await AnalyticsService.createZone({
      zone_id: zoneId,
      zone_name: zoneName
    });
    console.log('Created zone:', newZone);
    return newZone;
  } catch (error) {
    console.error('Error creating zone:', error);
  }
}

// Example 7: Create a new area
async function createNewArea(areaId: string, areaName: string, zoneId: string) {
  try {
    const newArea = await AnalyticsService.createArea({
      area_id: areaId,
      area_name: areaName,
      zone_id: zoneId
    });
    console.log('Created area:', newArea);
    return newArea;
  } catch (error) {
    console.error('Error creating area:', error);
  }
}

export {
  getAllZones,
  getAreasForZone,
  getAreasWithZoneInfo,
  getLocationStats,
  getServicesWithLocationInfo,
  createNewZone,
  createNewArea
};