import { createContext, useContext, useState, ReactNode } from 'react'

interface AppState {
  user: any | null
  theme: 'light' | 'dark'
  mapData: any[]
  chartData: any[]
}

interface AppContextType {
  state: AppState
  setUser: (user: any) => void
  toggleTheme: () => void
  setMapData: (data: any[]) => void
  setChartData: (data: any[]) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    theme: 'light',
    mapData: [],
    chartData: []
  })

  const setUser = (user: any) => {
    setState(prev => ({ ...prev, user }))
  }

  const toggleTheme = () => {
    setState(prev => ({ 
      ...prev, 
      theme: prev.theme === 'light' ? 'dark' : 'light' 
    }))
  }

  const setMapData = (data: any[]) => {
    setState(prev => ({ ...prev, mapData: data }))
  }

  const setChartData = (data: any[]) => {
    setState(prev => ({ ...prev, chartData: data }))
  }

  return (
    <AppContext.Provider value={{
      state,
      setUser,
      toggleTheme,
      setMapData,
      setChartData
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}