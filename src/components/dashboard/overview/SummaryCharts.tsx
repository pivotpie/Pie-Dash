import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const deliveryData = [
  { name: 'Mon', deliveries: 120, onTime: 110 },
  { name: 'Tue', deliveries: 132, onTime: 125 },
  { name: 'Wed', deliveries: 101, onTime: 98 },
  { name: 'Thu', deliveries: 134, onTime: 128 },
  { name: 'Fri', deliveries: 90, onTime: 85 },
  { name: 'Sat', deliveries: 130, onTime: 122 },
  { name: 'Sun', deliveries: 110, onTime: 105 },
]

export default function SummaryCharts() {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium mb-3">Daily Deliveries</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deliveryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="deliveries" fill="#3b82f6" />
              <Bar dataKey="onTime" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-3">Performance Trend</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={deliveryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="onTime" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}