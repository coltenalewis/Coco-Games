"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import LoginButton from "./LoginButton";
import { hasMinRole } from "@/lib/roles";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const isTeamMember = hasMinRole(role, "contractor");
  const isAdmin = hasMinRole(role, "admin");
  const isExecutive = hasMinRole(role, "executive");
  const isOwner = role === "owner";
  const [menuOpen, setMenuOpen] = useState(false);
  const [staffDropdown, setStaffDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const isStaffActive = isActive("/boards") || isActive("/requests") || isActive("/calendar");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setStaffDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const linkClass = (path: string) => {
    const active = isActive(path);
    return `relative text-sm font-medium px-3 py-2 border transition-all min-h-[44px] flex items-center ${
      active
        ? "text-coco-gold border-coco-accent/50 bg-coco-accent/10"
        : "text-coco-cream/70 border-transparent hover:text-coco-gold hover:border-coco-accent/30"
    }`;
  };

  const dropdownLinkClass = (path: string) => {
    const active = isActive(path);
    return `block px-4 py-2.5 text-sm font-medium min-h-[44px] flex items-center gap-2 transition-colors ${
      active
        ? "text-coco-gold bg-coco-accent/10"
        : "text-coco-cream/80 hover:text-coco-gold hover:bg-coco-accent/5"
    }`;
  };

  // Staff tools dropdown items
  const staffTools = [
    { href: "/boards", label: "Boards", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z", show: isTeamMember },
    { href: "/requests", label: "Requests", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", show: isTeamMember },
    { href: "/calendar", label: "Calendar", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", show: isTeamMember },
    { href: "/admin", label: "Admin Panel", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", show: isAdmin },
    { href: "/accounting", label: "Accounting", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", show: isExecutive },
    { href: "/dashboard", label: "Dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4", show: isOwner },
  ].filter((t) => t.show);

  // Desktop nav links
  const desktopNav = (
    <>
      <Link href="/profile" className={linkClass("/profile")}>
        Profile
      </Link>
      <Link href="/tickets" className={linkClass("/tickets")}>
        Tickets
      </Link>
      {isTeamMember && staffTools.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setStaffDropdown(!staffDropdown)}
            className={`relative text-sm font-bold px-3 py-2 border transition-all min-h-[44px] flex items-center gap-1.5 ${
              isStaffActive
                ? "text-coco-gold border-coco-accent/50 bg-coco-accent/10"
                : "text-coco-cream/70 border-transparent hover:text-coco-gold hover:border-coco-accent/30"
            }`}
          >
            Staff Tools
            <svg className={`w-3 h-3 transition-transform ${staffDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {staffDropdown && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-coco-midnight border-2 border-coco-accent/20 shadow-coco-lg z-50">
              {staffTools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  onClick={() => setStaffDropdown(false)}
                  className={dropdownLinkClass(tool.href)}
                >
                  <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={tool.icon} />
                  </svg>
                  {tool.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );

  // Mobile nav links
  const mobileNav = (
    <>
      <Link href="/profile" className={linkClass("/profile")} onClick={() => setMenuOpen(false)}>Profile</Link>
      <Link href="/tickets" className={linkClass("/tickets")} onClick={() => setMenuOpen(false)}>Tickets</Link>

      {isTeamMember && (
        <div className="border-t border-coco-accent/10 pt-1 mt-1">
          <p className="px-3 py-1 text-[10px] font-bold text-coco-accent uppercase tracking-widest">Staff Tools</p>
          {staffTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              onClick={() => setMenuOpen(false)}
              className={`${linkClass(tool.href)} gap-2`}
            >
              <svg className="w-4 h-4 flex-shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tool.icon} />
              </svg>
              {tool.label}
            </Link>
          ))}
        </div>
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
          <div className="hidden md:flex items-center gap-2">
            {session && desktopNav}
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
          {mobileNav}
        </div>
      )}
    </nav>
  );
}
