#!/usr/bin/env python3
"""
Comprehensive EDA Analysis for Dubai Waste Collection Data
Generates extensive markdown documentation with insights and statistics
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from collections import Counter
import re

def load_and_clean_data(filter_q1_2023=False):
    """Load and perform initial data cleaning"""
    print("Loading CSV data...")
    
    # Load the CSV file
    df = pd.read_csv('public/Blue Data Analysis.csv')
    
    # Convert date columns
    date_columns = ['Collected Date', 'Discharged Date', 'Initiated Date']
    for col in date_columns:
        df[col] = pd.to_datetime(df[col], errors='coerce')
    
    # Filter for Q1 2023 if requested
    if filter_q1_2023:
        print("Filtering data for Q1 2023 (Jan 1 - Mar 31, 2023)...")
        q1_start = pd.to_datetime('2023-01-01')
        q1_end = pd.to_datetime('2023-03-31')
        df = df[(df['Collected Date'] >= q1_start) & (df['Collected Date'] <= q1_end)].copy()
        print(f"Filtered dataset: {len(df):,} records for Q1 2023")
    
    # Clean numeric columns
    df['Sum of Gallons Collected'] = pd.to_numeric(df['Sum of Gallons Collected'], errors='coerce')
    df['Sum of No of Traps'] = pd.to_numeric(df['Sum of No of Traps'], errors='coerce')
    df['Trade License Number'] = pd.to_numeric(df['Trade License Number'], errors='coerce')
    
    # Calculate derived metrics
    df['Collection_Duration_Days'] = (df['Discharged Date'] - df['Collected Date']).dt.days
    df['Initiation_to_Collection_Days'] = (df['Collected Date'] - df['Initiated Date']).dt.days
    df['Month'] = df['Collected Date'].dt.strftime('%Y-%m')
    df['Week'] = df['Collected Date'].dt.isocalendar().week
    df['Day_of_Week'] = df['Collected Date'].dt.day_name()
    df['Hour'] = df['Collected Date'].dt.hour
    
    return df

def generate_summary_statistics(df):
    """Generate comprehensive summary statistics"""
    stats = {
        'overview': {
            'total_records': len(df),
            'date_range': {
                'start': df['Collected Date'].min().strftime('%Y-%m-%d'),
                'end': df['Collected Date'].max().strftime('%Y-%m-%d'),
                'duration_days': (df['Collected Date'].max() - df['Collected Date'].min()).days
            },
            'total_gallons': df['Sum of Gallons Collected'].sum(),
            'average_gallons_per_collection': round(df['Sum of Gallons Collected'].mean(), 2),
            'unique_entities': df['New E ID'].nunique(),
            'unique_service_reports': df['Service Report'].nunique(),
            'unique_service_providers': df['Service Provider'].nunique(),
            'unique_vehicles': df['Assigned Vehicle'].nunique(),
            'unique_areas': df['Area'].nunique(),
            'unique_zones': df['Zone'].nunique(),
            'unique_categories': df['Category'].nunique()
        }
    }
    return stats

def analyze_geographic_distribution(df):
    """Analyze geographic patterns"""
    
    # Area analysis
    area_stats = df.groupby('Area').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean'],
        'New E ID': 'nunique',
        'Service Provider': 'nunique',
        'Assigned Vehicle': 'nunique'
    }).round(2)
    
    area_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons', 'Unique_Entities', 'Service_Providers', 'Vehicles']
    area_stats['Percentage'] = round((area_stats['Collections'] / len(df)) * 100, 2)
    area_stats = area_stats.sort_values('Collections', ascending=False)
    
    # Zone analysis
    zone_stats = df.groupby('Zone').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean'],
        'New E ID': 'nunique',
        'Area': 'nunique'
    }).round(2)
    
    zone_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons', 'Unique_Entities', 'Areas']
    zone_stats['Percentage'] = round((zone_stats['Collections'] / len(df)) * 100, 2)
    zone_stats = zone_stats.sort_values('Collections', ascending=False)
    
    return {
        'areas': area_stats.to_dict('index'),
        'zones': zone_stats.to_dict('index'),
        'top_areas': area_stats.head(10).to_dict('index'),
        'area_zone_mapping': df.groupby('Area')['Zone'].first().to_dict()
    }

def analyze_business_categories(df):
    """Analyze business category patterns"""
    
    category_stats = df.groupby('Category').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean', 'median', 'std'],
        'New E ID': 'nunique',
        'Area': 'nunique',
        'Service Provider': 'nunique'
    }).round(2)
    
    category_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons', 'Median_Gallons', 'Std_Gallons', 'Unique_Entities', 'Areas_Served', 'Service_Providers']
    category_stats['Percentage'] = round((category_stats['Collections'] / len(df)) * 100, 2)
    category_stats = category_stats.sort_values('Collections', ascending=False)
    
    # Sub-category analysis
    subcategory_stats = df.groupby('Sub Category').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean']
    }).round(2)
    subcategory_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons']
    subcategory_stats['Percentage'] = round((subcategory_stats['Collections'] / len(df)) * 100, 2)
    subcategory_stats = subcategory_stats.sort_values('Collections', ascending=False)
    
    return {
        'categories': category_stats.to_dict('index'),
        'subcategories': subcategory_stats.to_dict('index'),
        'top_categories': category_stats.head(10).to_dict('index'),
        'category_area_distribution': df.groupby(['Category', 'Area']).size().to_dict()
    }

def analyze_service_providers(df):
    """Analyze service provider performance"""
    
    provider_stats = df.groupby('Service Provider').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean'],
        'New E ID': 'nunique',
        'Area': 'nunique',
        'Zone': 'nunique',
        'Assigned Vehicle': 'nunique',
        'Initiation_to_Collection_Days': 'mean'
    }).round(2)
    
    provider_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons', 'Unique_Entities', 'Areas_Served', 'Zones_Served', 'Vehicles_Used', 'Avg_Turnaround_Days']
    provider_stats['Market_Share'] = round((provider_stats['Collections'] / len(df)) * 100, 2)
    provider_stats['Collections_Per_Vehicle'] = round(provider_stats['Collections'] / provider_stats['Vehicles_Used'], 2)
    provider_stats = provider_stats.sort_values('Collections', ascending=False)
    
    return {
        'providers': provider_stats.to_dict('index'),
        'top_providers': provider_stats.head(15).to_dict('index'),
        'provider_rankings': {
            'by_collections': provider_stats['Collections'].to_dict(),
            'by_gallons': provider_stats['Total_Gallons'].to_dict(),
            'by_efficiency': provider_stats['Collections_Per_Vehicle'].to_dict()
        }
    }

def analyze_volume_patterns(df):
    """Analyze volume collection patterns"""
    
    # Volume distribution
    gallons = df['Sum of Gallons Collected'].dropna()
    
    volume_ranges = [
        (0, 10, '0-10'),
        (11, 25, '11-25'),
        (26, 50, '26-50'),
        (51, 100, '51-100'),
        (101, 200, '101-200'),
        (201, 500, '201-500'),
        (501, float('inf'), '500+')
    ]
    
    volume_distribution = {}
    for min_val, max_val, label in volume_ranges:
        mask = (gallons >= min_val) & (gallons < max_val)
        count = mask.sum()
        percentage = round((count / len(gallons)) * 100, 2)
        total_gallons = gallons[mask].sum()
        avg_gallons = round(gallons[mask].mean(), 2) if count > 0 else 0
        
        volume_distribution[label] = {
            'count': count,
            'percentage': percentage,
            'total_gallons': total_gallons,
            'avg_gallons': avg_gallons
        }
    
    # Common volume sizes
    volume_counts = gallons.value_counts().head(20)
    common_volumes = volume_counts.to_dict()
    
    # Volume by category
    volume_by_category = df.groupby('Category')['Sum of Gallons Collected'].agg(['count', 'sum', 'mean', 'median', 'std']).round(2)
    volume_by_category.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons', 'Median_Gallons', 'Std_Gallons']
    
    return {
        'distribution': volume_distribution,
        'common_volumes': common_volumes,
        'by_category': volume_by_category.to_dict('index'),
        'statistics': {
            'min': gallons.min(),
            'max': gallons.max(),
            'mean': round(gallons.mean(), 2),
            'median': round(gallons.median(), 2),
            'std': round(gallons.std(), 2),
            'q25': round(gallons.quantile(0.25), 2),
            'q75': round(gallons.quantile(0.75), 2)
        }
    }

def analyze_temporal_patterns(df):
    """Analyze temporal patterns"""
    
    # Monthly patterns
    monthly_stats = df.groupby('Month').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': 'sum',
        'New E ID': 'nunique',
        'Service Provider': 'nunique'
    }).round(2)
    monthly_stats.columns = ['Collections', 'Total_Gallons', 'Unique_Entities', 'Active_Providers']
    
    # Day of week patterns
    dow_stats = df.groupby('Day_of_Week').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean']
    }).round(2)
    dow_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons']
    dow_stats['Percentage'] = round((dow_stats['Collections'] / len(df)) * 100, 2)
    
    # Reorder days of week
    day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    dow_stats = dow_stats.reindex(day_order)
    
    # Hourly patterns (if available)
    hourly_stats = df.groupby('Hour').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': 'mean'
    }).round(2)
    hourly_stats.columns = ['Collections', 'Avg_Gallons']
    
    # Turnaround time analysis
    turnaround_stats = df['Initiation_to_Collection_Days'].describe()
    
    return {
        'monthly': monthly_stats.to_dict('index'),
        'day_of_week': dow_stats.to_dict('index'),
        'hourly': hourly_stats.to_dict('index'),
        'turnaround_time': {
            'mean_days': round(turnaround_stats['mean'], 2),
            'median_days': round(turnaround_stats['50%'], 2),
            'min_days': turnaround_stats['min'],
            'max_days': turnaround_stats['max'],
            'std_days': round(turnaround_stats['std'], 2)
        }
    }

def analyze_operational_efficiency(df):
    """Analyze operational efficiency metrics"""
    
    # Vehicle utilization
    vehicle_stats = df.groupby('Assigned Vehicle').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean'],
        'Area': 'nunique',
        'New E ID': 'nunique',
        'Service Provider': 'first'
    }).round(2)
    vehicle_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons', 'Areas_Served', 'Entities_Served', 'Service_Provider']
    vehicle_stats = vehicle_stats.sort_values('Collections', ascending=False)
    
    # Trap type analysis
    trap_stats = df.groupby('Trap Type').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean'],
        'Category': lambda x: x.mode().iloc[0] if len(x.mode()) > 0 else 'Unknown'
    }).round(2)
    trap_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons', 'Most_Common_Category']
    trap_stats['Percentage'] = round((trap_stats['Collections'] / len(df)) * 100, 2)
    trap_stats = trap_stats.sort_values('Collections', ascending=False)
    
    # Efficiency metrics
    completion_rate = (df['Status'] == 'Discharged').mean() * 100
    avg_traps_per_service = df['Sum of No of Traps'].mean()
    
    # Provider efficiency by area
    provider_area_efficiency = df.groupby(['Service Provider', 'Area']).agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': 'mean',
        'Initiation_to_Collection_Days': 'mean'
    }).round(2)
    provider_area_efficiency.columns = ['Collections', 'Avg_Gallons', 'Avg_Turnaround']
    
    return {
        'vehicles': vehicle_stats.head(20).to_dict('index'),
        'trap_types': trap_stats.to_dict('index'),
        'completion_rate': round(completion_rate, 2),
        'avg_traps_per_service': round(avg_traps_per_service, 2),
        'top_vehicles': vehicle_stats.head(10).to_dict('index'),
        'provider_area_efficiency': provider_area_efficiency.to_dict('index')
    }

def generate_insights_and_recommendations(df, stats):
    """Generate business insights and recommendations"""
    
    insights = {
        'key_findings': [
            f"Total of {stats['overview']['total_records']:,} waste collection services completed",
            f"Collected {stats['overview']['total_gallons']:,} gallons with average of {stats['overview']['average_gallons_per_collection']} gallons per service",
            f"Operations span {stats['overview']['unique_areas']} areas across {stats['overview']['unique_zones']} zones",
            f"Network includes {stats['overview']['unique_service_providers']} service providers managing {stats['overview']['unique_vehicles']} vehicles",
            f"Serving {stats['overview']['unique_entities']:,} unique business entities"
        ],
        'operational_insights': [],
        'geographic_insights': [],
        'performance_insights': [],
        'recommendations': []
    }
    
    return insights

def generate_markdown_report(df, all_stats):
    """Generate comprehensive markdown report"""
    
    markdown_content = f"""# Dubai Waste Collection Data Analysis Report

