/**
 * FinanceAnalyticsDashboard — FIXED 2026-05-06
 *
 * Bugs fixed:
 *  1. "loads then goes blank" — setLoading(true) inside loadData() + 2s setTimeout
 *     caused a spinner to flash at T+2s, hiding content momentarily.
 *     Fix: eliminated local loading state and the setTimeout retry entirely.
 *
 *  2. Stale local revenues/payables state — component kept its own useState copy
 *     that didn't update when FinanceContext re-hydrated. Charts showed stale data.
 *     Fix: removed local state; reads directly from FinanceContext (reactive).
 *
 *  3. recharts v3 Bar label object — label={{ position, formatter, fontSize }}
 *     is recharts v2 API. In recharts 3.8.1 this prop shape is no longer supported.
 *     Fix: replaced with a custom <text> SVG label component.
 *
 *  4. Silent blank when revenues exist but none in date range — neither the
 *     charts block (guarded by monthRevenues.length>0) nor the warning
 *     (guarded by revenues.length===0) showed. Page appeared blank below KPIs.
 *     Fix: added explicit empty-state card for this case.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { useCity } from "../../contexts/CityContext";
import { useGlobalFilters } from "../navigation/GlobalFilterBar";
import { useFinance } from "../../contexts/FinanceContext";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet,
  RefreshCcw, ArrowUpRight, ArrowDownRight, AlertCircle, CalendarOff,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const MONTHS = [
  { value: "2026-04", label: "April 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-01", label: "January 2026" },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function KPICard({ title, value, change, icon: Icon, color = "blue" }: {
  title: string; value: string; change?: number;
  icon: React.ElementType; color?: "blue" | "green" | "red" | "purple";
}) {
  const isPos = (change ?? 0) >= 0;
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",   purple: "bg-purple-50 text-purple-600",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {isPos
                  ? <ArrowUpRight className="w-3 h-3 text-green-600" />
                  : <ArrowDownRight className="w-3 h-3 text-red-600" />}
                <span className={`text-xs font-medium ${isPos ? "text-green-600" : "text-red-600"}`}>
                  {Math.abs(change).toFixed(1)}% vs prev period
                </span>
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// recharts v3 compatible Bar label — replaces broken v2 label={{ formatter }} object
function BarTopLabel({ x, y, width, value }: any) {
  if (!value || value === 0) return null;
  return (
    <text
      x={(x || 0) + (width || 0) / 2}
      y={(y || 0) - 4}
      fill="#374151"
      textAnchor="middle"
      fontSize={11}
    >
      {`₹${(Number(value) / 1000).toFixed(0)}K`}
    </text>
  );
}

export function FinanceAnalyticsDashboard() {
  const { city, cityInfo } = useCity();
  // Read directly from FinanceContext — reactive to Supabase re-hydration
  const {
    revenues: allRevenues,
    payables: allPayables,
    getRevenueByCity,
    getPayablesByCity,
  } = useFinance();

  const { filters } = useGlobalFilters();
  // Dynamic defaults: last 90 days if no filter set
  const today = new Date().toISOString().split("T")[0];
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const rawStart = filters.startDate || ninetyDaysAgo;
  const rawEnd   = filters.endDate   || today;
  // Guard against inverted range — swap if needed
  const filterStart = rawStart <= rawEnd ? rawStart : rawEnd;
  const filterEnd   = rawStart <= rawEnd ? rawEnd   : rawStart;

  // City-filtered (reactive — updates whenever FinanceContext updates)
  const revenues = useMemo(() => getRevenueByCity(city), [allRevenues, city]);
  const payables = useMemo(() => getPayablesByCity(city), [allPayables, city]);

  // Date-range filtered
  const monthRevenues = useMemo(
    () => revenues.filter((r: any) => {
      const d = r?.receivedDate || "";
      return d >= filterStart && d <= filterEnd;
    }),
    [revenues, filterStart, filterEnd]
  );

  const monthPayables = useMemo(
    () => payables.filter((p: any) => {
      const d = p?.dueDate || p?.paidAt || "";
      return d >= filterStart && d <= filterEnd;
    }),
    [payables, filterStart, filterEnd]
  );

  const prevRevenues = useMemo(() => {
    const start = new Date(filterStart);
    const end   = new Date(filterEnd);
    const dur   = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - dur).toISOString().split("T")[0];
    return revenues.filter((r: any) => {
      const d = r?.receivedDate || "";
      return d >= prevStart && d < filterStart;
    });
  }, [revenues, filterStart, filterEnd]);

  const summary = useMemo(() => {
    const totalRevenue   = monthRevenues.reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const prevRevenue    = prevRevenues.reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const totalExpenses  = monthPayables
      .filter((p: any) => p?.status === "Paid")
      .reduce((s: number, p: any) => s + (Number(p?.amount) || 0), 0);
    const subRevenue     = monthRevenues
      .filter((r: any) => r?.type === "Subscription")
      .reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const onetimeRevenue = totalRevenue - subRevenue;
    const profit         = totalRevenue - totalExpenses;
    const revenueGrowth  = prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : 0;
    const uniqueCustomers = new Set(
      monthRevenues.map((r: any) => r?.customerId).filter(Boolean)
    ).size;
    return {
      totalRevenue, totalExpenses, profit, subRevenue, onetimeRevenue,
      revenueGrowth, uniqueCustomers,
      allTimeRevenue: revenues.reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0),
    };
  }, [monthRevenues, prevRevenues, monthPayables, revenues]);

  const trendData = useMemo(() => {
    const daily: Record<string, number> = {};
    monthRevenues.forEach((r: any) => {
      const d = r?.receivedDate?.slice(0, 10) || "";
      if (d) daily[d] = (daily[d] || 0) + (Number(r?.amount) || 0);
    });
    return Object.entries(daily)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        amount,
      }));
  }, [monthRevenues]);

  const typeData = useMemo(() => {
    const types: Record<string, number> = {};
    monthRevenues.forEach((r: any) => {
      const t = r?.type || "Other";
      types[t] = (types[t] || 0) + (Number(r?.amount) || 0);
    });
    return Object.entries(types)
      .map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] }))
      .filter(x => x.value > 0);
  }, [monthRevenues]);

  const monthCompare = useMemo(() =>
    [...MONTHS].reverse().map(m => ({
      month: m.label.split(" ")[0],
      revenue: revenues
        .filter((r: any) => r?.receivedDate?.startsWith(m.value))
        .reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0),
    })),
    [revenues]
  );

  // Earliest and latest receivedDate for "available range" hint
  const availableRange = useMemo(() => {
    if (revenues.length === 0) return null;
    const dates = revenues
      .map((r: any) => r?.receivedDate)
      .filter(Boolean)
      .sort();
    return { from: dates[0]?.slice(0, 7), to: dates[dates.length - 1]?.slice(0, 7) };
  }, [revenues]);

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cityInfo.displayName} ·{" "}
            {revenues.length > 0
              ? `${revenues.length} records`
              : "No data"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            📅 {filterStart} → {filterEnd}
            <span className="text-xs text-gray-400 ml-1">(set via filter bar)</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            <RefreshCcw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* No data at all */}
      {revenues.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              No revenue data found for {cityInfo.displayName}
            </p>
            <p className="text-sm text-amber-600 mt-1">
              Data loads from Supabase on login. Click Refresh or log out and back in.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards — always shown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title="Total Revenue"
          value={`₹${summary.totalRevenue.toLocaleString("en-IN")}`}
          change={summary.revenueGrowth}
          icon={DollarSign}
          color="blue"
        />
        <KPICard
          title="Subscription Revenue"
          value={`₹${summary.subRevenue.toLocaleString("en-IN")}`}
          icon={RefreshCcw}
          color="green"
        />
        <KPICard
          title="Net Profit"
          value={`₹${summary.profit.toLocaleString("en-IN")}`}
          icon={summary.profit >= 0 ? TrendingUp : TrendingDown}
          color={summary.profit >= 0 ? "green" : "red"}
        />
        <KPICard
          title="Active Customers"
          value={summary.uniqueCustomers.toString()}
          icon={Wallet}
          color="purple"
        />
      </div>

      {revenues.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
            All-time: ₹{summary.allTimeRevenue.toLocaleString("en-IN")}
          </Badge>
          <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
            {revenues.length} total records
          </Badge>
          <Badge className="bg-purple-100 text-purple-800 text-sm px-3 py-1">
            {monthRevenues.length} in selected range
          </Badge>
        </div>
      )}

      {/* Empty-state when revenues exist but nothing in date range (Bug 4 fix) */}
      {revenues.length > 0 && monthRevenues.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarOff className="w-12 h-12 text-gray-300 mb-3" />
            <p className="font-medium text-gray-600">No revenue in selected date range</p>
            <p className="text-sm text-gray-400 mt-1">
              Showing: {filterStart} → {filterEnd}
            </p>
            {availableRange && (
              <p className="text-xs text-gray-400 mt-1">
                Available data: {availableRange.from} to {availableRange.to}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-3">
              Use the filter bar at the top to adjust the date range.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Charts section — only when data is in range */}
      {monthRevenues.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Daily Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Daily Revenue — {filterStart} to {filterEnd}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      width={55}
                      tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
                    />
                    <Tooltip
                      formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                      name="Revenue"
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by Type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Revenue by Type</CardTitle>
              </CardHeader>
              <CardContent>
                {typeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                        isAnimationActive={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {typeData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">
                    No type breakdown for selected range
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Revenue Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={monthCompare}
                  margin={{ top: 24, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={60}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                  />
                  {/* Bug 3 fix: custom label component instead of v2 object */}
                  <Bar
                    dataKey="revenue"
                    fill="#3b82f6"
                    name="Revenue"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                    label={<BarTopLabel />}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Revenue Summary — {filterStart} to {filterEnd}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: "Total Revenue",          value: summary.totalRevenue,   color: "text-blue-700" },
                  { label: "Subscription Revenue",   value: summary.subRevenue,     color: "text-green-700" },
                  { label: "One-time Revenue",        value: summary.onetimeRevenue, color: "text-amber-700" },
                  { label: "Total Expenses (Paid)",   value: summary.totalExpenses,  color: "text-red-700" },
                  {
                    label: "Net Profit",
                    value: summary.profit,
                    color: summary.profit >= 0 ? "text-green-700" : "text-red-700",
                  },
                ].map(row => (
                  <div
                    key={row.label}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <span className="text-sm text-gray-600">{row.label}</span>
                    <span className={`font-semibold text-sm ${row.color}`}>
                      ₹{row.value.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
