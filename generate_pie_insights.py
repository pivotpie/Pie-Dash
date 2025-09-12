#!/usr/bin/env python3
"""
Pie AI Assistant Data Generator
Generates optimized Q1 2023 insights for Dubai grease collection with intelligent delay analysis
Target: 35K-40K tokens for GPT-5 integration
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
from collections import Counter, defaultdict
import re

def load_q1_2023_data():
    """Load and filter data for Q1 2023 only"""
    print("Loading Q1 2023 data...")
    
    # Load the CSV file
    df = pd.read_csv('public/Blue Data Analysis.csv')
    
    # Convert date columns
    df['Collected Date'] = pd.to_datetime(df['Collected Date'], errors='coerce')
    df['Discharged Date'] = pd.to_datetime(df['Discharged Date'], errors='coerce')
    df['Initiated Date'] = pd.to_datetime(df['Initiated Date'], errors='coerce')
    
    # Filter to Q1 2023 only (Jan 1 - Mar 31, 2023)
    q1_2023_start = pd.to_datetime('2023-01-01')
    q1_2023_end = pd.to_datetime('2023-03-31')
    
    df_q1 = df[
        (df['Collected Date'] >= q1_2023_start) & 
        (df['Collected Date'] <= q1_2023_end)
    ].copy()
    
    # Clean numeric columns
    df_q1['Sum of Gallons Collected'] = pd.to_numeric(df_q1['Sum of Gallons Collected'], errors='coerce')
    df_q1['Sum of No of Traps'] = pd.to_numeric(df_q1['Sum of No of Traps'], errors='coerce')
    df_q1['Trade License Number'] = pd.to_numeric(df_q1['Trade License Number'], errors='coerce')
    
    # Calculate operational metrics
    df_q1['Collection_Duration_Days'] = (df_q1['Discharged Date'] - df_q1['Collected Date']).dt.days
    df_q1['Initiation_to_Collection_Days'] = (df_q1['Collected Date'] - df_q1['Initiated Date']).dt.days
    df_q1['Month'] = df_q1['Collected Date'].dt.strftime('%Y-%m')
    df_q1['Week'] = df_q1['Collected Date'].dt.isocalendar().week
    df_q1['Day_of_Week'] = df_q1['Collected Date'].dt.day_name()
    
    print(f"Q1 2023 dataset: {len(df_q1):,} records")
    return df_q1

def calculate_collection_patterns(df):
    """Calculate intelligent collection patterns for delay analysis"""
    print("Calculating collection patterns...")
    
    patterns = {}
    reference_date = pd.to_datetime('2023-04-10')
    
    # Entity-level patterns (by Trade License)
    entity_patterns = []
    for trade_license in df['Trade License Number'].dropna().unique():
        entity_data = df[df['Trade License Number'] == trade_license].sort_values('Collected Date')
        
        if len(entity_data) >= 2:
            # Calculate average interval between collections
            intervals = []
            for i in range(1, len(entity_data)):
                interval = (entity_data.iloc[i]['Collected Date'] - entity_data.iloc[i-1]['Collected Date']).days
                if 1 <= interval <= 120:  # Reasonable interval range
                    intervals.append(interval)
            
            if intervals:
                avg_interval = np.mean(intervals)
                last_collection = entity_data.iloc[-1]['Collected Date']
                days_since_last = (reference_date - last_collection).days
                expected_next = last_collection + timedelta(days=avg_interval)
                days_overdue = (reference_date - expected_next).days
                
                entity_patterns.append({
                    'trade_license': int(trade_license),
                    'entity_id': entity_data.iloc[-1]['New E ID'],
                    'outlet_name': entity_data.iloc[-1]['Entity Mapping.Outlet'],
                    'category': entity_data.iloc[-1]['Category'],
                    'area': entity_data.iloc[-1]['Area'],
                    'zone': entity_data.iloc[-1]['Zone'],
                    'collections_count': len(entity_data),
                    'avg_interval_days': round(avg_interval, 1),
                    'last_collection_date': last_collection.strftime('%Y-%m-%d'),
                    'days_since_last': days_since_last,
                    'days_overdue': max(0, days_overdue),
                    'risk_level': get_risk_level(days_overdue),
                    'avg_gallons': round(entity_data['Sum of Gallons Collected'].mean(), 1)
                })
    
    patterns['entities'] = entity_patterns
    
    # Category-level patterns
    category_patterns = {}
    for category in df['Category'].unique():
        category_data = df[df['Category'] == category]
        intervals = calculate_category_intervals(category_data)
        category_patterns[category] = {
            'avg_interval_days': round(np.mean(intervals), 1) if intervals else 14,
            'collections': len(category_data),
            'avg_gallons': round(category_data['Sum of Gallons Collected'].mean(), 1)
        }
    
    patterns['categories'] = category_patterns
    
    # Geographic patterns
    geographic_patterns = {}
    for area in df['Area'].unique():
        area_data = df[df['Area'] == area]
        intervals = calculate_area_intervals(area_data)
        geographic_patterns[area] = {
            'avg_interval_days': round(np.mean(intervals), 1) if intervals else 14,
            'collections': len(area_data),
            'avg_gallons': round(area_data['Sum of Gallons Collected'].mean(), 1),
            'unique_entities': area_data['New E ID'].nunique()
        }
    
    patterns['geographic'] = geographic_patterns
    
    return patterns

def get_risk_level(days_overdue):
    """Determine risk level based on days overdue"""
    if days_overdue <= 0:
        return 'normal'
    elif days_overdue <= 5:
        return 'upcoming'
    elif days_overdue <= 10:
        return 'warning'
    else:
        return 'critical'

def calculate_category_intervals(category_data):
    """Calculate intervals for a specific category"""
    intervals = []
    for entity_id in category_data['New E ID'].unique():
        entity_data = category_data[category_data['New E ID'] == entity_id].sort_values('Collected Date')
        if len(entity_data) >= 2:
            for i in range(1, len(entity_data)):
                interval = (entity_data.iloc[i]['Collected Date'] - entity_data.iloc[i-1]['Collected Date']).days
                if 1 <= interval <= 120:
                    intervals.append(interval)
    return intervals

def calculate_area_intervals(area_data):
    """Calculate intervals for a specific area"""
    intervals = []
    for entity_id in area_data['New E ID'].unique():
        entity_data = area_data[area_data['New E ID'] == entity_id].sort_values('Collected Date')
        if len(entity_data) >= 2:
            for i in range(1, len(entity_data)):
                interval = (entity_data.iloc[i]['Collected Date'] - entity_data.iloc[i-1]['Collected Date']).days
                if 1 <= interval <= 120:
                    intervals.append(interval)
    return intervals

def generate_pie_insights(df, patterns):
    """Generate comprehensive 7-dimensional analysis for Pie AI"""
    print("Generating Pie insights...")
    
    insights = {
        "pie_assistant_context": {
            "name": "Pie",
            "company": "PivotPie",
            "data_period": "Q1 2023 (January - March 2023)",
            "scope": "Dubai Grease Trap Collection Analysis",
            "reference_date": "2023-04-10",
            "total_records": len(df),
            "date_range": {
                "start": "2023-01-01",
                "end": "2023-03-31",
                "analysis_date": "2023-04-10"
            }
        }
    }
    
    # 1. Overall Analysis
    insights["overall_analysis"] = generate_overall_analysis(df)
    
    # 2. Geographical Analysis
    insights["geographical_analysis"] = generate_geographical_analysis(df)
    
    # 3. Business Category Analysis
    insights["business_category_analysis"] = generate_category_analysis(df)
    
    # 4. Volumetrical Analysis
    insights["volumetrical_analysis"] = generate_volume_analysis(df)
    
    # 5. Service Provider Analysis
    insights["service_provider_analysis"] = generate_provider_analysis(df)
    
    # 6. Operational Analysis
    insights["operational_analysis"] = generate_operational_analysis(df)
    
    # 7. Delays & Alerts Analysis
    insights["delays_alerts_analysis"] = generate_delays_analysis(patterns)
    
    # 8. Enhanced Entity Intelligence
    insights["entity_intelligence"] = generate_entity_intelligence(df, patterns)
    
    # 9. Predictive Patterns
    insights["predictive_patterns"] = generate_predictive_patterns(df, patterns)
    
    # 10. AI Query Examples and Context
    insights["ai_query_examples"] = generate_ai_query_examples()
    
    return insights

def generate_overall_analysis(df):
    """Generate executive summary and key metrics"""
    total_gallons = df['Sum of Gallons Collected'].sum()
    avg_gallons = df['Sum of Gallons Collected'].mean()
    
    return {
        "executive_summary": {
            "total_records": len(df),
            "total_gallons": int(total_gallons),
            "average_gallons_per_collection": round(avg_gallons, 1),
            "unique_entities": df['New E ID'].nunique(),
            "unique_service_providers": df['Service Provider'].nunique(),
            "unique_vehicles": df['Assigned Vehicle'].nunique(),
            "unique_areas": df['Area'].nunique(),
            "unique_zones": df['Zone'].nunique(),
            "unique_categories": df['Category'].nunique(),
            "completion_rate": round((df['Status'] == 'Discharged').mean() * 100, 2)
        },
        "key_performance_indicators": {
            "daily_average_collections": round(len(df) / 90, 1),  # Q1 = ~90 days
            "peak_collection_month": df['Month'].value_counts().index[0],
            "most_active_area": df['Area'].value_counts().index[0],
            "dominant_category": df['Category'].value_counts().index[0],
            "top_provider": df['Service Provider'].value_counts().index[0],
            "average_turnaround_days": round(df['Initiation_to_Collection_Days'].mean(), 1)
        },
        "quarterly_trends": {
            "january_collections": len(df[df['Month'] == '2023-01']),
            "february_collections": len(df[df['Month'] == '2023-02']),
            "march_collections": len(df[df['Month'] == '2023-03']),
            "growth_trend": "Analyzing Q1 2023 progression patterns"
        }
    }

def generate_geographical_analysis(df):
    """Generate area and zone analysis"""
    # Top areas analysis
    area_stats = df.groupby('Area').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean'],
        'New E ID': 'nunique',
        'Service Provider': 'nunique',
        'Assigned Vehicle': 'nunique'
    }).round(1)
    
    area_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons', 'Unique_Entities', 'Service_Providers', 'Vehicles']
    area_stats['Percentage'] = round((area_stats['Collections'] / len(df)) * 100, 2)
    area_stats = area_stats.sort_values('Collections', ascending=False)
    
    # Zone analysis
    zone_stats = df.groupby('Zone').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean'],
        'New E ID': 'nunique',
        'Area': 'nunique'
    }).round(1)
    
    zone_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons', 'Unique_Entities', 'Areas']
    zone_stats['Percentage'] = round((zone_stats['Collections'] / len(df)) * 100, 2)
    zone_stats = zone_stats.sort_values('Collections', ascending=False)
    
    # Detailed area analysis (optimized)
    detailed_area_analysis = {}
    for area in area_stats.head(8).index:  # Reduced from 10 to 8
        area_data = df[df['Area'] == area]
        detailed_area_analysis[area] = {
            'summary': area_stats.loc[area].to_dict(),
            'top_entities_count': area_data.groupby('New E ID')['Sum of Gallons Collected'].sum().sort_values(ascending=False).head(10).to_dict(),
            'category_breakdown': area_data['Category'].value_counts().to_dict(),
            'provider_distribution': area_data['Service Provider'].value_counts().head(5).to_dict(),
            'monthly_trends': area_data.groupby('Month')['Sum of Gallons Collected'].sum().to_dict()
        }
    
    return {
        "top_areas": area_stats.to_dict('index'),
        "zone_distribution": zone_stats.to_dict('index'),
        "detailed_area_analysis": detailed_area_analysis,
        "geographic_insights": {
            "most_active_area": area_stats.index[0],
            "highest_volume_area": area_stats.sort_values('Total_Gallons', ascending=False).index[0],
            "most_efficient_area": area_stats.sort_values('Avg_Gallons', ascending=False).index[0],
            "geographic_concentration": f"Top 3 areas handle {area_stats.head(3)['Percentage'].sum():.1f}% of collections"
        }
    }

def generate_category_analysis(df):
    """Generate business category analysis"""
    category_stats = df.groupby('Category').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean', 'std'],
        'New E ID': 'nunique',
        'Area': 'nunique',
        'Service Provider': 'nunique'
    }).round(1)
    
    category_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons', 'Std_Gallons', 'Unique_Entities', 'Areas_Served', 'Service_Providers']
    category_stats['Percentage'] = round((category_stats['Collections'] / len(df)) * 100, 2)
    category_stats = category_stats.sort_values('Collections', ascending=False)
    
    return {
        "category_breakdown": category_stats.to_dict('index'),
        "category_insights": {
            "dominant_category": category_stats.index[0],
            "highest_volume_category": category_stats.sort_values('Avg_Gallons', ascending=False).index[0],
            "most_widespread": category_stats.sort_values('Areas_Served', ascending=False).index[0],
            "category_concentration": f"Top 3 categories represent {category_stats.head(3)['Percentage'].sum():.1f}% of business"
        },
        "volume_by_category": category_stats[['Avg_Gallons', 'Std_Gallons']].to_dict('index')
    }

def generate_volume_analysis(df):
    """Generate volume pattern analysis"""
    gallons = df['Sum of Gallons Collected'].dropna()
    
    # Volume ranges
    volume_ranges = [
        (0, 15, '0-15'),
        (16, 25, '16-25'), 
        (26, 50, '26-50'),
        (51, 100, '51-100'),
        (101, 200, '101-200'),
        (201, 500, '201-500'),
        (501, float('inf'), '500+')
    ]
    
    distribution = {}
    for min_val, max_val, label in volume_ranges:
        mask = (gallons >= min_val) & (gallons < max_val if max_val != float('inf') else gallons >= min_val)
        count = mask.sum()
        percentage = round((count / len(gallons)) * 100, 2)
        total_vol = gallons[mask].sum()
        avg_vol = round(gallons[mask].mean(), 1) if count > 0 else 0
        
        distribution[label] = {
            'count': int(count),
            'percentage': percentage,
            'total_gallons': int(total_vol),
            'avg_gallons': avg_vol
        }
    
    # Most common volumes
    common_volumes = gallons.value_counts().head(10).to_dict()
    
    return {
        "volume_distribution": distribution,
        "common_volumes": {str(k): int(v) for k, v in common_volumes.items()},
        "volume_statistics": {
            "min_gallons": int(gallons.min()),
            "max_gallons": int(gallons.max()),
            "mean_gallons": round(gallons.mean(), 1),
            "median_gallons": round(gallons.median(), 1),
            "std_gallons": round(gallons.std(), 1),
            "q25": round(gallons.quantile(0.25), 1),
            "q75": round(gallons.quantile(0.75), 1)
        },
        "volume_insights": {
            "most_common_size": str(gallons.mode().iloc[0]),
            "high_volume_threshold": "Collections >100 gallons considered high-volume",
            "standard_sizes": "15, 25, 40, 100 gallon containers most common"
        }
    }

def generate_provider_analysis(df):
    """Generate service provider analysis"""
    provider_stats = df.groupby('Service Provider').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean'],
        'New E ID': 'nunique',
        'Area': 'nunique',
        'Zone': 'nunique',
        'Assigned Vehicle': 'nunique',
        'Initiation_to_Collection_Days': 'mean'
    }).round(1)
    
    provider_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons', 'Unique_Entities', 'Areas_Served', 'Zones_Served', 'Vehicles_Used', 'Avg_Turnaround_Days']
    provider_stats['Market_Share'] = round((provider_stats['Collections'] / len(df)) * 100, 2)
    provider_stats['Collections_Per_Vehicle'] = round(provider_stats['Collections'] / provider_stats['Vehicles_Used'], 1)
    provider_stats = provider_stats.sort_values('Collections', ascending=False)
    
    # Provider detailed analysis (optimized)
    provider_details = {}
    for provider in provider_stats.head(15).index:  # Reduced from 20 to 15
        provider_data = df[df['Service Provider'] == provider]
        provider_details[provider] = {
            'performance_metrics': provider_stats.loc[provider].to_dict(),
            'area_coverage': provider_data['Area'].value_counts().head(8).to_dict(),
            'category_specialization': provider_data['Category'].value_counts().head(5).to_dict(),
            'monthly_activity': provider_data.groupby('Month')['Sum of Gallons Collected'].sum().to_dict(),
            'vehicle_fleet': provider_data['Assigned Vehicle'].nunique()
        }
    
    return {
        "top_providers": provider_stats.to_dict('index'),
        "provider_detailed_analysis": provider_details,
        "provider_performance": {
            "market_leader": provider_stats.index[0],
            "most_efficient": provider_stats.sort_values('Collections_Per_Vehicle', ascending=False).index[0],
            "fastest_service": provider_stats.sort_values('Avg_Turnaround_Days').index[0],
            "widest_coverage": provider_stats.sort_values('Areas_Served', ascending=False).index[0]
        },
        "market_concentration": {
            "top_5_share": f"{provider_stats.head(5)['Market_Share'].sum():.1f}%",
            "total_providers": len(provider_stats),
            "avg_market_share": f"{provider_stats['Market_Share'].mean():.2f}%"
        }
    }

def generate_operational_analysis(df):
    """Generate operational efficiency analysis"""
    # Vehicle performance
    vehicle_stats = df.groupby('Assigned Vehicle').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': ['sum', 'mean'],
        'Area': 'nunique',
        'New E ID': 'nunique'
    }).round(1)
    
    vehicle_stats.columns = ['Collections', 'Total_Gallons', 'Avg_Gallons', 'Areas_Served', 'Entities_Served']
    vehicle_stats = vehicle_stats.sort_values('Collections', ascending=False)
    
    # Temporal patterns
    daily_patterns = df['Day_of_Week'].value_counts()
    monthly_patterns = df['Month'].value_counts().sort_index()
    
    # Efficiency metrics
    turnaround_stats = df['Initiation_to_Collection_Days'].describe()
    
    return {
        "fleet_performance": {
            "top_vehicles": vehicle_stats.head(10).to_dict('index'),
            "total_vehicles": len(vehicle_stats),
            "avg_collections_per_vehicle": round(vehicle_stats['Collections'].mean(), 1),
            "most_productive_vehicle": vehicle_stats.index[0]
        },
        "temporal_patterns": {
            "daily_distribution": daily_patterns.to_dict(),
            "monthly_progression": monthly_patterns.to_dict(),
            "peak_day": daily_patterns.index[0],
            "peak_month": monthly_patterns.index[-1]  # Last month in Q1
        },
        "efficiency_metrics": {
            "avg_turnaround_days": round(turnaround_stats['mean'], 1),
            "median_turnaround": round(turnaround_stats['50%'], 1),
            "fastest_turnaround": int(turnaround_stats['min']),
            "completion_rate": f"{((df['Status'] == 'Discharged').mean() * 100):.2f}%"
        }
    }

def generate_delays_analysis(patterns):
    """Generate comprehensive delay and alert analysis"""
    entity_patterns = patterns['entities']
    
    # Risk classification
    risk_summary = {
        'critical': len([e for e in entity_patterns if e['risk_level'] == 'critical']),
        'warning': len([e for e in entity_patterns if e['risk_level'] == 'warning']),
        'upcoming': len([e for e in entity_patterns if e['risk_level'] == 'upcoming']),
        'normal': len([e for e in entity_patterns if e['risk_level'] == 'normal'])
    }
    
    # Critical alerts (>10 days overdue)
    critical_alerts = [e for e in entity_patterns if e['risk_level'] == 'critical']
    critical_alerts_summary = []
    
    for alert in critical_alerts[:20]:  # Top 20 critical alerts
        critical_alerts_summary.append({
            'entity_id': alert['entity_id'],
            'outlet_name': alert['outlet_name'],
            'category': alert['category'],
            'area': alert['area'],
            'days_overdue': alert['days_overdue'],
            'last_collection': alert['last_collection_date'],
            'expected_interval': alert['avg_interval_days']
        })
    
    # Area-wise delay analysis
    area_delays = defaultdict(lambda: {'critical': 0, 'warning': 0, 'total': 0})
    for entity in entity_patterns:
        area = entity['area']
        if entity['risk_level'] == 'critical':
            area_delays[area]['critical'] += 1
        elif entity['risk_level'] == 'warning':
            area_delays[area]['warning'] += 1
        area_delays[area]['total'] += 1
    
    # Category-wise delay analysis
    category_delays = defaultdict(lambda: {'critical': 0, 'warning': 0, 'total': 0})
    for entity in entity_patterns:
        category = entity['category']
        if entity['risk_level'] == 'critical':
            category_delays[category]['critical'] += 1
        elif entity['risk_level'] == 'warning':
            category_delays[category]['warning'] += 1
        category_delays[category]['total'] += 1
    
    return {
        "risk_summary": risk_summary,
        "critical_alerts": critical_alerts_summary,
        "delay_patterns": {
            "by_area": dict(area_delays),
            "by_category": dict(category_delays),
            "high_risk_areas": sorted(area_delays.keys(), key=lambda x: area_delays[x]['critical'], reverse=True)[:10],
            "high_risk_categories": sorted(category_delays.keys(), key=lambda x: category_delays[x]['critical'], reverse=True)[:5]
        },
        "intelligence_insights": {
            "total_entities_analyzed": len(entity_patterns),
            "entities_with_delays": risk_summary['critical'] + risk_summary['warning'],
            "delay_rate": f"{((risk_summary['critical'] + risk_summary['warning']) / len(entity_patterns) * 100):.1f}%",
            "avg_overdue_days": round(np.mean([e['days_overdue'] for e in entity_patterns if e['days_overdue'] > 0]), 1)
        }
    }

def generate_entity_intelligence(df, patterns):
    """Generate detailed entity-level intelligence and behavior patterns"""
    entity_patterns = patterns['entities']
    
    # High-value entities analysis
    high_volume_entities = df.groupby('New E ID').agg({
        'Sum of Gallons Collected': ['sum', 'mean', 'count'],
        'Entity Mapping.Outlet': 'first',
        'Category': 'first',
        'Area': 'first',
        'Zone': 'first',
        'Service Provider': 'first'
    }).round(1)
    
    high_volume_entities.columns = ['Total_Gallons', 'Avg_Gallons', 'Collections', 'Outlet', 'Category', 'Area', 'Zone', 'Provider']
    high_volume_entities = high_volume_entities.sort_values('Total_Gallons', ascending=False).head(50)
    
    # Frequent collection entities
    frequent_entities = df.groupby('New E ID').size().sort_values(ascending=False).head(30)
    
    # Entity risk profiles
    entity_risks = []
    for entity in entity_patterns[:100]:  # Top 100 entities by pattern analysis
        entity_risks.append({
            'entity_id': entity['entity_id'],
            'outlet_name': entity['outlet_name'],
            'category': entity['category'],
            'area': entity['area'],
            'zone': entity['zone'],
            'risk_level': entity['risk_level'],
            'days_overdue': entity['days_overdue'],
            'avg_interval': entity['avg_interval_days'],
            'collections_count': entity['collections_count'],
            'avg_gallons': entity['avg_gallons']
        })
    
    # Category behavior patterns
    category_behaviors = {}
    for category in df['Category'].unique():
        cat_data = df[df['Category'] == category]
        cat_entities = [e for e in entity_patterns if e['category'] == category]
        
        category_behaviors[category] = {
            'total_entities': len(cat_entities),
            'avg_collection_interval': round(np.mean([e['avg_interval_days'] for e in cat_entities]), 1),
            'risk_distribution': {
                'critical': len([e for e in cat_entities if e['risk_level'] == 'critical']),
                'warning': len([e for e in cat_entities if e['risk_level'] == 'warning']),
                'normal': len([e for e in cat_entities if e['risk_level'] == 'normal'])
            },
            'volume_patterns': {
                'min_gallons': int(cat_data['Sum of Gallons Collected'].min()),
                'max_gallons': int(cat_data['Sum of Gallons Collected'].max()),
                'avg_gallons': round(cat_data['Sum of Gallons Collected'].mean(), 1),
                'std_gallons': round(cat_data['Sum of Gallons Collected'].std(), 1)
            }
        }
    
    # Detailed outlet analysis (optimized for token count)
    outlet_analysis = {}
    for idx, row in high_volume_entities.head(50).iterrows():  # Reduced from 100 to 50
        outlet_data = df[df['New E ID'] == idx]
        outlet_analysis[str(idx)] = {
            'outlet_name': row['Outlet'],
            'category': row['Category'],
            'area': row['Area'],
            'zone': row['Zone'],
            'provider': row['Provider'],
            'total_gallons': int(row['Total_Gallons']),
            'avg_gallons': row['Avg_Gallons'],
            'collections': int(row['Collections']),
            'monthly_breakdown': outlet_data.groupby('Month')['Sum of Gallons Collected'].sum().to_dict(),
            'primary_vehicle': outlet_data['Assigned Vehicle'].mode().iloc[0] if len(outlet_data) > 0 else None
        }
    
    return {
        "high_value_entities": high_volume_entities.head(50).to_dict('index'),
        "detailed_outlet_analysis": outlet_analysis,
        "frequent_collection_entities": {str(k): int(v) for k, v in frequent_entities.to_dict().items()},
        "entity_risk_profiles": entity_risks,
        "category_behavior_patterns": category_behaviors,
        "intelligence_summary": {
            "total_entities_analyzed": len(entity_patterns),
            "high_risk_entities": len([e for e in entity_patterns if e['risk_level'] in ['critical', 'warning']]),
            "entities_needing_attention": len([e for e in entity_patterns if e['days_overdue'] > 5]),
            "avg_collection_frequency": round(np.mean([e['avg_interval_days'] for e in entity_patterns]), 1)
        }
    }

def generate_predictive_patterns(df, patterns):
    """Generate predictive insights and forecasting patterns"""
    entity_patterns = patterns['entities']
    
    # Seasonal patterns analysis
    df['Week_Number'] = df['Collected Date'].dt.isocalendar().week
    weekly_volumes = df.groupby('Week_Number')['Sum of Gallons Collected'].agg(['sum', 'mean', 'count']).round(1)
    weekly_volumes.columns = ['Total_Gallons', 'Avg_Gallons', 'Collections']
    
    # Growth trajectory analysis
    monthly_growth = df.groupby('Month').agg({
        'Service Report': 'count',
        'Sum of Gallons Collected': 'sum',
        'New E ID': 'nunique'
    }).round(1)
    monthly_growth.columns = ['Collections', 'Total_Gallons', 'Active_Entities']
    
    # Risk escalation patterns
    critical_entities = [e for e in entity_patterns if e['risk_level'] == 'critical']
    warning_entities = [e for e in entity_patterns if e['risk_level'] == 'warning']
    
    # Provider workload predictions
    provider_workloads = {}
    for provider in df['Service Provider'].unique():
        provider_data = df[df['Service Provider'] == provider]
        provider_entities = [e for e in entity_patterns if e['entity_id'] in provider_data['New E ID'].values]
        
        upcoming_collections = len([e for e in provider_entities if e['days_overdue'] > -7 and e['days_overdue'] <= 0])
        overdue_collections = len([e for e in provider_entities if e['days_overdue'] > 0])
        
        provider_workloads[provider] = {
            'upcoming_week_estimate': upcoming_collections,
            'overdue_collections': overdue_collections,
            'total_managed_entities': len(provider_entities),
            'avg_entity_interval': round(np.mean([e['avg_interval_days'] for e in provider_entities]), 1) if provider_entities else 14
        }
    
    # Capacity planning insights
    daily_capacity_needed = {}
    for i in range(1, 31):  # Next 30 days
        future_date = pd.to_datetime('2023-04-10') + timedelta(days=i)
        collections_needed = 0
        
        for entity in entity_patterns:
            last_collection = pd.to_datetime(entity['last_collection_date'])
            next_expected = last_collection + timedelta(days=entity['avg_interval_days'])
            if abs((future_date - next_expected).days) <= 1:
                collections_needed += 1
        
        daily_capacity_needed[future_date.strftime('%Y-%m-%d')] = collections_needed
    
    return {
        "seasonal_patterns": {
            "weekly_volumes": weekly_volumes.to_dict('index'),
            "peak_week": weekly_volumes.sort_values('Total_Gallons', ascending=False).index[0],
            "low_volume_week": weekly_volumes.sort_values('Total_Gallons').index[0]
        },
        "growth_trajectory": {
            "monthly_progression": monthly_growth.to_dict('index'),
            "volume_trend": "Analyzing Q1 2023 volume progression",
            "entity_growth": "New entity onboarding patterns"
        },
        "risk_escalation": {
            "critical_hotspots": [
                {
                    'area': entity['area'],
                    'category': entity['category'],
                    'days_overdue': entity['days_overdue'],
                    'outlet': entity['outlet_name']
                } for entity in critical_entities[:20]
            ],
            "warning_trends": len(warning_entities),
            "escalation_rate": f"{(len(critical_entities) / len(entity_patterns) * 100):.1f}%"
        },
        "provider_workload_forecast": provider_workloads,
        "capacity_planning": {
            "next_30_days_forecast": daily_capacity_needed,
            "peak_demand_days": sorted(daily_capacity_needed.items(), key=lambda x: x[1], reverse=True)[:10],
            "resource_optimization": "Predictive scheduling recommendations"
        }
    }

def generate_ai_query_examples():
    """Generate example queries and AI assistant context"""
    return {
        "sample_queries": [
            "What are the top 5 areas with the most overdue collections?",
            "Which restaurant category entities need immediate attention?",
            "Show me the collection patterns for Al Quoz area",
            "What's the average turnaround time for Service Provider 4?",
            "Which entities collected the most grease in Q1 2023?",
            "What are the peak collection days of the week?",
            "Show entities that are more than 10 days overdue",
            "Compare volume patterns between hotels and restaurants",
            "Which vehicles are most productive in terms of gallons collected?",
            "What's the delay rate by geographic zone?"
        ],
        "query_patterns": {
            "geographic_queries": [
                "area analysis", "zone comparison", "location-based delays",
                "geographic distribution", "area performance"
            ],
            "category_queries": [
                "restaurant analysis", "hotel patterns", "category comparison",
                "business type performance", "sector insights"
            ],
            "temporal_queries": [
                "monthly trends", "daily patterns", "seasonal analysis",
                "time-based comparison", "frequency analysis"
            ],
            "operational_queries": [
                "provider performance", "vehicle efficiency", "turnaround times",
                "capacity planning", "resource optimization"
            ],
            "alert_queries": [
                "overdue collections", "critical alerts", "risk assessment",
                "delay patterns", "urgent actions needed"
            ]
        },
        "ai_response_guidelines": {
            "data_scope": "Always specify responses are based on Q1 2023 Dubai grease trap collection data",
            "date_context": "Reference date for delay calculations is April 10, 2023",
            "entity_privacy": "Use entity IDs and outlet names, avoid personal information",
            "metric_focus": "Emphasize gallons collected, collection frequency, and delay patterns",
            "actionable_insights": "Provide specific, actionable recommendations when possible"
        },
        "response_templates": {
            "delay_analysis": "Based on Q1 2023 data, [X] entities are overdue as of April 10, 2023...",
            "performance_comparison": "Comparing [category/area/provider] performance in Q1 2023...",
            "trend_analysis": "During Q1 2023 (Jan-Mar), the data shows...",
            "capacity_planning": "Based on collection patterns, the recommended capacity for..."
        }
    }

def main():
    """Main execution function"""
    print("Starting Pie AI insights generation...")
    
    # Load Q1 2023 data
    df = load_q1_2023_data()
    
    # Calculate intelligent patterns
    patterns = calculate_collection_patterns(df)
    
    # Generate comprehensive insights
    pie_insights = generate_pie_insights(df, patterns)
    
    # Convert for JSON serialization
    def convert_for_json(obj):
        if isinstance(obj, dict):
            return {str(k): convert_for_json(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [convert_for_json(item) for item in obj]
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif hasattr(obj, 'to_dict'):
            return convert_for_json(obj.to_dict())
        else:
            return obj
    
    json_compatible_insights = convert_for_json(pie_insights)
    
    # Save optimized insights
    output_file = 'pie_insights_q1_2023.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(json_compatible_insights, f, indent=2, default=str)
    
    # Calculate approximate token count (rough estimate: 1 token ≈ 4 characters)
    json_str = json.dumps(json_compatible_insights, indent=2, default=str)
    estimated_tokens = len(json_str) // 4
    
    print(f"\n[SUCCESS] Pie AI insights generated successfully!")
    print(f"Output file: {output_file}")
    print(f"Data period: Q1 2023 (Jan-Mar)")
    print(f"Records analyzed: {len(df):,}")
    print(f"Entities tracked: {df['New E ID'].nunique():,}")
    print(f"Critical alerts: {len([e for e in patterns['entities'] if e['risk_level'] == 'critical'])}")
    print(f"File size: {len(json_str):,} characters")
    print(f"Estimated tokens: {estimated_tokens:,} (Target: 35K-40K)")
    
    if 35000 <= estimated_tokens <= 40000:
        print("[SUCCESS] Token count within target range!")
    elif estimated_tokens < 35000:
        print("[WARNING] Below target - consider adding more detail")
    else:
        print("[WARNING] Above target - consider optimization")
    
    return pie_insights

if __name__ == "__main__":
    insights = main()