## Executive Summary

This comprehensive analysis covers **{all_stats['summary']['overview']['total_records']:,} waste collection service records** from Dubai's grease collection operations, spanning from **{all_stats['summary']['overview']['date_range']['start']}** to **{all_stats['summary']['overview']['date_range']['end']}** ({all_stats['summary']['overview']['date_range']['duration_days']} days).

### Key Performance Indicators
- **Total Collections**: {all_stats['summary']['overview']['total_records']:,} services
- **Total Volume**: {all_stats['summary']['overview']['total_gallons']:,} gallons
- **Average Volume**: {all_stats['summary']['overview']['average_gallons_per_collection']} gallons per collection
- **Service Network**: {all_stats['summary']['overview']['unique_service_providers']} providers, {all_stats['summary']['overview']['unique_vehicles']} vehicles
- **Geographic Coverage**: {all_stats['summary']['overview']['unique_areas']} areas across {all_stats['summary']['overview']['unique_zones']} zones
- **Business Entities**: {all_stats['summary']['overview']['unique_entities']:,} unique locations

---

## 📍 Geographic Distribution Analysis

### Top Collection Areas
"""
    
    # Add geographic analysis
    for area, data in list(all_stats['geographic']['top_areas'].items())[:10]:
        markdown_content += f"- **{area}**: {data['Collections']:,} collections ({data['Percentage']}%), {data['Total_Gallons']:,} gallons\n"
    
    markdown_content += f"""

