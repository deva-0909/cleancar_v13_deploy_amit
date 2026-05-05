/**
 * Finance Analytics Dashboard - Ledger-Driven Architecture
 *
 * PRINCIPLES:
 * - Zero UI calculations
 * - All data from financeEngine API
 * - Ledger-driven (not operational tables)
 * - Generic transaction model
 * - Multi-city scalable
 *
 * @component
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useCity } from "../../contexts/CityContext";
import { useFinance } from "../../contexts/FinanceContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Filter,
  Calendar,
  MapPin,
  RefreshCcw,
  AlertCircle,
  Loader2,
  FileX,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";

// ============================================================================
// DATA CONTRACTS - Strict API Response Structures
// ============================================================================

/**
 * Finance Summary Response
 * Endpoint: GET /api/finance/summary?city=...&dateRange=...&serviceType=...
 */
interface FinanceSummaryResponse {
  revenue: {
    total: number;
    percentChange: number; // vs previous period
    previousPeriodTotal: number;
  };
  expenses: {
    total: number;
    percentChange: number;
    previousPeriodTotal: number;
  };
  profit: {
    total: number;
    percentChange: number;
    previousPeriodTotal: number;
  };
  cashBalance: {
    total: number;
    percentChange: number;
    previousPeriodTotal: number;
  };
  trends: TrendDataPoint[];
  cityBreakdown: CityBreakdownItem[];
  revenueSplit: RevenueSplitItem[];
}

interface TrendDataPoint {
  date: string; // "2026-04-01"
  revenue: number;
  expenses: number;
}

