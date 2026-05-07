/**
 * Finance Analytics Dashboard
 * Reads DIRECTLY from localStorage — no context dependency
 * This guarantees data shows even if FinanceContext is empty
 */
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useCity } from "../../contexts/CityContext";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet,
  RefreshCcw, ArrowUpRight, ArrowDownRight, AlertCircle,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
const DATA_START = "2026-01-01";
const DATA_END   = "2026-04-30";
const MONTHS = [
  { v: "2026-01", l: "January" },
  { v: "2026-02", l: "February" },
  { v: "2026-03", l: "March" },
  { v: "2026-04", l: "April" },
];

function fmt(n: number) { return `₹${Math.round(n).toLocaleString("en-IN")}`; }

function KPI({ title, value, sub, icon: Icon, color = "blue" }: any) {
  const bg: any = { blue:"bg-blue-50 text-blue-600", green:"bg-green-50 text-green-600", red:"bg-red-50 text-red-600", purple:"bg-purple-50 text-purple-600" };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${bg[color]||bg.blue}`}><Icon className="w-5 h-5" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

// Read all revenues for a city directly from localStorage — no context needed
function loadRevenues(city: string): any[] {
  const keys = [
    `cleancar_${city}_revenues`,
    "cleancar_revenues",
    `cleancar_CITY-SURAT_revenues`,
  ];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const all = JSON.parse(raw);
      if (!Array.isArray(all) || all.length === 0) continue;
      // Filter to city
      const filtered = all.filter((r: any) => !r?.cityId || r.cityId === city);
      if (filtered.length > 0) return filtered;
      // If all records have no cityId, return all
      if (all.every((r: any) => !r?.cityId)) return all;
    } catch { continue; }
  }
  return [];
}

function loadPayables(city: string): any[] {
  const keys = [`cleancar_${city}_payables`, "cleancar_payables"];
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const all = JSON.parse(raw);
      if (!Array.isArray(all) || all.length === 0) continue;
      return all.filter((p: any) => !p?.cityId || p.cityId === city);
    } catch { continue; }
  }
  return [];
}

export function FinanceAnalyticsDashboard() {
  const { city, cityInfo } = useCity();

  const [allRevs,  setAllRevs]  = useState<any[]>([]);
  const [allPays,  setAllPays]  = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [fromDate, setFromDate] = useState(DATA_START);
  const [toDate,   setToDate]   = useState(DATA_END);
  const [tick,     setTick]     = useState(0);

  const doLoad = () => {
    setLoading(true);
    const revs = loadRevenues(city);
    const pays = loadPayables(city);
    setAllRevs(revs);
    setAllPays(pays);
    setLoading(false);
  };

  // Load on mount + city change, retry at 2s and 4s for slow Supabase
  useEffect(() => {
    doLoad();
    const t1 = setTimeout(doLoad, 2000);
    const t2 = setTimeout(doLoad, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [city, tick]); // eslint-disable-line

  // Filtered revenues
  const revs = useMemo(() =>
    allRevs.filter((r: any) => {
      const d = r?.receivedDate?.slice(0,10) || "";
      return d >= fromDate && d <= toDate;
    }),
    [allRevs, fromDate, toDate]
  );

  // KPIs
  const total    = revs.reduce((s: number, r: any) => s + (Number(r?.amount)||0), 0);
  const sub      = revs.filter((r: any) => r?.type === "Subscription").reduce((s: number, r: any) => s + (Number(r?.amount)||0), 0);
  const exp      = allPays.filter((p: any) => p?.status === "Paid").reduce((s: number, p: any) => s + (Number(p?.amount)||0), 0);
  const profit   = total - exp;
  const custs    = new Set(revs.map((r: any) => r?.customerId).filter(Boolean)).size;
  const allTotal = allRevs.reduce((s: number, r: any) => s + (Number(r?.amount)||0), 0);

  // Daily trend
  const trend = useMemo(() => {
    const d: Record<string,number> = {};
    revs.forEach((r: any) => {
      const k = r?.receivedDate?.slice(0,10)||"";
      if (k) d[k] = (d[k]||0) + (Number(r?.amount)||0);
    });
    return Object.entries(d).sort(([a],[b])=>a.localeCompare(b)).map(([date,amount]) => ({
      date: new Date(date).toLocaleDateString("en-IN",{day:"numeric",month:"short"}),
      amount,
    }));
  }, [revs]);

  // By type
  const byType = useMemo(() => {
    const t: Record<string,number> = {};
    revs.forEach((r: any) => { const k=r?.type||"Other"; t[k]=(t[k]||0)+(Number(r?.amount)||0); });
    return Object.entries(t).map(([name,value],i)=>({name,value,color:COLORS[i%COLORS.length]})).filter(x=>x.value>0);
  }, [revs]);

  // Monthly bars (always show all 4 months)
  const monthBars = MONTHS.map(m => ({
    month: m.l,
    revenue: allRevs.filter((r:any)=>r?.receivedDate?.startsWith(m.v)).reduce((s:number,r:any)=>s+(Number(r?.amount)||0),0),
  }));

  // Available date range in data
  const dataDates = allRevs.map((r:any)=>r?.receivedDate?.slice(0,10)||"").filter(Boolean).sort();
  const dataMin = dataDates[0] || DATA_START;
  const dataMax = dataDates[dataDates.length-1] || DATA_END;

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 text-sm">Loading financial data...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {cityInfo.displayName} · {allRevs.length} records loaded
            {allRevs.length > 0 && ` · Data: ${dataMin} to ${dataMax}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={()=>setTick(t=>t+1)}>
          <RefreshCcw className="w-3 h-3 mr-1"/> Refresh
        </Button>
      </div>

      {/* Date range filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Date Range:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">From</span>
              <input type="date" value={fromDate} min={DATA_START} max={DATA_END}
                onChange={e => setFromDate(e.target.value || DATA_START)}
                className="border rounded px-2 py-1 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">To</span>
              <input type="date" value={toDate} min={DATA_START} max={DATA_END}
                onChange={e => setToDate(e.target.value || DATA_END)}
                className="border rounded px-2 py-1 text-sm" />
            </div>
            <Button size="sm" variant="outline"
              onClick={()=>{ setFromDate(DATA_START); setToDate(DATA_END); }}>
              Reset (Jan–Apr 2026)
            </Button>
            <Badge className="bg-blue-100 text-blue-700">{revs.length} records in range</Badge>
          </div>
        </CardContent>
      </Card>

      {/* No data warning */}
      {allRevs.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="font-medium text-amber-800">No revenue data for {cityInfo.displayName}</p>
            <p className="text-sm text-amber-600 mt-1">Click Refresh — data loads from Supabase on login.</p>
          </div>
        </div>
      )}

      {/* KPIs */}
      {allRevs.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI title="Total Revenue"        value={fmt(total)}  sub={`${revs.length} transactions`} icon={DollarSign} color="blue"/>
          <KPI title="Subscription Revenue" value={fmt(sub)}    sub={`${total>0?Math.round(sub/total*100):0}% of total`} icon={RefreshCcw} color="green"/>
          <KPI title="Net Profit"           value={fmt(profit)} sub={exp>0?`Expenses: ${fmt(exp)}`:undefined} icon={profit>=0?TrendingUp:TrendingDown} color={profit>=0?"green":"red"}/>
          <KPI title="Unique Customers"     value={custs.toString()} sub="in selected range" icon={Wallet} color="purple"/>
        </div>
      )}

      {/* Summary badges */}
      {allRevs.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge className="bg-blue-100 text-blue-800">All-time: {fmt(allTotal)}</Badge>
          <Badge className="bg-green-100 text-green-800">{allRevs.length} total records</Badge>
          {revs.length === 0 && allRevs.length > 0 && (
            <Badge className="bg-red-100 text-red-800">
              ⚠ No records in {fromDate} → {toDate} — click Reset to see all data
            </Badge>
          )}
        </div>
      )}

      {/* Charts */}
      {revs.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Daily Revenue Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="date" tick={{fontSize:10}}/>
                    <YAxis tick={{fontSize:10}} width={55} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
                    <Tooltip formatter={(v:any)=>fmt(Number(v))}/>
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} dot={false}/>
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Revenue by Type</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={byType} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                      paddingAngle={4} dataKey="value"
                      label={({name,percent})=>`${name}: ${(percent*100).toFixed(0)}%`}>
                      {byType.map(e=><Cell key={e.name} fill={e.color}/>)}
                    </Pie>
                    <Tooltip formatter={(v:any)=>fmt(Number(v))}/>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Monthly Revenue — Jan to Apr 2026</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthBars}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="month" tick={{fontSize:12}}/>
                  <YAxis tick={{fontSize:11}} width={60} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`}/>
                  <Tooltip formatter={(v:any)=>fmt(Number(v))}/>
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Summary table */}
      {revs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Revenue Summary — {fromDate} to {toDate}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-0">
              {[
                {l:"Total Revenue",        v:total,        c:"text-blue-700"},
                {l:"Subscription",          v:sub,          c:"text-green-700"},
                {l:"One-time",              v:total-sub,    c:"text-amber-700"},
                {l:"Total Expenses (Paid)", v:exp,          c:"text-red-600"},
                {l:"Net Profit",            v:profit,       c:profit>=0?"text-green-700":"text-red-700"},
              ].map(row=>(
                <div key={row.l} className="flex justify-between items-center py-2.5 border-b last:border-0">
                  <span className="text-sm text-gray-600">{row.l}</span>
                  <span className={`font-semibold text-sm ${row.c}`}>{fmt(row.v)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No data in range message */}
      {revs.length === 0 && allRevs.length > 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-600 font-medium">No transactions in {fromDate} → {toDate}</p>
            <p className="text-sm text-gray-400 mt-2">
              Available: {[...new Set(allRevs.map((r:any)=>r?.receivedDate?.slice(0,7)||"").filter(Boolean))].sort().join(", ")}
            </p>
            <Button className="mt-4" variant="outline"
              onClick={()=>{ setFromDate(DATA_START); setToDate(DATA_END); }}>
              Show All Data (Jan–Apr 2026)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
