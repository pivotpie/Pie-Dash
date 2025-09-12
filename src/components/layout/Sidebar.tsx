// components/layout/Sidebar.tsx - FIXED ROUTES
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboardIcon, 
  MapIcon, 
  TruckIcon, 
  BotIcon, 
  SettingsIcon,
  BarChart3Icon 
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
  { name: 'Mapping', href: '/mapping', icon: MapIcon },
  { name: 'Route Planning', href: '/routing', icon: TruckIcon },
  { name: 'AI Assistant', href: '/ai', icon: BotIcon },
  { name: 'Fleet Management', href: '/fleet', icon: SettingsIcon },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <div className="w-72 bg-glass-strong backdrop-blur-strong border-r border-glass-border-strong h-full shadow-glass-strong relative overflow-hidden">
      {/* Sidebar gradient overlay */}
      <div className="absolute inset-0 bg-gradient-surface opacity-60 pointer-events-none"></div>
      
      {/* Animated accent line */}
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-rainbow animate-glow-rainbow"></div>
      
      <div className="relative z-10 p-8 border-b border-glass-border-strong/40">
        <div className="animate-scaleIn">
          <h1 className="text-2xl font-black bg-gradient-rainbow bg-clip-text text-transparent tracking-tight animate-shimmer bg-[length:200%_100%]">
            Pie-Dash
          </h1>
          <p className="text-sm text-neutral-600 mt-2 font-semibold">
            Operations Management
          </p>
        </div>
      </div>
      
      <nav className="mt-8 relative z-10">
        <div className="px-4 space-y-2">
          {navigation.map((item, index) => {
            const isActive = location.pathname === item.href || 
                           (item.href === '/dashboard' && location.pathname.startsWith('/dashboard'));
            const colors = ['text-neon-blue', 'text-accent-purple', 'text-accent-pink', 'text-accent-emerald', 'text-accent-orange'];
            const glows = ['shadow-glow-blue', 'shadow-glow-purple', 'shadow-glow-pink', 'shadow-glow-cyan', 'shadow-neon'];
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-6 py-4 text-sm font-semibold rounded-2xl transition-all duration-300 relative overflow-hidden transform hover:scale-105 ${
                  isActive
                    ? 'bg-gradient-rainbow text-white shadow-glow-rainbow border border-glass-border-strong animate-glow-rainbow'
                    : 'text-neutral-700 hover:bg-glass-strong hover:text-neutral-900 hover:shadow-floating backdrop-blur-strong'
                }`}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  animationFillMode: 'both'
                }}
              >
                <div className={`mr-4 p-2 rounded-xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20 shadow-lg' 
                    : `bg-glass-white group-hover:bg-gradient-primary group-hover:text-white`
                }`}>
                  <item.icon
                    className={`h-5 w-5 transition-all duration-300 ${
                      isActive 
                        ? 'text-white drop-shadow-lg' 
                        : `${colors[index % colors.length]} group-hover:text-white`
                    }`}
                  />
                </div>
                <span className="relative z-10 tracking-wide">{item.name}</span>
                
                {/* Shimmer effect */}
                {!isActive && (
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  </div>
                )}
                
                {/* Active state gradient */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-rainbow opacity-90 rounded-2xl animate-pulse-glow"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Enhanced Status Indicator */}
      <div className="absolute bottom-6 left-4 right-4 z-20">
        <div className="bg-glass-strong backdrop-blur-strong border border-glass-border-strong rounded-2xl p-5 shadow-floating relative overflow-hidden">
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-glow opacity-20 animate-pulse-glow"></div>
          
          <div className="relative z-10">
            <div className="flex items-center">
              <div className="relative mr-4">
                <div className="h-4 w-4 bg-accent-emerald rounded-full animate-pulse-glow shadow-neon"></div>
                <div className="absolute inset-0 h-4 w-4 bg-accent-emerald rounded-full animate-ping opacity-75"></div>
              </div>
              <span className="text-sm text-neutral-700 font-semibold">System Online</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-neutral-600 font-medium">99.9% Uptime</span>
              <div className="flex items-center space-x-1">
                <div className="h-1.5 w-12 bg-gradient-primary rounded-full shadow-glow-blue"></div>
                <span className="text-accent-emerald font-bold">●</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};