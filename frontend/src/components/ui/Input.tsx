import React from 'react';
import { X } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  onClear?: () => void;
  error?: string;
  label?: string;
}

export const Input: React.FC<InputProps> = ({
  leftIcon,
  onClear,
  error,
  label,
  value,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="text-xs font-semibold text-slate-400 block tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-500 pointer-events-none flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          value={value}
          className={`w-full px-4 py-3 rounded-xl bg-black/40 border text-sm text-slate-100 placeholder-slate-600 transition-all duration-150 focus:outline-none ${
            leftIcon ? 'pl-10' : ''
          } ${onClear && value ? 'pr-10' : ''} ${
            error
              ? 'border-rose-500/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50'
              : 'border-white/10 hover:border-white/20 focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/60'
          } ${className}`}
          {...props}
        />
        {onClear && value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3.5 p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-rose-400">{error}</p>}
    </div>
  );
};
