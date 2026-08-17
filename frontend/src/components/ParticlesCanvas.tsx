import React, { useEffect, useRef } from 'react';

interface MicroGrain {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  color: string;
}

export const ParticlesCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    if (window.innerWidth < 640) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number | null = null;
    let isVisible = true;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisible = false;
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      } else {
        isVisible = true;
        if (!animationId) {
          render();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Mouse tracking for subtle ambient spotlight
    const mouse = { x: width * 0.5, y: height * 0.3, targetX: width * 0.5, targetY: height * 0.3 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Micro data grains (delicate, non-intrusive ambient stars)
    const grainCount = Math.min(Math.floor((width * height) / 30000), 40);
    const grains: MicroGrain[] = [];
    const colors = ['rgba(6, 182, 212, ', 'rgba(16, 185, 129, ', 'rgba(56, 189, 248, '];

    for (let i = 0; i < grainCount; i++) {
      grains.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        radius: Math.random() * 1.2 + 0.5,
        baseAlpha: Math.random() * 0.25 + 0.08,
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let auroraPhase = 0;

    const render = () => {
      if (!isVisible) return;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.04;
      mouse.y += (mouse.targetY - mouse.y) * 0.04;

      auroraPhase += 0.005;

      // 1. Soft Ambient Aurora Beacon behind mouse
      const gradient = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        Math.max(width * 0.4, 350)
      );
      gradient.addColorStop(0, 'rgba(6, 182, 212, 0.06)');
      gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.025)');
      gradient.addColorStop(1, 'rgba(3, 7, 18, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Render delicate micro data grains
      for (let i = 0; i < grains.length; i++) {
        const g = grains[i];
        g.x += g.vx;
        g.y += g.vy;
        g.phase += g.twinkleSpeed;

        if (g.x < 0) g.x = width;
        if (g.x > width) g.x = 0;
        if (g.y < 0) g.y = height;
        if (g.y > height) g.y = 0;

        const alpha = g.baseAlpha + Math.sin(g.phase) * (g.baseAlpha * 0.5);

        ctx.beginPath();
        ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${g.color}${Math.max(alpha, 0.03)})`;
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
};
