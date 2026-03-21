"use client";

// ============================================
// TYPES
// ============================================
interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface CategoryData {
  category: string;
  amount: number;
  type: "income" | "expense";
}

interface DashboardChartsProps {
  monthlyData: MonthlyData[];
  incomeCategories: CategoryData[];
  expenseCategories: CategoryData[];
  totalIncome: number;
  totalExpenses: number;
}

// ============================================
// COLORS
// ============================================
const INCOME_COLORS = ["#22c55e", "#16a34a", "#15803d", "#166534", "#14532d", "#4ade80"];
const EXPENSE_COLORS = ["#ef4444", "#dc2626", "#b91c1c", "#991b1b", "#7f1d1d", "#f87171"];

// ============================================
// BAR CHART - Monthly Income vs Expenses
// ============================================
function MonthlyBarChart({ data }: { data: MonthlyData[] }) {
  if (data.length === 0) {
    return <EmptyState text="No monthly data yet" />;
  }

  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 1);

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const incPct = (d.income / maxVal) * 100;
        const expPct = (d.expense / maxVal) * 100;
        return (
          <div key={d.month} className="space-y-1">
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-coco-coffee">
              <span className="font-bold w-8 sm:w-12">{d.month}</span>
              <div className="flex gap-3 sm:gap-4 text-[10px]">
                <span className="text-green-600">+${d.income.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                <span className="text-red-500">-${d.expense.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
            <div className="flex gap-1 h-4 sm:h-5">
              <div
                className="bg-green-400 transition-all duration-700 ease-out rounded-r-sm"
                style={{ width: `${incPct}%`, minWidth: d.income > 0 ? "4px" : "0" }}
              />
              <div
                className="bg-red-400 transition-all duration-700 ease-out rounded-r-sm"
                style={{ width: `${expPct}%`, minWidth: d.expense > 0 ? "4px" : "0" }}
              />
            </div>
          </div>
        );
      })}
      {/* Legend */}
      <div className="flex gap-4 pt-2 border-t border-coco-dark/5">
        <div className="flex items-center gap-1.5 text-[10px] text-coco-coffee">
          <div className="w-3 h-3 bg-green-400 rounded-sm" /> Income
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-coco-coffee">
          <div className="w-3 h-3 bg-red-400 rounded-sm" /> Expenses
        </div>
      </div>
    </div>
  );
}

