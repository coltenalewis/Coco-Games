"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LoginButton from "./LoginButton";
import { hasMinRole } from "@/lib/roles";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const isAdmin = hasMinRole(role, "admin");
  const isExecutive = hasMinRole(role, "executive");
  const isOwner = role === "owner";
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const linkClass = (path: string) => {
    const active = isActive(path);
    return `relative text-sm font-medium px-3 py-2 border transition-all min-h-[44px] flex items-center ${
      active
        ? "text-coco-gold border-coco-accent/50 bg-coco-accent/10"
        : "text-coco-cream/70 border-transparent hover:text-coco-gold hover:border-coco-accent/30"
    }`;
  };

  const navLinks = (
    <>
      <Link href="/profile" className={linkClass("/profile")} onClick={() => setMenuOpen(false)}>
        Profile
        {isActive("/profile") && (
          <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-coco-accent" />
        )}
      </Link>
      <Link href="/tickets" className={linkClass("/tickets")} onClick={() => setMenuOpen(false)}>
        Tickets
        {isActive("/tickets") && (
          <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-coco-accent" />
        )}
      </Link>
      {isAdmin && (
        <Link
          href="/admin"
          onClick={() => setMenuOpen(false)}
          className={`relative text-sm font-bold px-3 py-2 border transition-all min-h-[44px] flex items-center ${
            isActive("/admin")
              ? "text-coco-gold border-coco-gold/50 bg-coco-ember/20"
              : "text-coco-ember border-coco-ember/30 hover:text-coco-gold hover:border-coco-gold/50 bg-coco-ember/10"
          }`}
        >
          Admin
        </Link>
      )}
      {isExecutive && (
        <Link
          href="/accounting"
          onClick={() => setMenuOpen(false)}
          className={`relative text-sm font-bold px-3 py-2 border transition-all min-h-[44px] flex items-center ${
            isActive("/accounting")
              ? "text-coco-gold border-coco-gold/50 bg-green-900/30"
              : "text-green-400 border-green-500/30 hover:text-coco-gold hover:border-coco-gold/50 bg-green-900/10"
          }`}
        >
          Accounting
        </Link>
      )}
      {isOwner && (
        <Link
          href="/dashboard"
          onClick={() => setMenuOpen(false)}
          className={`relative text-sm font-bold px-3 py-2 border transition-all min-h-[44px] flex items-center ${
            isActive("/dashboard")
              ? "text-coco-gold border-coco-gold/50 bg-coco-accent/20"
              : "text-coco-accent border-coco-accent/30 hover:text-coco-gold hover:border-coco-gold/50 bg-coco-accent/10"
          }`}
        >
          Dashboard
        </Link>
      )}
    </>
  );

  return (
    <nav className="bg-coco-midnight/95 backdrop-blur-md border-b-2 border-coco-accent/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
            <div className="relative">
              <Image
                src="/CocoGamesLogo.png"
                alt="COCO GAMES"
                width={32}
                height={32}
                className="sm:w-[38px] sm:h-[38px] group-hover:scale-110 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-coco-accent/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-coco-gold font-bold text-sm sm:text-lg tracking-widest uppercase holo-text">
              Coco Games
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            {session && navLinks}
            <LoginButton />
          </div>

          {/* Mobile: login + hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <LoginButton />
            {session && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-10 h-10 flex items-center justify-center text-coco-cream/70 hover:text-coco-gold transition-colors"
                aria-label="Menu"
              >
                {menuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && session && (
        <div className="md:hidden border-t border-coco-accent/20 bg-coco-midnight/98 px-3 pb-3 pt-2 space-y-1">
          {navLinks}
        </div>
      )}
    </nav>
  );
}
