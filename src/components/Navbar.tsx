"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import LoginButton from "./LoginButton";
import { hasMinRole } from "@/lib/roles";

export default function Navbar() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = hasMinRole(role, "admin");
  const isOwner = role === "owner";

  return (
    <nav className="bg-coco-midnight border-b-2 border-coco-accent/30 sticky top-0 z-50">
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
            <span className="text-coco-gold font-bold text-lg tracking-widest uppercase">
              Coco Games
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {session && (
              <>
                <Link
                  href="/profile"
                  className="text-coco-cream/70 hover:text-coco-gold text-sm font-medium px-3 py-1.5 border border-transparent hover:border-coco-accent/30 transition-all"
                >
                  Profile
                </Link>
                <Link
                  href="/tickets"
                  className="text-coco-cream/70 hover:text-coco-gold text-sm font-medium px-3 py-1.5 border border-transparent hover:border-coco-accent/30 transition-all"
                >
                  Tickets
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-coco-ember hover:text-coco-gold text-sm font-bold px-3 py-1.5 border border-coco-ember/30 hover:border-coco-gold/50 bg-coco-ember/10 transition-all"
                  >
                    Admin
                  </Link>
                )}
                {isOwner && (
                  <Link
                    href="/dashboard"
                    className="text-coco-accent hover:text-coco-gold text-sm font-bold px-3 py-1.5 border border-coco-accent/30 hover:border-coco-gold/50 bg-coco-accent/10 transition-all"
                  >
                    Dashboard
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
