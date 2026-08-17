import { useEffect, useState, useRef, useMemo } from 'react';

// ── Matrix Scramble Hook ──
export function useScrambleText(finalText: string, trigger: boolean = true) {
  const [display, setDisplay] = useState('');
  const chars = '01アイウ█▓▒░カキ@#$%&*';
  const done = useRef(false);

  useEffect(() => {
    if (!trigger || done.current) return;
    done.current = true;
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        finalText.split('').map((char, i) => {
          if (char === ' ') return ' ';
          if (i < iteration) return finalText[i];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('')
      );
      iteration += 0.6;
      if (iteration >= finalText.length) {
        clearInterval(interval);
        setDisplay(finalText);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [finalText, trigger]);

  return display || finalText;
}

// ── Animated Counter Hook ──
export function useCounter(end: number, duration: number = 1000) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (end === 0 || started.current) { setValue(end); return; }
    started.current = true;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // quartic ease-out
      setValue(Math.round(end * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [end, duration]);
  return value;
}

// ── Stagger Helper ──
export function stagger(index: number): React.CSSProperties {
  return { '--i': index } as React.CSSProperties;
}

// ── Particle Generator ──
export function useParticles(count: number = 20) {
  return useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: 1 + Math.random() * 2,
      duration: 8 + Math.random() * 15,
      delay: Math.random() * 10,
      opacity: 0.15 + Math.random() * 0.3,
    }))
  , [count]);
}
