import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glowColor?: 'cyan' | 'purple' | 'emerald' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  glowColor = 'none',
  className = '',
  ...props
}) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const variantClasses = {
    default: 'bg-[#080e1a]/80 border border-white/[0.08] backdrop-blur-xl',
    elevated: 'bg-[#0e1626]/90 border border-white/[0.12] shadow-2xl shadow-black/60 backdrop-blur-2xl',
    glass: 'bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-lg',
    interactive:
      'bg-[#080e1a]/80 hover:bg-[#0c1424]/90 border border-white/[0.08] hover:border-cyan-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/5 cursor-pointer backdrop-blur-xl group active:scale-[0.99]',
  };

  const glowClasses = {
    cyan: 'hover:border-cyan-500/40 hover:shadow-cyan-500/10',
    purple: 'hover:border-purple-500/40 hover:shadow-purple-500/10',
    emerald: 'hover:border-emerald-500/40 hover:shadow-emerald-500/10',
    none: '',
  };

  return (
    <div
      className={`rounded-2xl relative overflow-hidden transition-all duration-200 ${paddingClasses[padding]} ${variantClasses[variant]} ${glowClasses[glowColor]} ${className}`}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />
      {children}
    </div>
  );
};
