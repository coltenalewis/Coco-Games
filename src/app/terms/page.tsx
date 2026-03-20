import Link from "next/link";

export const metadata = {
  title: "Terms of Service | COCO GAMES",
};

export default function TermsPage() {
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

      <h1 className="text-3xl font-black text-coco-dark mb-8">Terms of Service</h1>

      <div className="prose prose-sm max-w-none text-coco-dark/90 space-y-6">
        <p className="text-coco-brown">
          Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using the COCO GAMES platform (&quot;Service&quot;), you agree to be bound by these
            Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">2. Account Registration</h2>
          <p>
            To use certain features of the Service, you must connect your Discord account and/or
            Roblox account through our OAuth2 authentication system. You are responsible for
            maintaining the security of your connected accounts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">3. Discord Integration</h2>
          <p>
            By connecting your Discord account, you authorize COCO GAMES to access your Discord
            profile information and server list as permitted by the scopes you approve. We use this
            information solely to provide the Service functionality.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">4. Roblox Integration</h2>
          <p>
            By connecting your Roblox account (when available), you authorize COCO GAMES to access
            your Roblox profile information as permitted by the Roblox OAuth2 scopes you approve.
            This integration is used to link your in-game identity with your COCO GAMES profile.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">5. User Conduct</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Abuse, harass, or threaten other users</li>
            <li>Attempt to exploit, hack, or disrupt the Service</li>
            <li>Use the Service for any illegal purpose</li>
            <li>Impersonate any person or entity</li>
            <li>Share your account access with others</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">6. Intellectual Property</h2>
          <p>
            All content, branding, and materials on the COCO GAMES platform are the property of
            COCO GAMES and its licensors. You may not reproduce, distribute, or create derivative
            works without explicit permission.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">7. Termination</h2>
          <p>
            COCO GAMES reserves the right to suspend or terminate your access to the Service at any
            time, with or without cause, with or without notice.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">8. Limitation of Liability</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any kind. COCO GAMES shall not be
            liable for any indirect, incidental, special, or consequential damages.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">9. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the Service after changes
            constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-coco-dark mt-8 mb-3">10. Contact</h2>
          <p>
            For questions about these Terms of Service, please reach out through our Discord community.
          </p>
        </section>
      </div>
    </div>
  );
}
