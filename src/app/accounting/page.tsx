import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import DashboardCharts from "@/components/accounting/DashboardCharts";

export const metadata = { title: "Accounting | COCO GAMES" };

export default async function AccountingOverview() {
  await getServerSession(authOptions);
  const supabase = getSupabase();

  // Fetch all transactions
  const { data: allTx } = await supabase
    .from("accounting_transactions")
    .select("*")
    .order("date", { ascending: true });

  const transactions = allTx || [];

  // ---- Totals ----
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netProfit = totalIncome - totalExpenses;
  const txCount = transactions.length;

  // ---- Monthly Aggregation (last 12 months) ----
  const monthlyMap = new Map<string, { income: number; expense: number }>();

  // Pre-fill last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { income: 0, expense: 0 });
  }

  for (const tx of transactions) {
    const d = new Date(tx.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { income: 0, expense: 0 });
    }
    const entry = monthlyMap.get(key)!;
    if (tx.type === "income") entry.income += Number(tx.amount);
    else entry.expense += Number(tx.amount);
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([key, val]) => {
      const month = parseInt(key.split("-")[1]) - 1;
      return { month: monthNames[month], income: val.income, expense: val.expense };
    });

  // ---- Category Breakdown ----
  const incomeCatMap = new Map<string, number>();
  const expenseCatMap = new Map<string, number>();

  for (const tx of transactions) {
    const map = tx.type === "income" ? incomeCatMap : expenseCatMap;
    map.set(tx.category, (map.get(tx.category) || 0) + Number(tx.amount));
  }

  const incomeCategories = Array.from(incomeCatMap.entries())
    .map(([category, amount]) => ({ category, amount, type: "income" as const }))
    .sort((a, b) => b.amount - a.amount);

  const expenseCategories = Array.from(expenseCatMap.entries())
    .map(([category, amount]) => ({ category, amount, type: "expense" as const }))
    .sort((a, b) => b.amount - a.amount);

  // ---- This Month vs Last Month ----
  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;

  const thisMonthData = monthlyMap.get(thisMonthKey) || { income: 0, expense: 0 };
  const lastMonthData = monthlyMap.get(lastMonthKey) || { income: 0, expense: 0 };

  const thisMonthNet = thisMonthData.income - thisMonthData.expense;
  const lastMonthNet = lastMonthData.income - lastMonthData.expense;

  // ---- Profit margin ----
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  // ---- Recent transactions ----
  const recent = [...transactions].reverse().slice(0, 8);

  // ---- Document count ----
  const { count: docCount } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true });

  // ---- Top expense category ----
  const topExpense = expenseCategories[0];

  const stats = [
    {
      label: "Total Income",
      value: `$${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: `${incomeCategories.length} categories`,
      color: "text-green-600",
      bg: "bg-green-50 border-green-200",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    {
      label: "Total Expenses",
      value: `$${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: topExpense ? `Top: ${topExpense.category}` : "",
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
      icon: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
    },
    {
      label: "Net Profit",
      value: `$${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: `${profitMargin.toFixed(1)}% margin`,
      color: netProfit >= 0 ? "text-green-600" : "text-red-600",
      bg: netProfit >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200",
      icon: netProfit >= 0
        ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
        : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6",
    },
    {
      label: "This Month",
      value: `$${thisMonthNet.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      sub: lastMonthNet !== 0
        ? `${thisMonthNet >= lastMonthNet ? "+" : ""}${(((thisMonthNet - lastMonthNet) / Math.abs(lastMonthNet || 1)) * 100).toFixed(0)}% vs last`
        : "No prior month",
      color: thisMonthNet >= 0 ? "text-green-600" : "text-red-600",
      bg: "bg-coco-warm border-coco-accent/20",
      icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    },
  ];

  const quickStats = [
    { label: "Transactions", value: txCount },
    { label: "Documents", value: docCount || 0 },
    { label: "Avg Transaction", value: `$${txCount > 0 ? (transactions.reduce((s, t) => s + Number(t.amount), 0) / txCount).toFixed(0) : "0"}` },
    { label: "Profit Margin", value: `${profitMargin.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-coco-dark">Financial Dashboard</h2>
          <p className="text-[10px] sm:text-xs text-coco-coffee/50 mt-0.5">{txCount} transactions &middot; {docCount || 0} documents</p>
        </div>
        <div className="flex gap-2">
          <Link href="/accounting/transactions" className="btn-primary text-xs !px-3 sm:!px-4 !py-2 min-h-[40px] flex items-center">
            Add Transaction
          </Link>
          <Link href="/accounting/documents/new" className="text-xs px-3 sm:px-4 py-2 font-bold border-2 border-coco-dark/10 hover:border-green-400 text-coco-dark hover:text-green-700 transition-colors min-h-[40px] flex items-center">
            New Document
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`p-3 sm:p-5 border-2 ${stat.bg} relative overflow-hidden`}>
            {/* Background icon */}
            <svg className="absolute -right-2 -bottom-2 w-16 h-16 sm:w-20 sm:h-20 opacity-[0.06]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
            </svg>
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-coco-coffee/60">
              {stat.label}
            </p>
            <p className={`text-base sm:text-2xl font-black mt-1 ${stat.color}`}>
              {stat.value}
            </p>
            {stat.sub && (
              <p className="text-[9px] sm:text-[10px] text-coco-coffee/40 mt-0.5">{stat.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Stats Bar */}
      <div className="card p-3 sm:p-4 flex flex-wrap gap-x-6 sm:gap-x-10 gap-y-2 justify-center sm:justify-start">
        {quickStats.map((qs) => (
          <div key={qs.label} className="text-center sm:text-left">
            <p className="text-lg sm:text-xl font-black text-coco-dark">{qs.value}</p>
            <p className="text-[9px] sm:text-[10px] text-coco-coffee/50 uppercase tracking-wider">{qs.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts
        monthlyData={monthlyData}
        incomeCategories={incomeCategories}
        expenseCategories={expenseCategories}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
      />

      {/* Recent Transactions */}
      <div className="card overflow-hidden">
        <div className="px-3 sm:px-5 py-3 sm:py-4 border-b-2 border-coco-dark/10 flex items-center justify-between">
          <h3 className="font-bold text-coco-dark text-xs sm:text-sm">Recent Transactions</h3>
          <Link href="/accounting/transactions" className="text-[10px] sm:text-xs text-coco-accent hover:text-coco-ember font-bold min-h-[36px] flex items-center">
            View All &rarr;
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="p-8 text-center text-coco-coffee/40 text-sm">
            No transactions yet. Add your first one to get started.
          </div>
        ) : (
          <div className="divide-y divide-coco-dark/5">
            {recent.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0 ${tx.type === "income" ? "bg-green-400" : "bg-red-400"}`} />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-coco-dark truncate">{tx.description}</p>
                    <p className="text-[10px] sm:text-xs text-coco-coffee/50 truncate">
                      {tx.category} &middot; {new Date(tx.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`font-bold text-xs sm:text-sm flex-shrink-0 ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}>
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
