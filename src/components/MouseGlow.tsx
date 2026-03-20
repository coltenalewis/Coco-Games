"use client";

import { useEffect, useRef } from "react";

export default function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    let x = 0;
    let y = 0;
    let currentX = 0;
    let currentY = 0;
    let animId: number;

    const onMove = (e: MouseEvent) => {
      x = e.clientX;
      y = e.clientY;
    };

    const animate = () => {
      // Smooth follow with lerp
      currentX += (x - currentX) * 0.15;
      currentY += (y - currentY) * 0.15;
      glow.style.transform = `translate(${currentX - 200}px, ${currentY - 200}px)`;
      animId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove);
    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="pointer-events-none fixed top-0 left-0 z-30 w-[400px] h-[400px] rounded-full opacity-0 hover-glow-visible transition-opacity duration-300"
      style={{
        background:
          "radial-gradient(circle, rgba(232,148,74,0.08) 0%, rgba(245,176,65,0.04) 40%, transparent 70%)",
      }}
    />
  );
}
