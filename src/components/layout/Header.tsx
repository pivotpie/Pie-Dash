// components/layout/Header.tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { 
  BellIcon, 
  UserIcon, 
  RefreshCwIcon, 
  SearchIcon,
  ChevronDownIcon,
  MessageCircle
} from 'lucide-react';
interface HeaderProps {
  onOpenChat: (query?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenChat }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Dashboard';
      case '/dashboard/geographic': return 'Geographic Distribution';
      case '/dashboard/categories': return 'Business Categories';
      case '/dashboard/volumes': return 'Collection Volumes';
      case '/dashboard/providers': return 'Service Providers';
      case '/dashboard/delays': return 'Collection Delays';
      case '/dashboard/operations': return 'Operations Status';
      case '/mapping': return 'Mapping';
      case '/routing': return 'Routing';
      case '/ai': return 'AI Assistant';
      case '/fleet': return 'Fleet Management';
      default: return 'Dashboard';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onOpenChat(searchQuery);
      setSearchQuery(''); // Clear search after opening chat
    }
  };

  const handleSearchClick = () => {
    if (searchQuery.trim()) {
      onOpenChat(searchQuery);
      setSearchQuery(''); // Clear search after opening chat
    } else {
      onOpenChat(); // No initial query if search is empty
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e as any);
    }
  };

  return (
    <header className="bg-glass-strong backdrop-blur-strong border-b border-glass-border-strong/50 sticky top-0 z-20 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30 animate-pulse-glow"></div>
      
      {/* Rainbow accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-rainbow animate-shimmer bg-[length:200%_100%]"></div>
      
      <div className="relative z-10 px-8 py-6">
        <div className="flex items-center justify-between w-full">
          {/* Left Section: Logo + App Name + Page Title */}
          <div className="flex items-center space-x-6">
            {/* Logo in bordered box */}
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-glass-white backdrop-blur-glass border-2 border-glass-border-strong rounded-2xl p-3 shadow-floating hover:shadow-glow-subtle transition-all duration-300 hover:scale-105"
            >
              <img 
                src="/logo.png" 
                alt="Pie-Dash Logo" 
                className="h-10 w-10 object-contain"
              />
            </button>
            
            {/* App Name > Page Title */}
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-2xl font-black bg-gradient-rainbow bg-clip-text text-transparent tracking-tight animate-shimmer bg-[length:200%_100%] hover:scale-105 transition-transform duration-200"
              >
                Pie-Dash
              </button>
              <ChevronDownIcon className="h-5 w-5 text-neutral-400 rotate-[-90deg]" />
              <h2 className="text-xl font-bold text-neutral-700">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          {/* Center Section: Google-Style Search Bar */}
          <div className="flex-1 max-w-2xl mx-12">
            <div className={`relative transition-all duration-300 ${searchFocused ? 'transform scale-105' : ''}`}>
              {/* Google-style search container */}
              <div className={`
                relative bg-white border rounded-full 
                shadow-lg hover:shadow-xl
                ${searchFocused ? 'shadow-glow-blue border-primary-300' : 'border-neutral-200 hover:border-neutral-300'}
                transition-all duration-300
              `}>
                {/* Search Input */}
                <form onSubmit={handleSearchSubmit} className="w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Pie about Dubai grease collection data..."
                    className="w-full bg-transparent border-0 rounded-full pl-6 pr-32 py-4 text-base text-neutral-700 placeholder-neutral-500 focus:outline-none"
                  />
                </form>
                
                {/* Right side buttons */}
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {/* Pie AI indicator */}
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-full">
                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">P</span>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">Pie</span>
                  </div>
                  
                  {/* Search/Chat button */}
                  <button 
                    type="button"
                    onClick={handleSearchClick}
                    className="p-2 hover:bg-blue-50 rounded-full transition-colors duration-200 group"
                  >
                    <MessageCircle className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section: Action Icons */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="bg-glass-white backdrop-blur-glass border border-glass-border-strong hover:bg-gradient-primary hover:text-white transition-all duration-300 hover:shadow-floating hover:scale-105 rounded-xl p-3"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="bg-glass-white backdrop-blur-glass border border-glass-border-strong hover:bg-gradient-accent hover:text-white transition-all duration-300 hover:shadow-glow-purple hover:scale-105 rounded-xl p-3 relative"
            >
              <BellIcon className="h-4 w-4" />
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-gradient-neon rounded-full shadow-neon animate-pulse"></div>
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-accent-pink rounded-full animate-ping opacity-75"></div>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="bg-glass-white backdrop-blur-glass border border-glass-border-strong hover:bg-gradient-primary hover:text-white transition-all duration-300 hover:shadow-glow-blue hover:scale-105 rounded-xl p-3"
            >
              <UserIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};