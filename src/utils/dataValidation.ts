// utils/dataValidation.ts
import { DataInsightsService } from '../services/dataInsightsService';

export class DataValidation {
  
  // Expected values from data_insights_q1_2023.json for validation
  private static readonly EXPECTED_VALUES = {
    totalCollections: 29945,
    totalGallons: 1671702,
    averageGallonsPerCollection: 55.83,
    uniqueEntities: 3314,
    uniqueProviders: 66,
    uniqueVehicles: 167,
    uniqueAreas: 23,
    uniqueZones: 7,
    uniqueCategories: 11,
    durationDays: 89,
    // Top area
    topAreaName: 'Al Quoz',
    topAreaCollections: 7952,
    topAreaGallons: 553948,
    topAreaPercentage: 26.56
  };

  static async validateKPIData(): Promise<{isValid: boolean, errors: string[]}> {
    const errors: string[] = [];
    
    try {
      const kpiData = await DataInsightsService.getKPIData();
      
      // Validate core metrics
      if (kpiData.totalCollections !== this.EXPECTED_VALUES.totalCollections) {
        errors.push(`Total collections mismatch: expected ${this.EXPECTED_VALUES.totalCollections}, got ${kpiData.totalCollections}`);
      }
      
      if (kpiData.totalGallons !== this.EXPECTED_VALUES.totalGallons) {
        errors.push(`Total gallons mismatch: expected ${this.EXPECTED_VALUES.totalGallons}, got ${kpiData.totalGallons}`);
      }
      
      if (Math.abs(kpiData.avgCollectionSize - this.EXPECTED_VALUES.averageGallonsPerCollection) > 0.01) {
        errors.push(`Average collection size mismatch: expected ${this.EXPECTED_VALUES.averageGallonsPerCollection}, got ${kpiData.avgCollectionSize}`);
      }
      
      if (kpiData.uniqueLocations !== this.EXPECTED_VALUES.uniqueEntities) {
        errors.push(`Unique entities mismatch: expected ${this.EXPECTED_VALUES.uniqueEntities}, got ${kpiData.uniqueLocations}`);
      }
      
      if (kpiData.uniqueProviders !== this.EXPECTED_VALUES.uniqueProviders) {
        errors.push(`Unique providers mismatch: expected ${this.EXPECTED_VALUES.uniqueProviders}, got ${kpiData.uniqueProviders}`);
      }
      
      if (kpiData.uniqueVehicles !== this.EXPECTED_VALUES.uniqueVehicles) {
        errors.push(`Unique vehicles mismatch: expected ${this.EXPECTED_VALUES.uniqueVehicles}, got ${kpiData.uniqueVehicles}`);
      }
      
      if (kpiData.uniqueAreas !== this.EXPECTED_VALUES.uniqueAreas) {
        errors.push(`Unique areas mismatch: expected ${this.EXPECTED_VALUES.uniqueAreas}, got ${kpiData.uniqueAreas}`);
      }
      
      if (kpiData.uniqueZones !== this.EXPECTED_VALUES.uniqueZones) {
        errors.push(`Unique zones mismatch: expected ${this.EXPECTED_VALUES.uniqueZones}, got ${kpiData.uniqueZones}`);
      }
      
      if (kpiData.uniqueCategories !== this.EXPECTED_VALUES.uniqueCategories) {
        errors.push(`Unique categories mismatch: expected ${this.EXPECTED_VALUES.uniqueCategories}, got ${kpiData.uniqueCategories}`);
      }
      
      if (kpiData.dateRange.duration_days !== this.EXPECTED_VALUES.durationDays) {
        errors.push(`Duration days mismatch: expected ${this.EXPECTED_VALUES.durationDays}, got ${kpiData.dateRange.duration_days}`);
      }
      
      // Calculate daily average and verify it's reasonable
      const expectedDailyAverage = Math.round(this.EXPECTED_VALUES.totalGallons / this.EXPECTED_VALUES.durationDays);
      if (Math.abs(kpiData.avgDailyGallons - expectedDailyAverage) > 1) {
        errors.push(`Daily average calculation error: expected ~${expectedDailyAverage}, got ${kpiData.avgDailyGallons}`);
      }
      
    } catch (error) {
      errors.push(`Failed to load KPI data: ${error}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static async validateGeographicData(): Promise<{isValid: boolean, errors: string[]}> {
    const errors: string[] = [];
    
    try {
      const geographicData = await DataInsightsService.getGeographicData();
      
      if (geographicData.length !== this.EXPECTED_VALUES.uniqueAreas) {
        errors.push(`Geographic areas count mismatch: expected ${this.EXPECTED_VALUES.uniqueAreas}, got ${geographicData.length}`);
      }
      
      // Check top area
      const topArea = geographicData.find(area => area.area === this.EXPECTED_VALUES.topAreaName);
      if (!topArea) {
        errors.push(`Top area '${this.EXPECTED_VALUES.topAreaName}' not found in geographic data`);
      } else {
        if (topArea.collection_count !== this.EXPECTED_VALUES.topAreaCollections) {
          errors.push(`Top area collections mismatch: expected ${this.EXPECTED_VALUES.topAreaCollections}, got ${topArea.collection_count}`);
        }
        
        if (topArea.total_gallons !== this.EXPECTED_VALUES.topAreaGallons) {
          errors.push(`Top area gallons mismatch: expected ${this.EXPECTED_VALUES.topAreaGallons}, got ${topArea.total_gallons}`);
        }
        
        if (Math.abs(topArea.percentage - this.EXPECTED_VALUES.topAreaPercentage) > 0.01) {
          errors.push(`Top area percentage mismatch: expected ${this.EXPECTED_VALUES.topAreaPercentage}, got ${topArea.percentage}`);
        }
      }
      
      // Verify total collections add up correctly
      const totalCollections = geographicData.reduce((sum, area) => sum + area.collection_count, 0);
      if (totalCollections !== this.EXPECTED_VALUES.totalCollections) {
        errors.push(`Geographic total collections don't add up: expected ${this.EXPECTED_VALUES.totalCollections}, got ${totalCollections}`);
      }
      
      // Verify zone mapping
      const uniqueZones = new Set(geographicData.map(area => area.zone)).size;
      if (uniqueZones !== this.EXPECTED_VALUES.uniqueZones) {
        errors.push(`Zone mapping error: expected ${this.EXPECTED_VALUES.uniqueZones} zones, got ${uniqueZones}`);
      }
      
    } catch (error) {
      errors.push(`Failed to load geographic data: ${error}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static async validateCategoryData(): Promise<{isValid: boolean, errors: string[]}> {
    const errors: string[] = [];
    
    try {
      const categoryData = await DataInsightsService.getCategoryData();
      
      if (categoryData.length !== this.EXPECTED_VALUES.uniqueCategories) {
        errors.push(`Categories count mismatch: expected ${this.EXPECTED_VALUES.uniqueCategories}, got ${categoryData.length}`);
      }
      
      // Verify total collections add up correctly
      const totalCollections = categoryData.reduce((sum, category) => sum + category.collection_count, 0);
      if (totalCollections !== this.EXPECTED_VALUES.totalCollections) {
        errors.push(`Category total collections don't add up: expected ${this.EXPECTED_VALUES.totalCollections}, got ${totalCollections}`);
      }
      
      // Verify percentages add up to ~100%
      const totalPercentage = categoryData.reduce((sum, category) => sum + category.percentage, 0);
      if (Math.abs(totalPercentage - 100) > 0.1) {
        errors.push(`Category percentages don't add up to 100%: got ${totalPercentage.toFixed(2)}%`);
      }
      
      // Check that Restaurant is the top category (should be ~48.5%)
      const restaurantCategory = categoryData.find(cat => cat.category === 'Restaurant');
      if (!restaurantCategory) {
        errors.push(`Restaurant category not found`);
      } else if (Math.abs(restaurantCategory.percentage - 48.5) > 1) {
        errors.push(`Restaurant percentage unexpected: expected ~48.5%, got ${restaurantCategory.percentage}%`);
      }
      
    } catch (error) {
      errors.push(`Failed to load category data: ${error}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  static async runAllValidations(): Promise<{isValid: boolean, results: Record<string, {isValid: boolean, errors: string[]}>}> {
    const results = {
      kpi: await this.validateKPIData(),
      geographic: await this.validateGeographicData(),
      category: await this.validateCategoryData()
    };
    
    const isValid = Object.values(results).every(result => result.isValid);
    
    return { isValid, results };
  }
  
  static logValidationResults(results: Record<string, {isValid: boolean, errors: string[]}>) {
    console.log('=== Data Validation Results ===');
    
    Object.entries(results).forEach(([testName, result]) => {
      if (result.isValid) {
        console.log(`✅ ${testName}: PASSED`);
      } else {
        console.log(`❌ ${testName}: FAILED`);
        result.errors.forEach(error => console.log(`   - ${error}`));
      }
    });
  }
}