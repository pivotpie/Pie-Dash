// Enhanced App Layout - Drop-in replacement for AppLayout.tsx
// Provides seamless migration path with feature flags

import React, { useState } from 'react';
import { Header } from './Header';
import EnhancedPieChat from '../chat/EnhancedPieChat';
import type { FeatureFlags } from '../../types/enhanced-chat.types';

interface EnhancedAppLayoutProps {
  children: React.ReactNode;
  // Migration control props
  useEnhancedFeatures?: boolean;
  featureFlags?: Partial<FeatureFlags>;
}

export const EnhancedAppLayout: React.FC<EnhancedAppLayoutProps> = ({ 
  children, 
  useEnhancedFeatures = true,
  featureFlags = {}
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');

  const handleOpenChat = (query?: string) => {
    setInitialQuery(query || '');
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-body bg-fixed relative overflow-hidden">
      {/* Animated background mesh */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-40 animate-pulse-glow"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-primary rounded-full blur-3xl opacity-20 animate-float"></div>
      <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-accent rounded-full blur-2xl opacity-25 animate-float" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-gradient-neon rounded-full blur-3xl opacity-15 animate-float" style={{animationDelay: '4s'}}></div>
      
      <div className="min-h-screen relative z-10 flex flex-col">
        <Header onOpenChat={handleOpenChat} />
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="animate-fadeInUp space-y-6 w-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Enhanced Pie AI Chat */}
      <EnhancedPieChat 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        initialQuery={initialQuery}
        enableEnhancedFeatures={useEnhancedFeatures}
        featureFlags={featureFlags}
      />
    </div>
  );
};