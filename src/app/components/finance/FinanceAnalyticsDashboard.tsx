import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useCity } from "../../contexts/CityContext";
import { useGlobalFilters } from "../navigation/GlobalFilterBar";
import { useFinance } from "../../contexts/FinanceContext";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet,
  RefreshCcw, ArrowUpRight, ArrowDownRight, AlertCircle,
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

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

function KPICard({ title, value, sub, icon: Icon, color = "blue" }: any) {
  const bg: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-lg ${bg[color] || bg.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function readFromLocalStorage(city: string): { revs: any[]; pays: any[] } {
  try {
    const revRaw = localStorage.getItem("cleancar_revenues") ||
                   localStorage.getItem(`cleancar_${city}_revenues`);
    const revAll: any[] = revRaw ? JSON.parse(revRaw) : [];
    const revs = revAll.filter((r: any) => !r?.cityId || r.cityId === city);

    const payRaw = localStorage.getItem("cleancar_payables") ||
                   localStorage.getItem(`cleancar_${city}_payables`);
    const payAll: any[] = payRaw ? JSON.parse(payRaw) : [];
    const pays = payAll.filter((p: any) => !p?.cityId || p.cityId === city);

    return { revs, pays };
  } catch {
    return { revs: [], pays: [] };
  }
}

export function FinanceAnalyticsDashboard() {
  const { city, cityInfo } = useCity();
  const { getRevenueByCity, getPayablesByCity } = useFinance();
  const { filters } = useGlobalFilters();

  // Use GlobalFilterBar dates, but validate they cover seeded data range
  // If the filter dates are outside Jan-Apr 2026 (no data), auto-correct to full range
  const rawStart = filters?.startDate || "";
  const rawEnd   = filters?.endDate   || "";
  const DATA_START = "2026-01-01";
  const DATA_END   = "2026-04-30";

  // Auto-correct: if filter dates are empty OR outside data range, use full data range
  const filterStart = (rawStart && rawStart <= DATA_END && rawStart >= DATA_START)
    ? rawStart : DATA_START;
  const filterEnd = (rawEnd && rawEnd >= DATA_START && rawEnd <= DATA_END)
    ? rawEnd : DATA_END;

  const [revenues, setRevenues] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [src,      setSrc]      = useState("");

  const load = useCallback(() => {
    setLoading(true);

    // 1. Try FinanceContext (populated after Supabase load)
    const ctxRevs = getRevenueByCity(city) || [];
    const ctxPays = getPayablesByCity(city) || [];

    if (ctxRevs.length > 0) {
      setRevenues(ctxRevs);
      setPayables(ctxPays);
      setSrc(`context · ${ctxRevs.length} records`);
      setLoading(false);
      return;
    }

    // 2. Fallback: read directly from localStorage
    const { revs, pays } = readFromLocalStorage(city);
    setRevenues(revs);
    setPayables(pays);
    setSrc(revs.length > 0 ? `localStorage · ${revs.length} records` : "no data");
    setLoading(false);
  }, [city, getRevenueByCity, getPayablesByCity]);

  // Load on city change, re-try after 2s for late Supabase writes
  useEffect(() => {
    load();
    const t = setTimeout(load, 2500);
    return () => clearTimeout(t);
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filtered revenues for selected date range
  const filtered = useMemo(() =>
    revenues.filter((r: any) => {
      const d = r?.receivedDate || "";
      return d >= filterStart && d <= filterEnd;
    }),
    [revenues, filterStart, filterEnd]
  );

  // Previous period (same duration)
  const prevFiltered = useMemo(() => {
    const ms = new Date(filterEnd).getTime() - new Date(filterStart).getTime();
    const ps = new Date(new Date(filterStart).getTime() - ms).toISOString().split("T")[0];
    return revenues.filter((r: any) => {
      const d = r?.receivedDate || "";
      return d >= ps && d < filterStart;
    });
  }, [revenues, filterStart, filterEnd]);

  const summary = useMemo(() => {
    const total   = filtered.reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const prev    = prevFiltered.reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const sub     = filtered.filter((r: any) => r?.type === "Subscription")
                            .reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const exp     = payables.filter((p: any) => p?.status === "Paid")
                            .reduce((s: number, p: any) => s + (Number(p?.amount) || 0), 0);
    const allTime = revenues.reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0);
    const growth  = prev > 0 ? ((total - prev) / prev) * 100 : 0;
    const custs   = new Set(filtered.map((r: any) => r?.customerId).filter(Boolean)).size;
    return { total, sub, onetime: total - sub, exp, profit: total - exp, allTime, growth, custs };
  }, [filtered, prevFiltered, payables, revenues]);

  const trendData = useMemo(() => {
    const d: Record<string, number> = {};
    filtered.forEach((r: any) => {
      const k = r?.receivedDate?.slice(0, 10) || "";
      if (k) d[k] = (d[k] || 0) + (Number(r?.amount) || 0);
    });
    return Object.entries(d).sort(([a], [b]) => a.localeCompare(b)).map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      amount,
    }));
  }, [filtered]);

  const typeData = useMemo(() => {
    const t: Record<string, number> = {};
    filtered.forEach((r: any) => { const k = r?.type || "Other"; t[k] = (t[k] || 0) + (Number(r?.amount) || 0); });
    return Object.entries(t).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] })).filter(x => x.value > 0);
  }, [filtered]);

  const monthBars = useMemo(() =>
    MONTHS.slice().reverse().map(m => ({
      month: m.label.split(" ")[0],
      revenue: revenues.filter((r: any) => r?.receivedDate?.startsWith(m.value))
               .reduce((s: number, r: any) => s + (Number(r?.amount) || 0), 0),
    })),
    [revenues]
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">{cityInfo.displayName} · {src}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1">
            {filterStart} → {filterEnd}
          </span>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCcw className="w-3 h-3 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── No data warning ── */}
      {revenues.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">No revenue data for {cityInfo.displayName}</p>
            <p className="text-sm text-amber-600 mt-1">
              Click <strong>Refresh</strong> after the app finishes loading, or log out and back in.
            </p>
          </div>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard title="Total Revenue"        value={fmt(summary.total)}   sub={`${filtered.length} transactions`} icon={DollarSign}  color="blue"   />
        <KPICard title="Subscription Revenue" value={fmt(summary.sub)}     sub={`${Math.round(summary.total > 0 ? (summary.sub/summary.total)*100 : 0)}% of total`} icon={RefreshCcw} color="green"  />
        <KPICard title="Net Profit"           value={fmt(summary.profit)}  sub={summary.growth !== 0 ? `${summary.growth > 0 ? "+" : ""}${summary.growth.toFixed(1)}% vs prev period` : undefined} icon={summary.profit >= 0 ? TrendingUp : TrendingDown} color={summary.profit >= 0 ? "green" : "red"} />
        <KPICard title="Active Customers"     value={summary.custs.toString()} sub={`in selected range`} icon={Wallet} color="purple" />
      </div>

      {/* ── Summary badges ── */}
      {revenues.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge className="bg-blue-100 text-blue-800">All-time: {fmt(summary.allTime)}</Badge>
          <Badge className="bg-green-100 text-green-800">{revenues.length} total records</Badge>
          <Badge className="bg-purple-100 text-purple-800">{filtered.length} in range</Badge>
          {filtered.length === 0 && revenues.length > 0 && (
            <Badge className="bg-red-100 text-red-800">
              ⚠ No records in {filterStart} → {filterEnd} — change date range in top bar
            </Badge>
          )}
        </div>
      )}

      {/* ── Charts (only when filtered data exists) ── */}
      {filtered.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Daily Revenue Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={55} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: any) => fmt(Number(v))} />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Revenue by Type</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent*100).toFixed(0)}%`}>
                      {typeData.map(e => <Cell key={e.name} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => fmt(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Monthly Comparison (Jan–Apr 2026)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthBars}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} width={60} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Revenue Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-0">
                {[
                  { label: "Total Revenue",        v: summary.total,   c: "text-blue-700" },
                  { label: "Subscription",          v: summary.sub,     c: "text-green-700" },
                  { label: "One-time",              v: summary.onetime, c: "text-amber-700" },
                  { label: "Total Expenses (Paid)", v: summary.exp,     c: "text-red-600" },
                  { label: "Net Profit",            v: summary.profit,  c: summary.profit >= 0 ? "text-green-700" : "text-red-700" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center py-2.5 border-b last:border-0">
                    <span className="text-sm text-gray-600">{row.label}</span>
                    <span className={`font-semibold text-sm ${row.c}`}>{fmt(row.v)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── No data in range but data exists ── */}
      {filtered.length === 0 && revenues.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 font-medium">No transactions in selected date range</p>
            <p className="text-sm text-gray-400 mt-1">
              Data exists for: {[...new Set(revenues.map((r:any) => r?.receivedDate?.slice(0,7)).filter(Boolean))].sort().reverse().join(", ")}
            </p>
            <p className="text-sm text-blue-600 mt-2">
              Use the <strong>From / To</strong> filters in the top bar to select Jan–Apr 2026
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