// ============================================
// DONUT CHART - Category breakdown
// ============================================
function DonutChart({
  data,
  colors,
  total,
  label,
}: {
  data: CategoryData[];
  colors: string[];
  total: number;
  label: string;
}) {
  if (data.length === 0 || total === 0) {
    return <EmptyState text={`No ${label.toLowerCase()} data`} />;
  }

  const size = 120;
  const stroke = 20;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const segments = data.map((d, i) => {
    const pct = d.amount / total;
    const dashLength = pct * circumference;
    const offset = cumulativeOffset;
    cumulativeOffset += dashLength;
    return {
      ...d,
      color: colors[i % colors.length],
      pct,
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: -offset,
    };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth={stroke}
          />
          {/* Data segments */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx={size / 2} cy={size / 2} r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={seg.dashArray}
              strokeDashoffset={seg.dashOffset}
              className="transition-all duration-700 ease-out"
            />
          ))}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-xs font-black text-coco-dark">${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
          <p className="text-[9px] text-coco-coffee/50 uppercase">{label}</p>
        </div>
      </div>
      {/* Legend */}
      <div className="space-y-1 w-full">
        {segments.slice(0, 5).map((seg, i) => (
          <div key={i} className="flex items-center justify-between text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: seg.color }} />
              <span className="text-coco-coffee truncate">{seg.category}</span>
            </div>
            <span className="font-bold text-coco-dark flex-shrink-0 ml-2">
              ${seg.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// PROFIT TREND SPARKLINE
// ============================================
function ProfitSparkline({ data }: { data: MonthlyData[] }) {
  if (data.length < 2) {
    return <EmptyState text="Need 2+ months for trend" />;
  }

  const profits = data.map((d) => d.income - d.expense);
  const minP = Math.min(...profits);
  const maxP = Math.max(...profits);
  const range = maxP - minP || 1;

  const width = 280;
  const height = 80;
  const padX = 10;
  const padY = 10;

  const points = profits.map((p, i) => {
    const x = padX + (i / (profits.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (p - minP) / range) * (height - padY * 2);
    return { x, y, value: p };
  });

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${line} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`;

  // Zero line position
  const zeroY = minP >= 0 ? height - padY : padY + (1 - (0 - minP) / range) * (height - padY * 2);

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* Zero line */}
        <line x1={padX} y1={zeroY} x2={width - padX} y2={zeroY} stroke="rgba(0,0,0,0.1)" strokeDasharray="4 4" />
        {/* Area fill */}
        <path d={areaPath} fill="url(#profitGrad)" opacity="0.3" />
        {/* Line */}
        <path d={line} fill="none" stroke="#E8944A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r="3.5"
            fill={p.value >= 0 ? "#22c55e" : "#ef4444"}
            stroke="white" strokeWidth="1.5"
          />
        ))}
        {/* Labels */}
        {data.map((d, i) => (
          <text key={i} x={points[i].x} y={height - 1} textAnchor="middle" className="text-[7px] fill-coco-coffee/40">{d.month}</text>
        ))}
        <defs>
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E8944A" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#E8944A" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ============================================
// CASH FLOW WATERFALL
// ============================================
function CashFlowBar({ monthlyData }: { monthlyData: MonthlyData[] }) {
  if (monthlyData.length === 0) return <EmptyState text="No cash flow data" />;

  let running = 0;
  const bars = monthlyData.map((d) => {
    const net = d.income - d.expense;
    const prev = running;
    running += net;
    return { month: d.month, net, running, prev };
  });

  const maxAbs = Math.max(Math.abs(Math.min(...bars.map(b => Math.min(b.running, b.prev)))), Math.abs(Math.max(...bars.map(b => Math.max(b.running, b.prev)))), 1);

  return (
    <div className="flex items-end gap-1 sm:gap-2 h-32 sm:h-40">
      {bars.map((b) => {
        const pct = (Math.abs(b.net) / (maxAbs * 2)) * 100;
        return (
          <div key={b.month} className="flex-1 flex flex-col items-center gap-1">
            <span className={`text-[9px] font-bold ${b.net >= 0 ? "text-green-600" : "text-red-500"}`}>
              {b.net >= 0 ? "+" : ""}${b.net.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>
            <div className="w-full flex flex-col items-center justify-end h-full">
              <div
                className={`w-full max-w-[40px] rounded-t-sm transition-all duration-700 ${b.net >= 0 ? "bg-green-400" : "bg-red-400"}`}
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <span className="text-[8px] sm:text-[9px] text-coco-coffee/50">{b.month}</span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================
function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-coco-coffee/30 text-xs">
      {text}
    </div>
  );
}

// ============================================
// MAIN EXPORT
// ============================================
export default function DashboardCharts({
  monthlyData,
  incomeCategories,
  expenseCategories,
  totalIncome,
  totalExpenses,
}: DashboardChartsProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Row 1: Monthly Bar Chart + Profit Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-bold text-coco-dark mb-4">Monthly Income vs Expenses</h3>
          <MonthlyBarChart data={monthlyData} />
        </div>
        <div className="card p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-bold text-coco-dark mb-4">Profit Trend</h3>
          <ProfitSparkline data={monthlyData} />
        </div>
      </div>

      {/* Row 2: Donut Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="card p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-bold text-coco-dark mb-4">Income Breakdown</h3>
          <DonutChart data={incomeCategories} colors={INCOME_COLORS} total={totalIncome} label="Income" />
        </div>
        <div className="card p-4 sm:p-6">
          <h3 className="text-xs sm:text-sm font-bold text-coco-dark mb-4">Expense Breakdown</h3>
          <DonutChart data={expenseCategories} colors={EXPENSE_COLORS} total={totalExpenses} label="Expenses" />
        </div>
      </div>

      {/* Row 3: Cash Flow Waterfall */}
      <div className="card p-4 sm:p-6">
        <h3 className="text-xs sm:text-sm font-bold text-coco-dark mb-4">Net Cash Flow by Month</h3>
        <CashFlowBar monthlyData={monthlyData} />
      </div>
    </div>
  );
}
