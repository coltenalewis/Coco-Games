import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-coco-midnight border-t-2 border-coco-accent/20 text-coco-cream/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="flex items-start gap-3">
            <Image
              src="/CocoGamesLogo.png"
              alt="COCO GAMES"
              width={32}
              height={32}
            />
            <div>
              <p className="text-coco-gold font-bold tracking-widest text-sm uppercase">
                Coco Games
              </p>
              <p className="text-xs mt-1 text-coco-cream/40">
                Crafting fun, one game at a time.
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-8 text-sm">
            <div className="space-y-2">
              <p className="text-coco-accent font-bold text-xs uppercase tracking-wider">
                Legal
              </p>
              <Link
                href="/terms"
                className="block hover:text-coco-gold transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="block hover:text-coco-gold transition-colors"
              >
                Privacy
              </Link>
            </div>
            <div className="space-y-2">
              <p className="text-coco-accent font-bold text-xs uppercase tracking-wider">
                Community
              </p>
              <a
                href="https://discord.gg/"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-coco-gold transition-colors"
              >
                Discord
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="sm:text-right">
            <p className="text-xs text-coco-cream/30">
              &copy; {new Date().getFullYear()} COCO GAMES
              <br />
              All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