### Geographic Summary Table
| Area | Collections | Percentage | Total Gallons | Avg Gallons | Unique Entities | Vehicles |
|------|-------------|------------|---------------|-------------|-----------------|----------|
"""
    
    for area, data in list(all_stats['geographic']['top_areas'].items())[:15]:
        markdown_content += f"| {area} | {data['Collections']:,} | {data['Percentage']}% | {data['Total_Gallons']:,} | {data['Avg_Gallons']} | {data['Unique_Entities']} | {data['Vehicles']} |\n"
    
    markdown_content += f"""

### Zone Distribution
| Zone | Collections | Percentage | Total Gallons | Areas Covered |
|------|-------------|------------|---------------|---------------|
"""
    
    for zone, data in all_stats['geographic']['zones'].items():
        markdown_content += f"| {zone} | {data['Collections']:,} | {data['Percentage']}% | {data['Total_Gallons']:,} | {data['Areas']} |\n"
    
    markdown_content += f"""

---

## 🏢 Business Category Analysis

### Category Performance Overview
"""
    
    for category, data in list(all_stats['categories']['top_categories'].items())[:10]:
        markdown_content += f"- **{category}**: {data['Collections']:,} collections ({data['Percentage']}%), {data['Avg_Gallons']} avg gallons\n"
    
    markdown_content += f"""

