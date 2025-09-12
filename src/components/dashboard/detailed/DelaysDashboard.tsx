// components/dashboard/detailed/DelaysDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { ArrowLeftIcon, AlertTriangleIcon, ClockIcon, InfoIcon, TrendingUpIcon, CheckCircleIcon, TargetIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { DataTable } from '../../ui/DataTable';
import { DelayDetectionService, DelayAlert } from '../../../services/delayDetectionService';
import { DataInsightsService } from '../../../services/dataInsightsService';

interface DelaysDashboardProps {
  onBack: () => void;
}

export const DelaysDashboard: React.FC<DelaysDashboardProps> = ({ onBack }) => {
  const [delays, setDelays] = useState<DelayAlert[]>([]);
  const [delaysByArea, setDelaysByArea] = useState<Record<string, DelayAlert[]>>({});
  const [delaysByZone, setDelaysByZone] = useState<Record<string, DelayAlert[]>>({});
  const [delayStats, setDelayStats] = useState<any>(null);
  const [temporalData, setTemporalData] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading delay data...');
      const [currentDelays, areaDelays, zoneDelays, stats, temporal, dataInsights] = await Promise.all([
        DelayDetectionService.getCurrentDelays(),
        DelayDetectionService.getDelaysByArea(),
        DelayDetectionService.getDelaysByZone(),
        DelayDetectionService.getDelayStats(),
        DataInsightsService.getTemporalData(),
        DataInsightsService.getInsights()
      ]);
      
      console.log('Delay data loaded:', {
        totalDelays: currentDelays.length,
        criticalDelays: currentDelays.filter(d => d.priority === 'critical').length,
        areas: Object.keys(areaDelays).length,
        zones: Object.keys(zoneDelays).length,
        temporalMonths: Object.keys(temporal.monthly).length,
        recommendations: dataInsights.recommendations.length
      });
      
      setDelays(currentDelays);
      setDelaysByArea(areaDelays);
      setDelaysByZone(zoneDelays);
      setDelayStats(stats);
      setTemporalData(temporal);
      setInsights(dataInsights);
    } catch (error) {
      console.error('Error loading delay data:', error);
    } finally {
      setLoading(false);
    }
  };

  const criticalDelays = delays.filter(d => d.priority === 'critical');
  const highDelays = delays.filter(d => d.priority === 'high');
  const mediumDelays = delays.filter(d => d.priority === 'medium');
  const overflowRisks = delays.filter(d => d.overflow_risk);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangleIcon className="h-8 w-8 text-red-600" />
              Collection Delays Dashboard
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Real-time delay analysis based on collection patterns • Current date: January 15, 2025
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadData} variant="outline" size="sm">
            🔄 Refresh Data
          </Button>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold text-red-600">{criticalDelays.length}</div>
                <div className="text-sm text-gray-500">Critical Delays</div>
                <div className="text-xs text-red-400">Immediate action required</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ClockIcon className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">{highDelays.length}</div>
                <div className="text-sm text-gray-500">High Priority</div>
                <div className="text-xs text-orange-400">24-48 hour collection</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TargetIcon className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold text-purple-600">{overflowRisks.length}</div>
                <div className="text-sm text-gray-500">Overflow Risk</div>
                <div className="text-xs text-purple-400">Tank capacity concern</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <InfoIcon className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">{delays.length}</div>
                <div className="text-sm text-gray-500">Total Overdue</div>
                <div className="text-xs text-blue-400">
                  {delayStats ? `${delayStats.totalAffectedGallons.toLocaleString()} gallons affected` : 'All priorities'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 70/30 Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-10 gap-6">
        {/* Left Panel - 70% (7 columns) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Critical Delays */}
          {criticalDelays.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangleIcon className="mr-2 h-5 w-5" />
                  Critical Delays - Immediate Action Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {criticalDelays.slice(0, 5).map(delay => (
                    <div key={delay.entity_id} className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-red-900">{delay.outlet_name}</div>
                          <div className="text-sm text-red-700">
                            {delay.area} • {delay.category} • {delay.days_overdue} days overdue
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-900">{delay.expected_gallons} gal</div>
                          <div className="text-xs text-red-600">Expected volume</div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-red-800">
                        {delay.recommended_action}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Delays Table */}
          <DataTable
            title={`All Current Delays (${delays.length} locations affected)`}
            columns={[
              { key: 'outlet_name', title: 'Location', sortable: true },
              { key: 'area', title: 'Area', sortable: true },
              { key: 'zone', title: 'Zone', sortable: true },
              { key: 'category', title: 'Category', sortable: true },
              { key: 'days_overdue', title: 'Days Overdue', sortable: true },
              { 
                key: 'expected_gallons', 
                title: 'Tank Size (Gal)', 
                sortable: true,
                render: (value: number) => value.toLocaleString()
              },
              { 
                key: 'priority', 
                title: 'Priority', 
                sortable: true,
                render: (value: string) => (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    value === 'critical' ? 'bg-red-100 text-red-800' :
                    value === 'high' ? 'bg-orange-100 text-orange-800' :
                    value === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {value.toUpperCase()}
                  </span>
                )
              },
              { 
                key: 'overflow_risk', 
                title: 'Risk', 
                sortable: true,
                render: (value: boolean) => (
                  value ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                      OVERFLOW
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      NORMAL
                    </span>
                  )
                )
              },
              { 
                key: 'expected_frequency', 
                title: 'Frequency', 
                sortable: true,
                render: (value: number) => `${value} days`
              },
              { key: 'recommended_action', title: 'Recommended Action' }
            ]}
            data={delays}
            pagination={true}
            pageSize={15}
          />
        </div>

        {/* Right Panel - 30% (3 columns) */}
        <div className="xl:col-span-3 space-y-6">
          {/* Detailed Summary */}
          <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <InfoIcon className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Detailed Summary</h3>
            </div>
            <div className="space-y-4 text-sm text-gray-700">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="font-medium">Critical Situation Analysis</p>
                <p>{criticalDelays.length} critical delays requiring immediate action across {Object.keys(delaysByArea).length} service areas and {Object.keys(delaysByZone).length} zones. Total affected tank capacity: {delayStats ? delayStats.totalAffectedGallons.toLocaleString() : '0'} gallons.</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="font-medium">Service Distribution</p>
                <p>High priority: {highDelays.length} locations. Medium: {mediumDelays.length}. Average overdue: {delayStats ? delayStats.averageDaysOverdue : 0} days. Most affected: {delayStats ? delayStats.mostAffectedArea : 'N/A'} area in {delayStats ? delayStats.mostAffectedZone : 'N/A'} zone.</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <p className="font-medium">Business Impact</p>
                <p>Overflow risk at {overflowRisks.length} locations. Primary category affected: {delayStats ? delayStats.mostAffectedCategory : 'N/A'}. Current date baseline: January 15, 2025 (last collection: Dec 31, 2024).</p>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUpIcon className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Key Insights</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangleIcon className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-red-800">Urgent Response Required</p>
                  <p className="text-red-700">{criticalDelays.length} locations with critical delays need immediate collection</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                <ClockIcon className="h-4 w-4 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Schedule Impact</p>
                  <p className="text-orange-700">Service disruptions affecting {Object.keys(delaysByArea).length} areas with potential revenue impact</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <TargetIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Resolution Strategy</p>
                  <p className="text-blue-700">Prioritized action plan can resolve {Math.ceil(criticalDelays.length * 0.8)} critical cases within 24 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircleIcon className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Action Items</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border-l-4 border-red-400 bg-red-50">
                <div className="text-sm">
                  <p className="font-medium text-red-800">Critical Priority</p>
                  <p className="text-red-700">Deploy emergency collection teams to {criticalDelays.slice(0, 3).map(d => d.area).join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border-l-4 border-orange-400 bg-orange-50">
                <div className="text-sm">
                  <p className="font-medium text-orange-800">High Priority</p>
                  <p className="text-orange-700">Contact service providers for immediate schedule adjustment</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 border-l-4 border-yellow-400 bg-yellow-50">
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Medium Priority</p>
                  <p className="text-yellow-700">Review and optimize collection routes for affected areas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Time Sensitive Elements */}
          <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ClockIcon className="h-5 w-5 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Time Sensitive</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-red-800">Emergency Collection Run</p>
                  <p className="text-red-600">Deploy immediately</p>
                </div>
                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  Deploy
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-orange-800">Provider Notification</p>
                  <p className="text-orange-600">Send within 1 hour</p>
                </div>
                <Button size="sm" variant="outline">
                  Notify
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Delay Analysis Report</p>
                  <p className="text-blue-600">Due end of day</p>
                </div>
                <Button size="sm" variant="ghost">
                  Prepare
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};