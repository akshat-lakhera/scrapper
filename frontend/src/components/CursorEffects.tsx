import React, { useEffect, useRef, useState } from 'react';

export type CursorMode = 'none' | 'spotlight' | 'magnetic_lerp' | 'data_particles';

interface CursorEffectsProps {
  mode: CursorMode;
}

export const CursorEffects: React.FC<CursorEffectsProps> = ({ mode }) => {
  const [coords, setCoords] = useState({ x: -100, y: -100 });
  const [targetHovered, setTargetHovered] = useState(false);
  const [mouseDown, setMouseDown] = useState(false);
  
  const posRef = useRef({ x: -100, y: -100 });
  const targetRef = useRef({ x: -100, y: -100 });
  const reqRef = useRef<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }>>([]);

  useEffect(() => {
    if (mode === 'none') return;

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      setCoords({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('button, a, input, select, textarea, [role="button"], .glow-hover');
        setTargetHovered(!!interactive);
      }

      if (mode === 'data_particles') {
        const colors = ['#06b6d4', '#10b981', '#38bdf8', '#6366f1'];
        particlesRef.current.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2 - 0.3,
          size: Math.random() * 2 + 1,
          alpha: 0.8,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    const handleMouseDown = () => setMouseDown(true);
    const handleMouseUp = () => setMouseDown(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    const animate = () => {
      posRef.current.x += (targetRef.current.x - posRef.current.x) * 0.2;
      posRef.current.y += (targetRef.current.y - posRef.current.y) * 0.2;

      if (mode === 'data_particles' && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          particlesRef.current.forEach((p, idx) => {
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.03;
            if (p.alpha <= 0) {
              particlesRef.current.splice(idx, 1);
            } else {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
              ctx.fillStyle = p.color;
              ctx.globalAlpha = p.alpha;
              ctx.fill();
            }
          });
          ctx.globalAlpha = 1.0;
        }
      }

      reqRef.current = requestAnimationFrame(animate);
    };

    reqRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [mode]);

  if (mode === 'none') return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {/* EFFECT 1: SPOTLIGHT AMBIENT HALO (Dark-Tech Illumination) */}
      {mode === 'spotlight' && (
        <div
          className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-opacity duration-200"
          style={{
            transform: `translate3d(${coords.x}px, ${coords.y}px, 0)`,
            width: targetHovered ? '420px' : '280px',
            height: targetHovered ? '420px' : '280px',
            background: targetHovered 
              ? 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, rgba(16, 185, 129, 0.04) 45%, transparent 70%)'
              : 'radial-gradient(circle, rgba(6, 182, 212, 0.07) 0%, transparent 65%)',
          }}
        />
      )}

      {/* EFFECT 2: MAGNETIC LERP FOLLOWER RING */}
      {mode === 'magnetic_lerp' && (
        <div
          className="fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/40 pointer-events-none transition-all duration-75 ease-out"
          style={{
            transform: `translate3d(${posRef.current.x}px, ${posRef.current.y}px, 0)`,
            width: targetHovered ? '40px' : mouseDown ? '18px' : '28px',
            height: targetHovered ? '40px' : mouseDown ? '18px' : '28px',
            backgroundColor: targetHovered ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
            borderColor: targetHovered ? '#38bdf8' : 'rgba(6, 182, 212, 0.35)',
          }}
        />
      )}

      {/* EFFECT 3: DATA PARTICLES TRAIL */}
      {mode === 'data_particles' && (
        <canvas
          ref={canvasRef}
          width={window.innerWidth}
          height={window.innerHeight}
          className="fixed inset-0 pointer-events-none"
        />
      )}
    </div>
  );
};
