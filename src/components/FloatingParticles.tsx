"use client";

export default function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Floating orbs */}
      <div className="particle particle-1" />
      <div className="particle particle-2" />
      <div className="particle particle-3" />
      <div className="particle particle-4" />
      <div className="particle particle-5" />
      <div className="particle particle-6" />
      <div className="particle particle-7" />
      <div className="particle particle-8" />
    </div>
  );
}
