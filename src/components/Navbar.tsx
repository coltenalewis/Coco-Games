"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import LoginButton from "./LoginButton";
import { hasMinRole } from "@/lib/roles";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role;
  const isAdmin = hasMinRole(role, "admin");
  const isExecutive = hasMinRole(role, "executive");
  const isOwner = role === "owner";

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  const linkClass = (path: string, base?: string) => {
    const active = isActive(path);
    return `relative text-sm font-medium px-3 py-1.5 border transition-all ${
      active
        ? "text-coco-gold border-coco-accent/50 bg-coco-accent/10"
        : `${base || "text-coco-cream/70"} border-transparent hover:text-coco-gold hover:border-coco-accent/30`
    }`;
  };

  return (
    <nav className="bg-coco-midnight/95 backdrop-blur-md border-b-2 border-coco-accent/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <Image
                src="/CocoGamesLogo.png"
                alt="COCO GAMES"
                width={38}
                height={38}
                className="group-hover:scale-110 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-coco-accent/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-coco-gold font-bold text-lg tracking-widest uppercase holo-text">
              Coco Games
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {session && (
              <>
                <Link href="/profile" className={linkClass("/profile")}>
                  Profile
                  {isActive("/profile") && (
                    <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-coco-accent" />
                  )}
                </Link>
                <Link href="/tickets" className={linkClass("/tickets")}>
                  Tickets
                  {isActive("/tickets") && (
                    <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-coco-accent" />
                  )}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`relative text-sm font-bold px-3 py-1.5 border transition-all ${
                      isActive("/admin")
                        ? "text-coco-gold border-coco-gold/50 bg-coco-ember/20"
                        : "text-coco-ember border-coco-ember/30 hover:text-coco-gold hover:border-coco-gold/50 bg-coco-ember/10"
                    }`}
                  >
                    Admin
                    {isActive("/admin") && (
                      <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-coco-ember" />
                    )}
                  </Link>
                )}
                {isExecutive && (
                  <Link
                    href="/accounting"
                    className={`relative text-sm font-bold px-3 py-1.5 border transition-all ${
                      isActive("/accounting")
                        ? "text-coco-gold border-coco-gold/50 bg-green-900/30"
                        : "text-green-400 border-green-500/30 hover:text-coco-gold hover:border-coco-gold/50 bg-green-900/10"
                    }`}
                  >
                    Accounting
                    {isActive("/accounting") && (
                      <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-green-400" />
                    )}
                  </Link>
                )}
                {isOwner && (
                  <Link
                    href="/dashboard"
                    className={`relative text-sm font-bold px-3 py-1.5 border transition-all ${
                      isActive("/dashboard")
                        ? "text-coco-gold border-coco-gold/50 bg-coco-accent/20"
                        : "text-coco-accent border-coco-accent/30 hover:text-coco-gold hover:border-coco-gold/50 bg-coco-accent/10"
                    }`}
                  >
                    Dashboard
                    {isActive("/dashboard") && (
                      <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-coco-accent" />
                    )}
                  </Link>
                )}
              </>
            )}
            <LoginButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
