"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";

export default function GameShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768 || "ontouchstart" in window);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Scroll-based parallax for mobile
  useEffect(() => {
    if (!isMobile) return;
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      // 0 when entering bottom, 1 when exiting top
      const progress = 1 - (rect.bottom / (viewH + rect.height));
      setScrollProgress(Math.max(0, Math.min(1, progress)));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setMousePos({ x, y });
  };

  // On mobile, convert scroll progress to a parallax offset
  const mobileX = isMobile ? (scrollProgress - 0.5) * 2 : 0;
  const mobileY = isMobile ? (scrollProgress - 0.5) * -1.5 : 0;
  const isActive = hover || isMobile;
  const fx = isMobile ? mobileX : mousePos.x;
  const fy = isMobile ? mobileY : mousePos.y;
  const mobileBrightness = isMobile ? 1.1 + scrollProgress * 0.3 : 1;

  return (
    <section className="bg-coco-dark py-12 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-10" />

      <div className="relative max-w-6xl mx-auto px-3 sm:px-4">
        {/* Section header */}
        <div className="text-center mb-6 sm:mb-10">
          <span className="text-coco-accent font-bold text-xs uppercase tracking-[0.2em]">
            Featured Game
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-coco-cream mt-2 sm:mt-3">
            Country <span className="holo-text">Conquesters</span>
          </h2>
          <p className="text-coco-cream/50 text-xs sm:text-sm mt-2 sm:mt-3 max-w-lg mx-auto px-2">
            A new upcoming real-time strategy game. Build your nation, forge alliances,
            and conquer the world.
          </p>
        </div>

        {/* Game card with parallax map */}
        <div className="max-w-4xl mx-auto">
          <div
            ref={containerRef}
            className="relative border-2 border-coco-accent/30 overflow-hidden cursor-pointer group aspect-[16/10] sm:aspect-[16/8] holo-shimmer"
            onMouseEnter={() => !isMobile && setHover(true)}
            onMouseLeave={() => { setHover(false); setMousePos({ x: 0, y: 0 }); }}
            onMouseMove={handleMouseMove}
          >
            {/* Background layer */}
            <div
              className="absolute inset-0 will-change-transform"
              style={{
                transform: isActive
                  ? `scale(1.03) translate(${fx * -4}px, ${fy * -4}px)`
                  : "scale(1)",
                transition: isMobile ? "transform 0.3s ease-out" : "transform 0.7s ease-out",
              }}
            >
              <Image
                src="/cc-background.png"
                alt="Country Conquesters map background"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 896px) 100vw, 896px"
              />
            </div>

            {/* Foreground layer */}
            <div
              className="absolute inset-0 will-change-transform"
              style={{
                transform: isActive
                  ? `scale(1.08) translate(${fx * 10}px, ${fy * 10}px)`
                  : "scale(1)",
                filter: isActive
                  ? `brightness(${isMobile ? mobileBrightness : 1.3}) saturate(1.4) drop-shadow(0 0 20px rgba(232,148,74,0.4))`
                  : "brightness(1) saturate(1)",
                transition: isMobile ? "transform 0.3s ease-out, filter 0.5s ease-out" : "all 0.5s ease-out",
              }}
            >
              <Image
                src="/cc-foreground.png"
                alt="Country Conquesters map foreground"
                fill
                className="object-cover mix-blend-screen"
                sizes="(max-width: 640px) 100vw, (max-width: 896px) 100vw, 896px"
              />
            </div>

            {/* Glow overlay - follows mouse on desktop, follows scroll on mobile */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: isActive ? 1 : 0,
                background: isMobile
                  ? `radial-gradient(circle at ${50 + scrollProgress * 30}% ${50 - scrollProgress * 20}%, rgba(232,148,74,0.2) 0%, transparent 60%)`
                  : `radial-gradient(circle at ${(fx + 1) * 50}% ${(fy + 1) * 50}%, rgba(232,148,74,0.15) 0%, transparent 60%)`,
                transition: "opacity 0.5s ease",
              }}
            />

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, transparent 40%, rgba(26,15,8,0.7) 100%)",
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
                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 uppercase tracking-wider">
                      RTS
                    </span>
                  </div>
                  <h3 className="text-base sm:text-2xl font-black text-coco-cream tracking-wide">
                    COUNTRY CONQUESTERS
                  </h3>
                  <p className="text-coco-cream/50 text-[10px] sm:text-xs mt-0.5 sm:mt-1 line-clamp-2 sm:line-clamp-none max-w-md">
                    Command armies, claim territories, and rewrite history in this
                    strategy experience on Roblox.
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

            {/* Scan line effect */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: isActive ? 0.04 : 0,
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
                transition: "opacity 0.3s ease",
              }}
            />
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
    </section>
  );
}
