import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAppContext } from '@/contexts/AppContext'
import ChartDemo from './ChartDemo'
import MapDemo from './MapDemo'

export default function Dashboard() {
  const { state, toggleTheme } = useAppContext()

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Pie Dash</h1>
          <Button onClick={toggleTheme} variant="outline">
            {state.theme === 'light' ? '🌙' : '☀️'} Toggle Theme
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Chart Demo (Recharts)</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartDemo />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Map Demo (Leaflet)</CardTitle>
            </CardHeader>
            <CardContent>
              <MapDemo />
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Tech Stack Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold">Frontend</h3>
                <p className="text-sm text-gray-600">React 18 + TypeScript</p>
              </div>
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold">Database</h3>
                <p className="text-sm text-gray-600">Supabase (PostgreSQL)</p>
              </div>
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold">Styling</h3>
                <p className="text-sm text-gray-600">Tailwind + shadcn/ui</p>
              </div>
              <div className="text-center p-4 bg-gray-100 rounded-lg">
                <h3 className="font-semibold">Features</h3>
                <p className="text-sm text-gray-600">Charts + Maps + Routing</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}