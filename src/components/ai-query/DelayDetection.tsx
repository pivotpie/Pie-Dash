import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DelayAlert {
  id: string
  orderId: string
  severity: 'low' | 'medium' | 'high'
  reason: string
  estimatedDelay: string
  suggestedAction: string
  timestamp: Date
}

const delayAlerts: DelayAlert[] = [
  {
    id: '1',
    orderId: '#12345',
    severity: 'high',
    reason: 'Heavy traffic on main route',
    estimatedDelay: '45 minutes',
    suggestedAction: 'Reroute via Highway 101',
    timestamp: new Date()
  },
  {
    id: '2',
    orderId: '#12346',
    severity: 'medium',
    reason: 'Vehicle maintenance required',
    estimatedDelay: '2 hours',
    suggestedAction: 'Assign backup vehicle',
    timestamp: new Date()
  },
  {
    id: '3',
    orderId: '#12347',
    severity: 'low',
    reason: 'Customer unavailable',
    estimatedDelay: '30 minutes',
    suggestedAction: 'Reschedule delivery',
    timestamp: new Date()
  }
]

export default function DelayDetection() {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleAction = (alertId: string, action: string) => {
    console.log(`Executing action for alert ${alertId}: ${action}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          ⚠️ AI Delay Detection
          <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
            {delayAlerts.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {delayAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium">Order {alert.orderId}</h4>
                  <p className="text-sm opacity-75">{alert.reason}</p>
                </div>
                <span className="text-xs">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Estimated delay:</strong> {alert.estimatedDelay}
                </div>
                <div className="text-sm">
                  <strong>Suggested action:</strong> {alert.suggestedAction}
                </div>
                
                <div className="flex space-x-2 mt-3">
                  <Button 
                    size="sm" 
                    onClick={() => handleAction(alert.id, alert.suggestedAction)}
                  >
                    Apply Suggestion
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleAction(alert.id, 'dismiss')}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}