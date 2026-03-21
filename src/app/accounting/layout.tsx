import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasMinRole } from "@/lib/roles";
import Link from "next/link";

const navItems = [
  { href: "/accounting", label: "Overview", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/accounting/transactions", label: "Transactions", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { href: "/accounting/documents", label: "Documents", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

export default async function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !hasMinRole(session.user?.role, "executive")) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-coco-light">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <span className="text-green-600 font-bold text-xs uppercase tracking-[0.2em]">
            Finance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-coco-dark mt-1">
            Accounting
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar - horizontal scroll on mobile */}
          <aside className="lg:w-56 flex-shrink-0">
            <nav className="card p-1.5 sm:p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 sm:gap-3 px-3 py-2.5 text-xs sm:text-sm font-medium text-coco-dark hover:bg-green-50 hover:text-green-700 transition-colors whitespace-nowrap min-h-[44px]"
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0"
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
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
