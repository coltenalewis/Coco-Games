import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export const metadata = { title: "Accounting | COCO GAMES" };

export default async function AccountingOverview() {
  await getServerSession(authOptions);
  const supabase = getSupabase();

  // Get totals
  const { data: allTx } = await supabase
    .from("accounting_transactions")
    .select("type, amount");

  const totalIncome = (allTx || [])
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = (allTx || [])
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netProfit = totalIncome - totalExpenses;

  // Recent transactions
  const { data: recent } = await supabase
    .from("accounting_transactions")
    .select("*")
    .order("date", { ascending: false })
    .limit(5);

  // Document count
  const { count: docCount } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true });

  const stats = [
    {
      label: "Total Income",
      value: `$${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
    },
    {
      label: "Total Expenses",
      value: `$${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
    },
    {
      label: "Net Profit",
      value: `$${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      color: netProfit >= 0 ? "text-green-600" : "text-red-600",
      bg: netProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200",
    },
    {
      label: "Documents",
      value: String(docCount || 0),
      color: "text-coco-accent",
      bg: "bg-coco-warm border-coco-accent/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-coco-dark">Financial Overview</h2>
        <div className="flex gap-2">
          <Link href="/accounting/transactions" className="btn-primary text-xs !px-4 !py-2">
            Add Transaction
          </Link>
          <Link href="/accounting/documents/new" className="text-xs px-4 py-2 font-bold border-2 border-coco-dark/10 hover:border-green-400 text-coco-dark hover:text-green-700 transition-colors">
            New Document
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`p-5 border-2 ${stat.bg}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-coco-coffee/60">
              {stat.label}
            </p>
            <p className={`text-2xl font-black mt-1 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b-2 border-coco-dark/10 flex items-center justify-between">
          <h3 className="font-bold text-coco-dark text-sm">Recent Transactions</h3>
          <Link href="/accounting/transactions" className="text-xs text-coco-accent hover:text-coco-ember font-bold">
            View All &rarr;
          </Link>
        </div>
        {!recent || recent.length === 0 ? (
          <div className="p-8 text-center text-coco-coffee/60 text-sm">
            No transactions yet. Add your first one to get started.
          </div>
        ) : (
          <div className="divide-y divide-coco-dark/5">
            {recent.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${tx.type === "income" ? "bg-green-400" : "bg-red-400"}`} />
                  <div>
                    <p className="text-sm font-medium text-coco-dark">{tx.description}</p>
                    <p className="text-xs text-coco-coffee/50">
                      {tx.category} &middot; {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-sm ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {tx.type === "income" ? "+" : "-"}${Number(tx.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
