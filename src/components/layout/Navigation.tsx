import { useState } from 'react'

const navigationItems = [
  { name: 'Overview', href: '/overview', icon: '📊' },
  { name: 'Geographic', href: '/geographic', icon: '🌍' },
  { name: 'Categories', href: '/categories', icon: '📋' },
  { name: 'Volume', href: '/volume', icon: '📦' },
  { name: 'Performance', href: '/performance', icon: '⚡' },
  { name: 'Delays', href: '/delays', icon: '⏰' },
  { name: 'Mapping', href: '/mapping', icon: '🗺️' },
  { name: 'Routing', href: '/routing', icon: '🛣️' },
  { name: 'AI Query', href: '/ai-query', icon: '🤖' },
]

export default function Navigation() {
  const [activeItem, setActiveItem] = useState('Overview')

  return (
    <nav className="mt-4">
      <ul className="space-y-1">
        {navigationItems.map((item) => (
          <li key={item.name}>
            <button
              onClick={() => setActiveItem(item.name)}
              className={`w-full flex items-center px-4 py-2 text-left text-sm transition-colors ${
                activeItem === item.name
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}