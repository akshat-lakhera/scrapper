import React from 'react';
import { CountUp } from './CountUp';

interface AnimatedGaugeProps {
  value: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export const AnimatedGauge: React.FC<AnimatedGaugeProps> = ({
  value,
  size = 110,
  strokeWidth = 8,
  label = 'Reliability',
  sublabel = 'Index',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  // Determine color theme based on score
  const color = clampedValue >= 80 ? '#10b981' : clampedValue >= 50 ? '#f59e0b' : '#06b6d4';

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Animated Active Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1), stroke 400ms ease',
          }}
        />
      </svg>

      {/* Center Value Badge */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <CountUp
          end={clampedValue}
          suffix="%"
          className="text-base font-bold tracking-tight text-white"
        />
        <span className="text-[9px] mono uppercase font-semibold text-slate-400 -mt-0.5">
          {label}
        </span>
      </div>
    </div>
  );
};
