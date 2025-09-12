interface DataTableProps {
  type: 'geographic' | 'category' | 'volume' | 'performance' | 'delays'
}

const sampleData = {
  geographic: [
    { region: 'North', deliveries: 150, onTime: '95%', avgTime: '2.1h' },
    { region: 'South', deliveries: 120, onTime: '92%', avgTime: '2.4h' },
    { region: 'East', deliveries: 180, onTime: '97%', avgTime: '1.9h' },
    { region: 'West', deliveries: 110, onTime: '89%', avgTime: '2.8h' },
  ],
  category: [
    { category: 'Electronics', revenue: '$45,000', orders: 234, growth: '+12%' },
    { category: 'Clothing', revenue: '$32,000', orders: 156, growth: '+8%' },
    { category: 'Food', revenue: '$28,000', orders: 189, growth: '+15%' },
  ],
  volume: [
    { date: '2024-01-01', packages: 450, capacity: '85%', efficiency: '92%' },
    { date: '2024-01-02', packages: 520, capacity: '98%', efficiency: '88%' },
    { date: '2024-01-03', packages: 380, capacity: '72%', efficiency: '95%' },
  ],
  performance: [
    { driver: 'John Doe', deliveries: 45, onTime: '98%', rating: '4.9' },
    { driver: 'Jane Smith', deliveries: 52, onTime: '96%', rating: '4.8' },
    { driver: 'Bob Johnson', deliveries: 38, onTime: '94%', rating: '4.7' },
  ],
  delays: [
    { orderId: '#12345', reason: 'Traffic', delay: '15 min', status: 'Active' },
    { orderId: '#12346', reason: 'Weather', delay: '30 min', status: 'Resolved' },
    { orderId: '#12347', reason: 'Vehicle Issue', delay: '45 min', status: 'Active' },
  ],
}

export function DataTable({ type }: DataTableProps) {
  const data = sampleData[type]
  const columns = Object.keys(data[0] || {})

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            {columns.map((column) => (
              <th key={column} className="border border-gray-300 p-2 text-left font-medium">
                {column.charAt(0).toUpperCase() + column.slice(1)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td key={column} className="border border-gray-300 p-2">
                  {(row as any)[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}