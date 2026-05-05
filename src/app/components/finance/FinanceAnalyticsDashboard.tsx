import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useCity } from "../../contexts/CityContext";
import { useGlobalFilters } from "../navigation/GlobalFilterBar";
import { useFinance } from "../../contexts/FinanceContext";
import { DataService } from "../../services/DataService";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet,
  RefreshCcw, ArrowUpRight, ArrowDownRight, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const MONTHS = [
  { value: "2026-04", label: "April 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-01", label: "January 2026" },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function KPICard({ title, value, change, icon: Icon, color = "blue" }: any) {
  const isPos = change >= 0;
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
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
                  {Math.abs(change).toFixed(1)}% vs prev month
                </span>
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FinanceAnalyticsDashboard() {
  const { city, cityInfo } = useCity();
  const { getRevenueByCity, getPayablesByCity } = useFinance();
  const { filters, setFilters } = useGlobalFilters();
  // Derive selectedMonth from GlobalFilterBar startDate
  // If user picked Jan 6 - Mar 10 2026, use those months
  const filterStart = filters.startDate || "2026-01-01";
  const filterEnd   = filters.endDate   || "2026-04-30";
  const [revenues, setRevenues] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState("loading");

  // Load data — try context first, then direct localStorage
  const loadData = () => {
    setLoading(true);
    try {
      // Try FinanceContext first
      let revs = getRevenueByCity(city) || [];
      let pays = getPayablesByCity(city) || [];

      // If context is empty, read directly from localStorage
      if (revs.length === 0) {
        const raw = localStorage.getItem("cleancar_revenues") ||
                    localStorage.getItem(`cleancar_${city}_revenues`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            revs = Array.isArray(parsed)
              ? parsed.filter((r: any) => r?.cityId === city || !r?.cityId)
              : [];
            setDataSource("localStorage");
          } catch (e) { revs = []; }
        }
      } else {
        setDataSource("context");
      }

      if (pays.length === 0) {
        const raw = localStorage.getItem("cleancar_payables") ||
                    localStorage.getItem(`cleancar_${city}_payables`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            pays = Array.isArray(parsed)
              ? parsed.filter((p: any) => p?.cityId === city || !p?.cityId)
              : [];
          } catch (e) { pays = []; }
        }
      }

      setRevenues(revs);
      setPayables(pays);
      setLoading(false);

      // Log available months
      if (revs.length > 0) {
        const months = [...new Set(
          revs.map((r: any) => r?.receivedDate?.slice(0, 7)).filter(Boolean)
        )].sort().reverse() as string[];
        console.log("[Finance] Available months:", months.join(", "));
        console.log("[Finance] Filter range:", filterStart, "to", filterEnd);
      }
    } catch (e) {
      console.error("Finance load error:", e);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Re-try after 2s in case Supabase loader hasn't finished
    const t = setTimeout(loadData, 2000);
    return () => clearTimeout(t);
  }, [city]);

  // Filter by GlobalFilterBar date range
  const monthRevenues = useMemo(() =>
    revenues.filter((r: any) => {
      const d = r?.receivedDate || "";
      return d >= filterStart && d <= filterEnd;
    }),
    [revenues, filterStart, filterEnd]
  );

  const monthPayables = useMemo(() =>
    payables.filter((p: any) => {
      const d = p?.dueDate || p?.paidAt || "";
      return d >= filterStart && d <= filterEnd;
    }),
    [payables, filterStart, filterEnd]
  );

  // Previous period for comparison (same duration before filterStart)
  const prevRevenues = useMemo(() => {
    const start = new Date(filterStart);
    const end   = new Date(filterEnd);
    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration).toISOString().split("T")[0];
    const prevEnd   = filterStart;
    return revenues.filter((r: any) => {
      const d = r?.receivedDate || "";
      return d >= prevStart && d < prevEnd;
    });
  }, [revenues, filterStart, filterEnd]);

  // KPI calculations
  const summary = useMemo(() => {
    const totalRevenue  = monthRevenues.reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const prevRevenue   = prevRevenues.reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const totalExpenses = payables.filter((p: any) => p?.status === "Paid")
      .reduce((s: number, p: any) => s + (Number(p?.amount) || 0), 0);
    const subRevenue    = monthRevenues.filter((r: any) => r?.type === "Subscription")
      .reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const onetimeRevenue = totalRevenue - subRevenue;
    const profit        = totalRevenue - totalExpenses;
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const uniqueCustomers = new Set(monthRevenues.map((r: any) => r?.customerId).filter(Boolean)).size;

    return {
      totalRevenue, totalExpenses, profit, subRevenue, onetimeRevenue,
      revenueGrowth, uniqueCustomers,
      allTimeRevenue: revenues.reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0),
    };
  }, [monthRevenues, prevRevenues, payables, revenues]);

  // Daily trend data
  const trendData = useMemo(() => {
    const daily: Record<string, number> = {};
    monthRevenues.forEach((r: any) => {
      const d = r?.receivedDate?.slice(0, 10) || "";
      if (d) daily[d] = (daily[d] || 0) + (Number(r?.amount) || 0);
    });
    return Object.entries(daily).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        amount,
      }));
  }, [monthRevenues]);

  // Revenue by type
  const typeData = useMemo(() => {
    const types: Record<string, number> = {};
    monthRevenues.forEach((r: any) => {
      const t = r?.type || "Other";
      types[t] = (types[t] || 0) + (Number(r?.amount) || 0);
    });
    return Object.entries(types).map(([name, value], i) => ({
      name, value, color: COLORS[i % COLORS.length],
    })).filter(x => x.value > 0);
  }, [monthRevenues]);

  // Monthly comparison - all 4 seeded months
  const monthCompare = useMemo(() => {
    return MONTHS.slice(0, 4).map(m => ({
      month: m.label.split(" ")[0],
      revenue: revenues.filter((r: any) => r?.receivedDate?.startsWith(m.value))
        .reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0),
      isInRange: m.value >= filterStart.slice(0,7) && m.value <= filterEnd.slice(0,7),
    })).reverse();
  }, [revenues, filterStart, filterEnd]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {cityInfo.displayName} ·{" "}
            {revenues.length > 0
              ? `${revenues.length} total records · ${dataSource}`
              : "No data loaded"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
            📅 {filterStart} → {filterEnd}
            <span className="text-xs text-gray-400 ml-1">(set via top filter bar)</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCcw className="w-4 h-4 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* No data warning */}
      {revenues.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">No revenue data found for {cityInfo.displayName}</p>
            <p className="text-sm text-amber-600 mt-1">
              Data loads from Supabase on login. Try clicking Refresh or logging out and back in.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
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

      {/* All-time Revenue Badge */}
      {revenues.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
            All-time Revenue: ₹{summary.allTimeRevenue.toLocaleString("en-IN")}
          </Badge>
          <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
            {revenues.length} Revenue Records
          </Badge>
          <Badge className="bg-purple-100 text-purple-800 text-sm px-3 py-1">
            {monthRevenues.length} in {`${filterStart} to ${filterEnd}`}
          </Badge>
        </div>
      )}

      {monthRevenues.length > 0 && (
        <>
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Daily Revenue — {`${filterStart} to ${filterEnd}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={55}
                      tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6"
                      strokeWidth={2} dot={false} name="Revenue" />
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
                      <Pie data={typeData} cx="50%" cy="50%"
                        innerRadius={55} outerRadius={90}
                        paddingAngle={4} dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`}>
                        {typeData.map(e => (
                          <Cell key={e.name} fill={e.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-gray-400">
                    No data for selected month
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
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthCompare}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} width={60}
                    tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString("en-IN")}`} />
                  <Bar dataKey="revenue" fill="#3b82f6" name="Revenue"
                    radius={[4, 4, 0, 0]}
                    label={{ position: "top",
                      formatter: (v: any) => v > 0 ? `₹${(v/1000).toFixed(0)}K` : "",
                      fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Summary table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Revenue Summary — {`${filterStart} to ${filterEnd}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { label: "Total Revenue",        value: summary.totalRevenue,   color: "text-blue-700" },
                  { label: "Subscription Revenue", value: summary.subRevenue,     color: "text-green-700" },
                  { label: "One-time Revenue",      value: summary.onetimeRevenue, color: "text-amber-700" },
                  { label: "Total Expenses",        value: summary.totalExpenses,  color: "text-red-700" },
                  { label: "Net Profit",            value: summary.profit,         color: summary.profit >= 0 ? "text-green-700" : "text-red-700" },
                ].map(row => (
                  <div key={row.label}
                    className="flex justify-between items-center py-2 border-b last:border-0">
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
