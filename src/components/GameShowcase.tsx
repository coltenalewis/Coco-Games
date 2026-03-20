"use client";

import { useRef, useState } from "react";
import Image from "next/image";

export default function GameShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Normalize to -1 to 1 from center
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  return (
    <section className="bg-coco-dark py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-10" />

      <div className="relative max-w-6xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-10">
          <span className="text-coco-accent font-bold text-xs uppercase tracking-[0.2em]">
            Featured Game
          </span>
          <h2 className="text-4xl font-black text-coco-cream mt-3">
            Country <span className="text-gradient">Conquesters</span>
          </h2>
          <p className="text-coco-cream/50 text-sm mt-3 max-w-lg mx-auto">
            A new upcoming real-time strategy game. Build your nation, forge alliances,
            and conquer the world.
          </p>
        </div>

        {/* Game card with parallax map */}
        <div className="max-w-4xl mx-auto">
          <div
            ref={containerRef}
            className="relative border-2 border-coco-accent/30 overflow-hidden cursor-pointer group"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => { setHover(false); setMousePos({ x: 0, y: 0 }); }}
            onMouseMove={handleMouseMove}
            style={{ aspectRatio: "16/8" }}
          >
            {/* Background layer - stays mostly still */}
            <div
              className="absolute inset-0 transition-transform duration-700 ease-out"
              style={{
                transform: hover
                  ? `scale(1.03) translate(${mousePos.x * -4}px, ${mousePos.y * -4}px)`
                  : "scale(1)",
              }}
            >
              <Image
                src="/cc-background.png"
                alt="Country Conquesters map background"
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>

            {/* Foreground layer - moves more on hover for parallax depth */}
            <div
              className="absolute inset-0 transition-all duration-500 ease-out"
              style={{
                transform: hover
                  ? `scale(1.08) translate(${mousePos.x * 10}px, ${mousePos.y * 10}px)`
                  : "scale(1)",
                filter: hover
                  ? "brightness(1.3) saturate(1.4) drop-shadow(0 0 20px rgba(232,148,74,0.4))"
                  : "brightness(1) saturate(1)",
              }}
            >
              <Image
                src="/cc-foreground.png"
                alt="Country Conquesters map foreground"
                fill
                className="object-cover mix-blend-screen"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>

            {/* Hover glow overlay */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-500"
              style={{
                opacity: hover ? 1 : 0,
                background: `radial-gradient(circle at ${(mousePos.x + 1) * 50}% ${(mousePos.y + 1) * 50}%, rgba(232,148,74,0.15) 0%, transparent 60%)`,
              }}
            />

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, transparent 40%, rgba(26,15,8,0.7) 100%)",
              }}
            />

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-coco-midnight via-coco-midnight/90 to-transparent px-6 pt-16 pb-5">
              <div className="flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-coco-accent/20 border border-coco-accent/40 text-coco-gold uppercase tracking-wider">
                      Coming Soon
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 uppercase tracking-wider">
                      RTS
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-coco-cream tracking-wide">
                    COUNTRY CONQUESTERS
                  </h3>
                  <p className="text-coco-cream/50 text-xs mt-1 max-w-md">
                    Command armies, claim territories, and rewrite history in this
                    pixel-art strategy experience on Roblox.
                  </p>
                </div>
                <div className="hidden sm:block text-right flex-shrink-0">
                  <p className="text-[10px] text-coco-cream/30 uppercase tracking-wider mb-1">Platform</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-[#E2231A] flex items-center justify-center">
                      <span className="text-white font-black text-[8px]">R</span>
                    </div>
                    <span className="text-xs text-coco-cream/70 font-bold">Roblox</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scan line effect on hover */}
            <div
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{
                opacity: hover ? 0.04 : 0,
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
              }}
            />
          </div>

          {/* Corner accents */}
          <div className="flex justify-between mt-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-coco-accent/40" />
              <span className="text-[10px] text-coco-cream/30 uppercase tracking-wider font-bold">
                COCO GAMES STUDIO
              </span>
            </div>
            <span className="text-[10px] text-coco-cream/20 font-mono">
              2026
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