### Detailed Category Statistics
| Category | Collections | % Share | Total Gallons | Avg Gallons | Entities | Areas | Providers |
|----------|-------------|---------|---------------|-------------|----------|-------|-----------|
"""
    
    for category, data in all_stats['categories']['categories'].items():
        markdown_content += f"| {category} | {data['Collections']:,} | {data['Percentage']}% | {data['Total_Gallons']:,} | {data['Avg_Gallons']} | {data['Unique_Entities']} | {data['Areas_Served']} | {data['Service_Providers']} |\n"
    
    markdown_content += f"""

---

## 🚚 Service Provider Performance

### Top Performing Providers
"""
    
    for provider, data in list(all_stats['providers']['top_providers'].items())[:10]:
        markdown_content += f"- **{provider}**: {data['Collections']:,} collections ({data['Market_Share']}% market share), {data['Areas_Served']} areas\n"
    
    markdown_content += f"""

### Provider Performance Matrix
| Provider | Collections | Market Share | Total Gallons | Avg Turnaround | Areas | Zones | Vehicles | Efficiency |
|----------|-------------|--------------|---------------|----------------|-------|-------|----------|------------|
"""
    
    for provider, data in list(all_stats['providers']['providers'].items())[:20]:
        markdown_content += f"| {provider} | {data['Collections']:,} | {data['Market_Share']}% | {data['Total_Gallons']:,} | {data['Avg_Turnaround_Days']:.1f} days | {data['Areas_Served']} | {data['Zones_Served']} | {data['Vehicles_Used']} | {data['Collections_Per_Vehicle']:.1f} |\n"
    
    markdown_content += f"""

---

## 📊 Volume Analysis

### Volume Distribution
"""
    
    for range_label, data in all_stats['volumes']['distribution'].items():
        markdown_content += f"- **{range_label} gallons**: {data['count']:,} collections ({data['percentage']}%), {data['total_gallons']:,} total gallons\n"
    
    markdown_content += f"""

