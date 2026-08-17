import React, { useState, useEffect } from 'react';

// ── 1. TYPEWRITER MONOSPACE STREAMING TEXT (Finalized Primary Text FX) ──
interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  showCursor?: boolean;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 28,
  delay = 0,
  className = '',
  showCursor = true,
}) => {
  const [currentText, setCurrentText] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    setCurrentText('');
    setIsDone(false);
    let index = 0;
    let interval: any;

    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        if (index < text.length) {
          setCurrentText(text.slice(0, index + 1));
          index++;
        } else {
          setIsDone(true);
          clearInterval(interval);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [text, speed, delay]);

  return (
    <span className={`inline-flex items-center font-mono ${className}`}>
      <span>{currentText}</span>
      {showCursor && (
        <span
          className={`inline-block w-2 h-[1.15em] bg-cyan-400 ml-1 rounded-xs shadow-[0_0_8px_#06b6d4] ${
            isDone ? 'animate-[pulse_1.2s_infinite]' : 'opacity-100'
          }`}
          aria-hidden="true"
        />
      )}
    </span>
  );
};

// ── 2. SHIMMERING METALLIC / ICE-CYAN TEXT ──
interface ShimmerTextProps {
  text: string;
  className?: string;
}

export const ShimmerText: React.FC<ShimmerTextProps> = ({ text, className = '' }) => {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent bg-[linear-gradient(110deg,#38bdf8,35%,#ffffff,50%,#06b6d4,65%,#38bdf8)] bg-[length:250%_100%] animate-[shimmer_2.5s_infinite_linear] font-bold ${className}`}
    >
      {text}
    </span>
  );
};
