"use client";

import { useEffect, useState } from "react";

interface FloatingBlock {
  id: number;
  x: number;
  y: number;
  size: number;
  rotation: number;
  speed: number;
  color: string;
  delay: number;
}

const BLOCK_COLORS = [
  "bg-sky-400/30",
  "bg-emerald-400/30",
  "bg-violet-400/30",
  "bg-amber-400/30",
  "bg-rose-400/30",
  "bg-cyan-400/30",
  "bg-indigo-400/30",
  "bg-orange-400/30",
];

export default function AboveBlocksShowcase() {
  const [blocks, setBlocks] = useState<FloatingBlock[]>([]);

  useEffect(() => {
    const generated: FloatingBlock[] = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 20 + Math.random() * 40,
      rotation: Math.random() * 360,
      speed: 8 + Math.random() * 16,
      color: BLOCK_COLORS[i % BLOCK_COLORS.length],
      delay: Math.random() * -20,
    }));
    setBlocks(generated);
  }, []);

  return (
    <section className="bg-coco-dark py-12 sm:py-20 relative overflow-hidden border-t-2 border-coco-accent/10">
      <div className="absolute inset-0 bg-dots opacity-10" />

      <div className="relative max-w-6xl mx-auto px-3 sm:px-4">
        {/* Section header */}
        <div className="text-center mb-6 sm:mb-10">
          <span className="text-coco-accent font-bold text-xs uppercase tracking-[0.2em]">
            Upcoming Game
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-coco-cream mt-2 sm:mt-3">
            Above <span className="holo-text">Blocks</span>
          </h2>
          <p className="text-coco-cream/50 text-xs sm:text-sm mt-2 sm:mt-3 max-w-lg mx-auto px-2">
            A vertical block builder with rolling mechanics. Stack, roll, and
            build your way to the top.
          </p>
        </div>

        {/* Game card with animated blocks background */}
        <div className="max-w-4xl mx-auto">
          <div className="relative border-2 border-coco-accent/30 overflow-hidden aspect-[16/10] sm:aspect-[16/8] holo-shimmer group">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-950 via-indigo-950 to-coco-midnight" />

            {/* Grid lines */}
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />

            {/* Floating blocks */}
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`absolute ${block.color} border border-white/10 backdrop-blur-[1px]`}
                style={{
                  width: block.size,
                  height: block.size,
                  left: `${block.x}%`,
                  borderRadius: 3,
                  animation: `ab-float ${block.speed}s ease-in-out ${block.delay}s infinite`,
                  transform: `rotate(${block.rotation}deg)`,
                }}
              />
            ))}

            {/* Center glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-coco-accent/5 rounded-full blur-[80px] animate-pulse" />
            </div>

            {/* Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 30%, rgba(26,15,8,0.8) 100%)",
              }}
            />

            {/* Bottom info bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-coco-midnight via-coco-midnight/90 to-transparent px-3 sm:px-6 pt-10 sm:pt-16 pb-3 sm:pb-5">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 flex-wrap">
                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 bg-coco-accent/20 border border-coco-accent/40 text-coco-gold uppercase tracking-wider">
                      Coming Soon
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 bg-sky-500/20 border border-sky-500/40 text-sky-400 uppercase tracking-wider">
                      Builder
                    </span>
                  </div>
                  <h3 className="text-base sm:text-2xl font-black text-coco-cream tracking-wide">
                    ABOVE BLOCKS
                  </h3>
                  <p className="text-coco-cream/50 text-[10px] sm:text-xs mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none max-w-md">
                    Stack and roll blocks vertically in this creative building
                    experience on Roblox.
                  </p>
                </div>
                <div className="hidden sm:block text-right flex-shrink-0">
                  <p className="text-[10px] text-coco-cream/30 uppercase tracking-wider mb-1">
                    Platform
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 bg-[#E2231A] flex items-center justify-center">
                      <span className="text-white font-black text-[8px]">
                        R
                      </span>
                    </div>
                    <span className="text-xs text-coco-cream/70 font-bold">
                      Roblox
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Corner accents */}
          <div className="flex justify-between mt-2 sm:mt-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-coco-accent/40" />
              <span className="text-[9px] sm:text-[10px] text-coco-cream/30 uppercase tracking-wider font-bold">
                COCO GAMES STUDIO
              </span>
            </div>
            <span className="text-[9px] sm:text-[10px] text-coco-cream/20 font-mono">
              2026
            </span>
          </div>
        </div>
      </div>

      {/* Keyframes for floating animation */}
      <style jsx>{`
        @keyframes ab-float {
          0% {
            transform: translateY(120%) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-120%) rotate(180deg);
            opacity: 0;
          }
        }
      `}</style>
    </section>
  );
}
