// components/ui/button.tsx - Enhanced Futuristic Design
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient' | 'neon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  glow?: boolean;
  animate?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  className = '',
  children,
  glow = false,
  animate = true,
  ...props
}) => {
  const baseClasses = `
    inline-flex items-center justify-center font-semibold 
    focus:outline-none relative overflow-hidden
    transition-all duration-300 ease-out
    ${animate ? 'transform hover:scale-105 active:scale-95' : ''}
  `;
  
  const variantClasses = {
    default: `
      bg-glass-strong backdrop-blur-strong border border-glass-border-strong
      text-neutral-700 hover:text-neutral-900
      hover:bg-glass-white hover:shadow-floating
      focus:ring-2 focus:ring-primary-500/50
    `,
    primary: `
      bg-gradient-primary text-white border-0
      hover:shadow-glow-blue
      focus:ring-2 focus:ring-primary-500/50
      before:absolute before:inset-0 before:bg-gradient-to-r 
      before:from-transparent before:via-white/20 before:to-transparent
      before:translate-x-[-100%] hover:before:translate-x-[100%]
      before:transition-transform before:duration-500
    `,
    secondary: `
      bg-glass-white backdrop-blur-glass border border-glass-border-strong
      text-primary-600 hover:text-white
      hover:bg-gradient-primary hover:shadow-glow-subtle
      focus:ring-2 focus:ring-primary-500/50
    `,
    outline: `
      border-2 border-primary-300 bg-transparent
      text-primary-600 hover:text-white
      hover:bg-gradient-primary hover:border-primary-500
      hover:shadow-glow-blue
      focus:ring-2 focus:ring-primary-500/50
    `,
    ghost: `
      bg-transparent border-0
      text-neutral-600 hover:text-primary-600
      hover:bg-glass-white hover:backdrop-blur-glass
      focus:ring-2 focus:ring-primary-500/50
    `,
    gradient: `
      bg-gradient-rainbow text-white border-0
      hover:shadow-glow-rainbow
      focus:ring-2 focus:ring-purple-500/50
      animate-shimmer bg-[length:200%_100%]
    `,
    neon: `
      bg-gradient-neon text-white border-0
      hover:shadow-neon
      focus:ring-2 focus:ring-cyan-500/50
      animate-pulse-glow
    `
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-sm rounded-xl',
    lg: 'px-8 py-4 text-base rounded-xl',
    xl: 'px-10 py-5 text-lg rounded-2xl'
  };

  const glowClass = glow ? 'animate-glow' : '';

  return (
    <button
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]} 
        ${glowClass}
        ${className}
      `}
      {...props}
    >
      <span className="relative z-10 tracking-wide">
        {children}
      </span>
    </button>
  );
};