// components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`
      bg-glass-strong backdrop-blur-strong 
      border border-glass-border-strong 
      rounded-3xl shadow-glass-strong 
      hover:shadow-floating hover:shadow-glow-rainbow
      transition-all duration-500 ease-out
      hover:-translate-y-3 hover:scale-[1.02]
      relative overflow-hidden
      before:absolute before:inset-0 
      before:bg-gradient-mesh before:opacity-60
      before:rounded-3xl before:pointer-events-none
      ${className}
    `}>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-8 py-6 border-b border-glass-border-strong/40 relative ${className}`}>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-rainbow opacity-30"></div>
      {children}
    </div>
  );
};

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const CardTitle: React.FC<CardTitleProps> = ({ children, className = '' }) => {
  return (
    <h3 className={`text-xl font-bold bg-gradient-primary bg-clip-text text-transparent tracking-tight drop-shadow-sm ${className}`}>
      {children}
    </h3>
  );
};

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = '' }) => {
  return (
    <div className={`px-8 py-6 ${className}`}>
      {children}
    </div>
  );
};