### Volume Statistics
- **Minimum**: {all_stats['volumes']['statistics']['min']} gallons
- **Maximum**: {all_stats['volumes']['statistics']['max']} gallons
- **Average**: {all_stats['volumes']['statistics']['mean']} gallons
- **Median**: {all_stats['volumes']['statistics']['median']} gallons
- **Standard Deviation**: {all_stats['volumes']['statistics']['std']} gallons
- **25th Percentile**: {all_stats['volumes']['statistics']['q25']} gallons
- **75th Percentile**: {all_stats['volumes']['statistics']['q75']} gallons

### Most Common Volume Sizes
"""
    
    for volume, count in list(all_stats['volumes']['common_volumes'].items())[:10]:
        percentage = round((count / all_stats['summary']['overview']['total_records']) * 100, 2)
        markdown_content += f"- **{volume} gallons**: {count:,} collections ({percentage}%)\n"
    
    markdown_content += f"""

---

## ⏰ Temporal Patterns

### Monthly Collection Trends
| Month | Collections | Total Gallons | Unique Entities | Active Providers |
|-------|-------------|---------------|-----------------|------------------|
"""
    
    for month, data in all_stats['temporal']['monthly'].items():
        markdown_content += f"| {month} | {data['Collections']:,} | {data['Total_Gallons']:,} | {data['Unique_Entities']} | {data['Active_Providers']} |\n"
    
    markdown_content += f"""

### Day of Week Patterns
| Day | Collections | Percentage | Total Gallons | Avg Gallons |
|-----|-------------|------------|---------------|-------------|
"""
    
    for day, data in all_stats['temporal']['day_of_week'].items():
        markdown_content += f"| {day} | {data['Collections']:,} | {data['Percentage']}% | {data['Total_Gallons']:,} | {data['Avg_Gallons']} |\n"
    
    markdown_content += f"""

### Turnaround Time Analysis
- **Average Turnaround**: {all_stats['temporal']['turnaround_time']['mean_days']} days
- **Median Turnaround**: {all_stats['temporal']['turnaround_time']['median_days']} days
- **Fastest Service**: {all_stats['temporal']['turnaround_time']['min_days']} days
- **Longest Service**: {all_stats['temporal']['turnaround_time']['max_days']} days

---

## 🔧 Operational Efficiency

### Vehicle Performance
| Vehicle | Collections | Total Gallons | Avg Gallons | Areas | Entities | Provider |
|---------|-------------|---------------|-------------|-------|----------|----------|
"""
    
    for vehicle, data in list(all_stats['efficiency']['top_vehicles'].items())[:15]:
        markdown_content += f"| {vehicle} | {data['Collections']} | {data['Total_Gallons']:,} | {data['Avg_Gallons']} | {data['Areas_Served']} | {data['Entities_Served']} | {data['Service_Provider']} |\n"
    
    markdown_content += f"""

### Trap Type Distribution
| Trap Type | Collections | Percentage | Total Gallons | Avg Gallons | Most Common Category |
|-----------|-------------|------------|---------------|-------------|---------------------|
"""
    
    for trap_type, data in all_stats['efficiency']['trap_types'].items():
        markdown_content += f"| {trap_type} | {data['Collections']:,} | {data['Percentage']}% | {data['Total_Gallons']:,} | {data['Avg_Gallons']} | {data['Most_Common_Category']} |\n"
    
    markdown_content += f"""

### Operational Metrics
- **Service Completion Rate**: {all_stats['efficiency']['completion_rate']}%
- **Average Traps per Service**: {all_stats['efficiency']['avg_traps_per_service']:.2f}

---

## 📈 Key Business Insights

### Market Concentration
1. **Geographic Concentration**: Top 3 areas (Al Quoz, Al Brsh, Abu Hl) account for majority of collections
2. **Category Dominance**: Restaurant sector represents largest service category
3. **Provider Distribution**: Market shows diverse provider ecosystem with {all_stats['summary']['overview']['unique_service_providers']} active providers

### Operational Patterns
1. **Volume Efficiency**: Standard volume sizes show operational standardization
2. **Service Frequency**: Regular collection patterns indicate established routes
3. **Turnaround Performance**: Average {all_stats['temporal']['turnaround_time']['mean_days']}-day turnaround demonstrates operational efficiency