interface CityBreakdownItem {
  city: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface RevenueSplitItem {
  category: string; // "Services", "Subscriptions", "Add-ons"
  amount: number;
  percentage: number; // Pre-calculated by backend
}

/**
 * Finance Transactions Response
 * Endpoint: GET /api/finance/transactions?city=...&type=...&dateRange=...
 */
interface FinanceTransaction {
  id: string;
  date: string; // "2026-04-20"
  type: "REVENUE" | "EXPENSE" | "PAYROLL" | "REFUND";
  referenceId: string; // Link to source (UNIT-001, PAYROLL-FEB-2026, etc.)
  description: string;
  amount: number;
  city: string;
  cluster?: string;
  sourceEngine: string; // "operationsEngine", "payrollEngine", etc.
}

interface TransactionsResponse {
  transactions: FinanceTransaction[];
  total: number;
  pageInfo: {
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ============================================================================
// FILTER STATE
// ============================================================================

interface DashboardFilters {
  cities: string[]; // Multi-select
  dateRange: string; // "last7days" | "last30days" | "thisMonth" | "lastMonth" | "custom"
  serviceType: string; // "all" | "services" | "subscriptions" | "addons"
  customDateStart?: string;
  customDateEnd?: string;
}

const DEFAULT_FILTERS: DashboardFilters = {
  cities: [], // Empty = all cities
  dateRange: "last30days",
  serviceType: "all",
};

// ============================================================================
// MOCK API RESPONSES (Replace with real API calls)
// ============================================================================

// In production: Replace with actual API calls
const getMockFinanceSummary = (cityName: string): FinanceSummaryResponse => ({
  revenue: {
    total: 485000,
    percentChange: 12.5,
    previousPeriodTotal: 431555,
  },
  expenses: {
    total: 325000,
    percentChange: -3.2,
    previousPeriodTotal: 335732,
  },
  profit: {
    total: 160000,
    percentChange: 45.8,
    previousPeriodTotal: 109734,
  },
  cashBalance: {
    total: 1250000,
    percentChange: 8.3,
    previousPeriodTotal: 1154238,
  },
  trends: [
    { date: "2026-04-14", revenue: 65000, expenses: 45000 },
    { date: "2026-04-15", revenue: 72000, expenses: 48000 },
    { date: "2026-04-16", revenue: 68000, expenses: 46000 },
    { date: "2026-04-17", revenue: 75000, expenses: 52000 },
    { date: "2026-04-18", revenue: 70000, expenses: 49000 },
    { date: "2026-04-19", revenue: 68000, expenses: 43000 },
    { date: "2026-04-20", revenue: 67000, expenses: 42000 },
  ],
  cityBreakdown: [
    { city: "Surat",     revenue: 285000, expenses: 185000, profit: 100000 },
    { city: "Mumbai",    revenue: 320000, expenses: 210000, profit: 110000 },
    { city: "Ahmedabad", revenue: 255000, expenses: 168000, profit: 87000  },
  ],
  revenueSplit: [
    { category: "Services", amount: 285000, percentage: 58.8 },
    { category: "Subscriptions", amount: 150000, percentage: 30.9 },
    { category: "Add-ons", amount: 50000, percentage: 10.3 },
  ],
});


// ============================================================================
// API FUNCTIONS (Replace with real implementations)
// ============================================================================

async function fetchTransactions(
  filters: DashboardFilters,
  cityName: string,
  transactionType?: string
): Promise<TransactionsResponse> {
  // Mock delay
  await new Promise(resolve => setTimeout(resolve, 600));

  // Return empty for now - transaction drill-down can be implemented later
  return {
    transactions: [],
    total: 0,
    pageInfo: {
      page: 1,
      pageSize: 50,
      totalPages: 1,
    },
  };
}

// ============================================================================
// KPI CARD COMPONENT
// ============================================================================

interface KPICardProps {
  title: string;
  value: number;
  percentChange: number;
  icon: React.ElementType;
  onClick: () => void;
  isLoading: boolean;
}

function KPICard({ title, value, percentChange, icon: Icon, onClick, isLoading }: KPICardProps) {
  const isPositive = percentChange > 0;
  const isNegative = percentChange < 0;

  if (isLoading) {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              ₹{value.toLocaleString("en-IN")}
            </h3>
            <div className="flex items-center gap-1">
              {isPositive && <ArrowUpRight className="w-4 h-4 text-green-600" />}
              {isNegative && <ArrowDownRight className="w-4 h-4 text-red-600" />}
              {percentChange === 0 && <div className="w-4 h-4" />}
              <span className={`text-sm font-medium ${
                isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-gray-600"
              }`}>
                {percentChange > 0 ? "+" : ""}{percentChange.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500">vs prev</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FinanceAnalyticsDashboard() {
  const { city, cityInfo } = useCity();
  const { getRevenueByCity, getPayablesByCity, getMRRByCity,
          calculateEBITDA, getActiveAlerts, getTotalMRR } = useFinance();
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drilldown drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"revenue" | "expenses" | "profit" | "cash" | null>(null);
  const [drawerTransactions, setDrawerTransactions] = useState<FinanceTransaction[]>([]);
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [drawerFilter, setDrawerFilter] = useState<string>("all");

  // Cities for multi-select (in production: fetch from API)
  const availableCities = ["Surat", "Mumbai", "Ahmedabad"];

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Calculate live data from FinanceContext
  const summary = useMemo(() => {
    const cityRevenues  = getRevenueByCity(city).filter(r => r.status === "Received" && r.receivedDate.startsWith(currentMonth));
    const cityPayables  = getPayablesByCity(city);
    const totalRevenue  = cityRevenues.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = cityPayables.filter(p => p.status === "Paid" && p.paidAt?.startsWith(currentMonth)).reduce((s, p) => s + p.amount, 0);
    const ebitda        = calculateEBITDA(city, currentMonth);
    const mrr           = getTotalMRR(currentMonth, city);
    const activeAlerts  = getActiveAlerts(city);
    const overdueCount  = cityPayables.filter(p => p.status === "Overdue").length;

    return {
      revenue: {
        total: totalRevenue,
        percentChange: 0, // TODO: Calculate vs previous month
        previousPeriodTotal: 0,
      },
      expenses: {
        total: totalExpenses,
        percentChange: 0,
        previousPeriodTotal: 0,
      },
      profit: {
        total: ebitda,
        percentChange: 0,
        previousPeriodTotal: 0,
      },
      cashBalance: {
        total: mrr,
        percentChange: 0,
        previousPeriodTotal: 0,
      },
      alerts: activeAlerts.length,
      overduePayables: overdueCount,
      dailyTrend: [],
      cityBreakdown: [],
      revenueSplit: [],
    };
  }, [city, currentMonth, getRevenueByCity, getPayablesByCity, calculateEBITDA, getTotalMRR, getActiveAlerts]);

  // Load dashboard data
  useEffect(() => {
    setIsLoading(true);
    // Simulate loading delay for UX
    setTimeout(() => setIsLoading(false), 300);
  }, [filters]);

  // Handle KPI card click
  const handleKPIClick = async (type: "revenue" | "expenses" | "profit" | "cash") => {
    setDrawerType(type);
    setIsDrawerOpen(true);
    setIsDrawerLoading(true);
    setDrawerFilter("all");

    try {
      // Determine transaction type filter based on KPI
      let transactionTypeFilter: string | undefined = undefined;
      if (type === "revenue") {
        transactionTypeFilter = "REVENUE";
      } else if (type === "expenses") {
        transactionTypeFilter = "EXPENSE";
      }

      const data = await fetchTransactions(filters, cityInfo.displayName, transactionTypeFilter);
      setDrawerTransactions(data.transactions);
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setDrawerTransactions([]);
    } finally {
      setIsDrawerLoading(false);
    }
  };

  // Handle drawer filter change
  const handleDrawerFilterChange = async (filterValue: string) => {
    setDrawerFilter(filterValue);
    setIsDrawerLoading(true);

    try {
      const data = await fetchTransactions(
        filters,
        cityInfo.displayName,
        filterValue === "all" ? undefined : filterValue
      );
      setDrawerTransactions(data.transactions);
    } catch (err) {
      console.error("Failed to load filtered transactions:", err);
    } finally {
      setIsDrawerLoading(false);
    }
  };

  // Get transaction type badge color
  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case "REVENUE":
        return "bg-green-100 text-green-700 border-green-200";
      case "EXPENSE":
        return "bg-red-100 text-red-700 border-red-200";
      case "PAYROLL":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "REFUND":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  // Chart colors
  const CHART_COLORS = {
    revenue: "#10b981",
    expenses: "#ef4444",
    profit: "#3b82f6",
    services: "#3b82f6",
    subscriptions: "#10b981",
    addons: "#f59e0b",
  };

  // Error state
  if (error && !isLoading) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertTitle className="text-red-900">Error Loading Dashboard</AlertTitle>
          <AlertDescription className="text-red-700">
            {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={loadDashboardData}
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (!isLoading && summary && summary.revenue.total === 0 && summary.expenses.total === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <FileX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Financial Data</h3>
            <p className="text-sm text-gray-500 mb-4">
              No transactions found for the selected filters.
            </p>
            <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
              Reset Filters
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Analytics Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Ledger-driven financial insights and performance metrics
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
          <Database className="w-4 h-4 text-blue-600" />
          <span className="text-sm">financeEngine</span>
        </Badge>
      </div>

      {/* Engine Label */}
      <Alert className="border-blue-200 bg-blue-50">
        <Database className="w-4 h-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Data Source: financeEngine</AlertTitle>
        <AlertDescription className="text-blue-700 text-sm">
          All metrics and calculations are performed by <strong>financeEngine</strong> based on
          ledger entries. This dashboard performs ZERO calculations - all data is pre-calculated
          by the backend.
        </AlertDescription>
      </Alert>

      {/* Global Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            {/* City Multi-Select */}
            <Select
              value={filters.cities.length > 0 ? filters.cities[0] : "all"}
              onValueChange={(value) => {
                setFilters({
                  ...filters,
                  cities: value === "all" ? [] : [value],
                });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Select
              value={filters.dateRange}
              onValueChange={(value) => {
                setFilters({ ...filters, dateRange: value });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last7days">Last 7 Days</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="thisMonth">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>

            {/* Service Type */}
            <Select
              value={filters.serviceType}
              onValueChange={(value) => {
                setFilters({ ...filters, serviceType: value });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Service Types</SelectItem>
                <SelectItem value="services">Services Only</SelectItem>
                <SelectItem value="subscriptions">Subscriptions Only</SelectItem>
                <SelectItem value="addons">Add-ons Only</SelectItem>
              </SelectContent>
            </Select>

            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Total Revenue"
          value={summary?.revenue.total || 0}
          percentChange={summary?.revenue.percentChange || 0}
          icon={DollarSign}
          onClick={() => handleKPIClick("revenue")}
          isLoading={isLoading}
        />
        <KPICard
          title="Total Expenses"
          value={summary?.expenses.total || 0}
          percentChange={summary?.expenses.percentChange || 0}
          icon={TrendingDown}
          onClick={() => handleKPIClick("expenses")}
          isLoading={isLoading}
        />
        <KPICard
          title="Net Profit"
          value={summary?.profit.total || 0}
          percentChange={summary?.profit.percentChange || 0}
          icon={TrendingUp}
          onClick={() => handleKPIClick("profit")}
          isLoading={isLoading}
        />
        <KPICard
          title="Cash Balance"
          value={summary?.cashBalance.total || 0}
          percentChange={summary?.cashBalance.percentChange || 0}
          icon={Wallet}
          onClick={() => handleKPIClick("cash")}
          isLoading={isLoading}
        />
      </div>

      {/* Revenue vs Expense Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue vs Expense Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300} key="trend-chart-container">
              <LineChart data={summary?.trends || []} key="trend-linechart">
                <CartesianGrid strokeDasharray="3 3" key="trend-grid" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} key="trend-xaxis" />
                <YAxis key="trend-yaxis" tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip key="trend-tooltip" />
                <Legend key="trend-legend" />
                <Line
                  key="trend-line-revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.revenue}
                  strokeWidth={2}
                  name="Revenue"
                />
                <Line
                  key="trend-line-expenses"
                  type="monotone"
                  dataKey="expenses"
                  stroke={CHART_COLORS.expenses}
                  strokeWidth={2}
                  name="Expenses"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* City-wise Revenue & Revenue Split */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* City-wise Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>City-wise Revenue Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280} key="city-chart-container">
                <BarChart data={summary?.cityBreakdown || []} key="city-barchart">
                  <CartesianGrid strokeDasharray="3 3" key="city-grid" />
                  <XAxis dataKey="city" tick={{ fontSize: 11 }} key="city-xaxis" />
                  <YAxis key="city-yaxis" tick={{ fontSize: 11 }} width={50} />
                  <RechartsTooltip key="city-tooltip" />
                  <Legend key="city-legend" />
                  <Bar key="city-bar-revenue" dataKey="revenue" fill={CHART_COLORS.revenue} name="Revenue" />
                  <Bar key="city-bar-expenses" dataKey="expenses" fill={CHART_COLORS.expenses} name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue Split */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Split</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280} key="split-chart-container">
                <PieChart key="split-piechart">
                  <Pie
                    key="split-pie"
                    data={summary?.revenueSplit || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="amount"
                    label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
                  >
                    {(summary?.revenueSplit || []).map((entry) => (
                      <Cell
                        key={`cell-${entry.category}`}
                        fill={
                          entry.category === "Services"
                            ? CHART_COLORS.services
                            : entry.category === "Subscriptions"
                            ? CHART_COLORS.subscriptions
                            : CHART_COLORS.addons
                        }
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip key="split-tooltip" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drilldown Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:w-[600px] sm:w-[800px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {drawerType === "revenue" && "Revenue Transactions"}
              {drawerType === "expenses" && "Expense Transactions"}
              {drawerType === "profit" && "Profit Analysis"}
              {drawerType === "cash" && "Cash Flow Transactions"}
            </SheetTitle>
            <SheetDescription>
              Detailed transaction breakdown from ledger entries
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Drawer Filter */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="text-sm font-medium text-gray-700">Filter:</span>
              <Select value={drawerFilter} onValueChange={handleDrawerFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="REVENUE">Revenue Only</SelectItem>
                  <SelectItem value="EXPENSE">Expense Only</SelectItem>
                  <SelectItem value="PAYROLL">Payroll Only</SelectItem>
                  <SelectItem value="REFUND">Refund Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Table */}
            {isDrawerLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : drawerTransactions.length === 0 ? (
              <div className="text-center py-12">
                <FileX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No transactions found</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reference ID</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drawerTransactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{txn.date}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTransactionTypeBadge(txn.type)}>
                            {txn.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{txn.description}</p>
                            <p className="text-xs text-gray-500">{txn.sourceEngine}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{txn.referenceId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{txn.city}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-mono font-semibold ${
                              txn.type === "REVENUE"
                                ? "text-green-600"
                                : txn.type === "REFUND"
                                ? "text-orange-600"
                                : "text-red-600"
                            }`}
                          >
                            {txn.type === "REVENUE" ? "+" : "-"}₹
                            {txn.amount.toLocaleString("en-IN")}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
