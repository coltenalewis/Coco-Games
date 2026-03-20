import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import ConnectionStatus from "@/components/ConnectionStatus";

export default async function Home() {
  const session = await getServerSession(authOptions);

  let robloxLinked = false;
  if (session?.user?.discordId) {
    const { data } = await getSupabase()
      .from("users")
      .select("roblox_id")
      .eq("discord_id", session.user.discordId)
      .maybeSingle();
    robloxLinked = !!data?.roblox_id;
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-animated-gradient min-h-[85vh] flex items-center">
        {/* Dot pattern overlay */}
        <div className="absolute inset-0 bg-dots opacity-40" />

        {/* Moving gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-coco-accent/5 rounded-full blur-[100px] animate-[gradient-shift_20s_ease_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-coco-gold/5 rounded-full blur-[80px] animate-[gradient-shift_15s_ease_infinite_reverse]" />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-coco-ember/5 rounded-full blur-[60px] animate-[gradient-shift_25s_ease_infinite]" />

        {/* Geometric accent shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-coco-accent/10 -rotate-12 translate-x-32 -translate-y-16" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-coco-gold/5 rotate-45 -translate-x-20 translate-y-20" />
        <div className="absolute top-1/2 right-1/4 w-2 h-32 bg-coco-accent/20 rotate-12" />
        <div className="absolute top-1/3 left-1/4 w-2 h-20 bg-coco-gold/15 -rotate-45" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-block px-4 py-1.5 bg-coco-accent/20 border-2 border-coco-accent/40 text-coco-gold text-xs font-bold uppercase tracking-widest mb-6 holo-shimmer">
                Game Studio
              </div>
              <h1 className="text-5xl sm:text-7xl font-black text-coco-cream leading-[0.95] mb-6">
                COCO
                <br />
                <span className="holo-text text-7xl sm:text-8xl">GAMES</span>
              </h1>
              <p className="text-lg text-coco-cream/60 mb-10 max-w-md leading-relaxed">
                A community-driven studio crafting fun, immersive experiences.
                Connect your Discord and join the adventure.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="/api/auth/signin"
                  className="btn-discord inline-flex items-center justify-center gap-3 text-base holo-shimmer"
                >
                  <svg
                    width="22"
                    height="17"
                    viewBox="0 0 71 55"
                    fill="currentColor"
                  >
                    <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309-0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9084 44.6363 54.2807 44.9293 54.6557 45.2082C54.7844 45.304 54.7759 45.5041 54.636 45.5858C52.8676 46.6197 51.0288 47.4931 49.0949 48.2228C48.969 48.2707 48.913 48.4172 48.9746 48.5383C50.0384 50.6034 51.2558 52.5699 52.5765 54.435C52.6324 54.5139 52.7331 54.5505 52.8256 54.5195C58.6268 52.7249 64.5094 50.0174 70.5823 45.5576C70.6355 45.5182 70.6691 45.459 70.6747 45.3942C72.0876 30.0791 68.1112 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.937 34.1136 40.937 30.1693C40.937 26.225 43.7636 23.0133 47.3178 23.0133C50.8999 23.0133 53.7545 26.2532 53.6985 30.1693C53.6985 34.1136 50.8999 37.3253 47.3178 37.3253Z" />
                  </svg>
                  Connect with Discord
                </a>
              </div>

              {/* Connection Status Indicators */}
              <ConnectionStatus
                isLoggedIn={!!session}
                discordName={session?.user?.name || null}
                robloxLinked={robloxLinked}
              />
            </div>

            {/* Right: Logo */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-coco-accent/20 blur-3xl scale-110 animate-[gradient-shift_8s_ease_infinite]" />
                <div className="absolute inset-[-20px] bg-coco-gold/10 blur-2xl scale-105 animate-[gradient-shift_12s_ease_infinite_reverse]" />
                <Image
                  src="/CocoGamesLogo.png"
                  alt="COCO GAMES Logo"
                  width={320}
                  height={320}
                  className="relative drop-shadow-2xl"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="bg-coco-light py-24 bg-stripes relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-coco-accent font-bold text-xs uppercase tracking-[0.2em]">
              What We Do
            </span>
            <h2 className="text-4xl font-black text-coco-dark mt-3">
              Built for <span className="text-gradient">Gamers</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="card-interactive p-8 group holo-shimmer card-glow">
              <div className="w-14 h-14 bg-coco-accent/15 border-2 border-coco-accent/30 flex items-center justify-center mb-5 group-hover:bg-coco-accent/25 transition-colors">
                <svg
                  className="w-7 h-7 text-coco-ember"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-coco-dark mb-2">
                Community First
              </h3>
              <p className="text-coco-coffee text-sm leading-relaxed">
                Join our Discord to connect with players, share feedback, and
                shape the games we build together.
              </p>
            </div>

            {/* Card 2 */}
            <div className="card-interactive p-8 group holo-shimmer card-glow">
              <div className="w-14 h-14 bg-coco-accent/15 border-2 border-coco-accent/30 flex items-center justify-center mb-5 group-hover:bg-coco-accent/25 transition-colors">
                <svg
                  className="w-7 h-7 text-coco-ember"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-coco-dark mb-2">
                Immersive Games
              </h3>
              <p className="text-coco-coffee text-sm leading-relaxed">
                Engaging games across platforms including Roblox, with a focus on
                fun, replayable experiences.
              </p>
            </div>

            {/* Card 3 */}
            <div className="card-interactive p-8 group holo-shimmer card-glow">
              <div className="w-14 h-14 bg-coco-accent/15 border-2 border-coco-accent/30 flex items-center justify-center mb-5 group-hover:bg-coco-accent/25 transition-colors">
                <svg
                  className="w-7 h-7 text-coco-ember"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-coco-dark mb-2">
                Events & Updates
              </h3>
              <p className="text-coco-coffee text-sm leading-relaxed">
                Game launches, seasonal events, and exclusive rewards for our
                community members.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Support / Tickets */}
      <section className="bg-coco-dark border-y-2 border-coco-accent/20 py-16 relative overflow-hidden">
        {/* Subtle moving background for dark section */}
        <div className="absolute inset-0 bg-animated-gradient opacity-50" />
        <div className="absolute inset-0 bg-dots opacity-20" />

        <div className="relative max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-coco-accent font-bold text-xs uppercase tracking-[0.2em]">
              Support
            </span>
            <h2 className="text-3xl font-black text-coco-cream mt-2">
              Need Help?
            </h2>
            <p className="text-coco-cream/50 text-sm mt-2 max-w-md mx-auto">
              Submit a ticket and our team will get back to you. Choose a
              category that fits your issue.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                category: "discord_appeal",
                label: "Discord Appeal",
                desc: "Appeal a ban or mute from our Discord servers",
                icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 015.636 5.636",
              },
              {
                category: "game_appeal",
                label: "Game Appeal",
                desc: "Appeal a ban or punishment in one of our games",
                icon: "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z",
              },
              {
                category: "question",
                label: "Question",
                desc: "Ask us anything about Coco Games or our community",
                icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              },
              {
                category: "business",
                label: "Business Inquiry",
                desc: "Partnerships, collaborations, or business proposals",
                icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
              },
            ].map((item) => (
              <Link
                key={item.category}
                href={`/tickets/new?category=${item.category}`}
                className="group p-5 border-2 border-coco-accent/15 bg-coco-midnight/50 hover:border-coco-accent/40 hover:bg-coco-midnight/80 transition-all holo-shimmer card-glow"
              >
                <div className="w-10 h-10 bg-coco-accent/15 border border-coco-accent/30 flex items-center justify-center mb-3 group-hover:bg-coco-accent/25 transition-colors">
                  <svg
                    className="w-5 h-5 text-coco-accent"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      d={item.icon}
                    />
                  </svg>
                </div>
                <h3 className="font-bold text-coco-cream text-sm mb-1">
                  {item.label}
                </h3>
                <p className="text-coco-cream/40 text-xs leading-relaxed">
                  {item.desc}
                </p>
              </Link>
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/tickets"
              className="text-coco-accent hover:text-coco-gold text-sm font-bold uppercase tracking-wider transition-colors"
            >
              View My Tickets &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Community CTA */}
      <section className="bg-coco-light border-b-2 border-coco-dark/5 py-10">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <p className="text-coco-dark font-black text-2xl">Join the Community</p>
            <p className="text-coco-coffee/60 text-sm mt-1">
              Connect your account and be part of something awesome.
            </p>
          </div>
          <a
            href="/api/auth/signin"
            className="btn-primary whitespace-nowrap holo-shimmer"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Footer links */}
      <section className="bg-coco-light py-8 border-t border-coco-dark/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-coco-coffee">
            <Link
              href="/terms"
              className="hover:text-coco-accent font-medium transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="hover:text-coco-accent font-medium transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