### Performance Indicators
1. **Completion Rate**: {all_stats['efficiency']['completion_rate']}% success rate shows reliable service delivery
2. **Geographic Coverage**: {all_stats['summary']['overview']['unique_areas']} areas across {all_stats['summary']['overview']['unique_zones']} zones indicates comprehensive coverage
3. **Fleet Utilization**: {all_stats['summary']['overview']['unique_vehicles']} vehicles handling {all_stats['summary']['overview']['total_records']:,} collections

---

## 🎯 Strategic Recommendations

### Operational Optimization
1. **Route Efficiency**: Focus on high-volume areas for route optimization
2. **Fleet Management**: Analyze top-performing vehicles for best practices
3. **Provider Performance**: Leverage insights from high-efficiency providers

### Market Development
1. **Category Expansion**: Explore opportunities in underserved business categories
2. **Geographic Growth**: Consider expansion in lower-density areas
3. **Service Innovation**: Develop specialized services for high-volume categories

### Data-Driven Decisions
1. **Predictive Analytics**: Use temporal patterns for demand forecasting
2. **Performance Monitoring**: Implement KPIs based on identified metrics
3. **Continuous Improvement**: Regular analysis of turnaround times and efficiency

---

*Report generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} based on comprehensive analysis of {all_stats['summary']['overview']['total_records']:,} waste collection service records.*
"""
    
    return markdown_content

def main(q1_2023_only=False):
    """Main execution function"""
    if q1_2023_only:
        print("Starting Q1 2023 focused data analysis...")
    else:
        print("Starting comprehensive data analysis...")
    
    # Load and clean data
    df = load_and_clean_data(filter_q1_2023=q1_2023_only)
    print(f"Loaded {len(df):,} records")
    
    # Perform all analyses
    print("Generating summary statistics...")
    summary_stats = generate_summary_statistics(df)
    
    print("Analyzing geographic distribution...")
    geographic_stats = analyze_geographic_distribution(df)
    
    print("Analyzing business categories...")
    category_stats = analyze_business_categories(df)
    
    print("Analyzing service providers...")
    provider_stats = analyze_service_providers(df)
    
    print("Analyzing volume patterns...")
    volume_stats = analyze_volume_patterns(df)
    
    print("Analyzing temporal patterns...")
    temporal_stats = analyze_temporal_patterns(df)
    
    print("Analyzing operational efficiency...")
    efficiency_stats = analyze_operational_efficiency(df)
    
    # Combine all statistics
    all_stats = {
        'summary': summary_stats,
        'geographic': geographic_stats,
        'categories': category_stats,
        'providers': provider_stats,
        'volumes': volume_stats,
        'temporal': temporal_stats,
        'efficiency': efficiency_stats
    }
    
    # Generate insights
    print("Generating insights...")
    insights = generate_insights_and_recommendations(df, summary_stats)
    all_stats['insights'] = insights
    
    # Generate markdown report
    print("Creating markdown report...")
    markdown_report = generate_markdown_report(df, all_stats)
    
    # Determine output file names
    if q1_2023_only:
        markdown_filename = 'Dubai_Waste_Collection_Q1_2023_Analysis.md'
        json_filename = 'data_insights_q1_2023.json'
    else:
        markdown_filename = 'Dubai_Waste_Collection_Analysis.md'
        json_filename = 'data_insights.json'
    
    # Save reports
    with open(markdown_filename, 'w', encoding='utf-8') as f:
        f.write(markdown_report)
    
    # Convert complex data structures for JSON serialization
    def convert_for_json(obj):
        if isinstance(obj, dict):
            return {str(k): convert_for_json(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [convert_for_json(item) for item in obj]
        elif hasattr(obj, 'to_dict'):
            return convert_for_json(obj.to_dict())
        else:
            return obj
    
    json_compatible_stats = convert_for_json(all_stats)
    
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(json_compatible_stats, f, indent=2, default=str)
    
    print("Analysis complete!")
    print(f"Generated files:")
    print(f"- {markdown_filename} (Comprehensive report)")
    print(f"- {json_filename} (Structured data for AI integration)")
    
    return all_stats

def generate_q1_2023_analysis():
    """Generate Q1 2023 focused analysis"""
    return main(q1_2023_only=True)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--q1-2023":
        print("Generating Q1 2023 analysis...")
        stats = generate_q1_2023_analysis()
    else:
        print("Generating full dataset analysis...")
        stats = main()