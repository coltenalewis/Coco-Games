import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | COCO GAMES",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-coco-coffee hover:text-coco-accent text-sm font-bold mb-8 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Home
      </Link>

      <h1 className="text-3xl font-black text-coco-dark mb-8">Privacy Policy</h1>

      <div className="prose prose-sm max-w-none text-coco-dark/90 space-y-6">
        <p className="text-coco-brown">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">1. Information We Collect</h2>
          <p>When you use COCO GAMES, we may collect the following information:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Discord Account Data:</strong> Username, user ID, avatar, and server list (via OAuth2)</li>
            <li><strong>Roblox Account Data:</strong> Username, user ID, and profile information (via OAuth2, when available)</li>
            <li><strong>Usage Data:</strong> Pages visited, features used, and interaction data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>To provide and maintain the Service</li>
            <li>To identify you across our games and community platforms</li>
            <li>To manage Discord bot functionality in your servers</li>
            <li>To improve and personalize your experience</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">3. Data Storage</h2>
          <p>
            Your data is stored securely and is only accessible to authorized COCO GAMES staff.
            We do not sell, trade, or transfer your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">4. Third-Party Services</h2>
          <p>
            We integrate with Discord and Roblox using their official OAuth2 APIs. Your use of
            these services is also subject to their respective privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">5. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active. You may request deletion
            of your data at any time by contacting us through Discord.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">6. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Access your personal data</li>
            <li>Request correction of your data</li>
            <li>Request deletion of your data</li>
            <li>Disconnect your linked accounts at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">7. Contact</h2>
          <p>
            For privacy-related inquiries, please reach out through our Discord community.
          </p>
        </section>
      </div>
    </div>
  );
}
