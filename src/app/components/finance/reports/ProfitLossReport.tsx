/**
 * Profit & Loss Report - Ledger-driven P&L statement
 *
 * Data Source: ledger_entries table ONLY
 *
 * Logic:
 * - Revenue = SUM(credit) WHERE account IN (4000-4999) [Revenue accounts]
 * - Expenses = SUM(debit) WHERE account IN (5000-5999) [Expense accounts]
 * - Net Profit = Revenue - Expenses
 *
 * Breakdown by:
 * - Account category (Revenue type, Expense type)
 * - Time period (monthly trend)
 * - City (if filtered)
 *
 * @component
 */

import { useState, useEffect } from "react";
import { formatCurrency } from "../../../lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { ReportFilters } from "../FinancialReportsModule";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PLCategory {
  category: string;
  account: string;
  amount: number;
  percentage: number;
}

interface PLSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

// ============================================================================
// MOCK DATA (will be replaced with API calls to ledger)
// ============================================================================

const mockRevenue: PLCategory[] = [
  { category: "Subscription Revenue", account: "4100", amount: 2850000, percentage: 65.5 },
  { category: "On-Demand Revenue", account: "4200", amount: 980000, percentage: 22.5 },
  { category: "Deep Clean Revenue", account: "4300", amount: 520000, percentage: 12.0 },
];

const mockExpenses: PLCategory[] = [
  { category: "Salaries & Wages", account: "5100", amount: 1625000, percentage: 45.2 },
  { category: "Employer Contributions", account: "5120", amount: 285000, percentage: 7.9 },
  { category: "Materials & Supplies", account: "5200", amount: 450000, percentage: 12.5 },
  { category: "Vehicle Expenses", account: "5300", amount: 320000, percentage: 8.9 },
  { category: "Rent & Utilities", account: "5400", amount: 280000, percentage: 7.8 },
  { category: "Marketing", account: "5500", amount: 380000, percentage: 10.6 },
  { category: "Other Expenses", account: "5900", amount: 255000, percentage: 7.1 },
];

const mockMonthlyTrend: MonthlyTrend[] = [
  { month: "Jan", revenue: 3200000, expenses: 3100000, profit: 100000 },
  { month: "Feb", revenue: 3400000, expenses: 3150000, profit: 250000 },
  { month: "Mar", revenue: 3650000, expenses: 3280000, profit: 370000 },
  { month: "Apr", revenue: 4350000, expenses: 3595000, profit: 755000 },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ProfitLossReportProps {
  filters: ReportFilters;
}

export function ProfitLossReport({ filters }: ProfitLossReportProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [revenue, setRevenue] = useState<PLCategory[]>(mockRevenue);
  const [expenses, setExpenses] = useState<PLCategory[]>(mockExpenses);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>(mockMonthlyTrend);

  useEffect(() => {
    loadPLData();
  }, [filters]);

  async function loadPLData() {
    setIsLoading(true);
    try {
      // In production: Query ledger_entries table
      /*
      const plData = await financeEngine.getProfitLoss({
        city: filters.city,
        startDate: filters.startDate,
        endDate: filters.endDate,
        serviceType: filters.serviceType
      });

      // SQL Query example:
      // SELECT
      //   account_category,
      //   account_code,
      //   SUM(CASE WHEN entry_type = 'CREDIT' THEN amount ELSE 0 END) as revenue,
      //   SUM(CASE WHEN entry_type = 'DEBIT' THEN amount ELSE 0 END) as expenses
      // FROM ledger_entries
      // WHERE
      //   posting_date BETWEEN ? AND ?
      //   AND (city = ? OR ? = 'ALL')
      //   AND account_code BETWEEN '4000' AND '5999'
      // GROUP BY account_category, account_code
      */

      await new Promise((resolve) => setTimeout(resolve, 800));

      setRevenue(mockRevenue);
      setExpenses(mockExpenses);
      setMonthlyTrend(mockMonthlyTrend);
    } catch (error) {
      console.error("Failed to load P&L data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const summary: PLSummary = {
    totalRevenue: revenue.reduce((sum, item) => sum + item.amount, 0),
    totalExpenses: expenses.reduce((sum, item) => sum + item.amount, 0),
    netProfit: 0,
    profitMargin: 0,
  };

  summary.netProfit = summary.totalRevenue - summary.totalExpenses;
  summary.profitMargin = (summary.netProfit / summary.totalRevenue) * 100;

  const isProfitable = summary.netProfit > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading P&L data from ledger...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(summary.totalRevenue)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(summary.totalExpenses)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${isProfitable ? 'border-blue-300 bg-blue-50' : 'border-orange-300 bg-orange-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${isProfitable ? 'text-blue-700' : 'text-orange-700'}`}>
                  {formatCurrency(summary.netProfit)}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${isProfitable ? 'text-blue-600' : 'text-orange-600'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-300 bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-purple-700">
                  {summary.profitMargin.toFixed(1)}%
                </p>
              </div>
              <Badge className={`${isProfitable ? 'bg-green-600' : 'bg-red-600'}`}>
                {isProfitable ? 'Profitable' : 'Loss'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenue.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-sm text-gray-500">{item.account}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {item.percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-green-50 font-bold">
                  <TableCell colSpan={2}>Total Revenue</TableCell>
                  <TableCell className="text-right text-green-700">
                    {formatCurrency(summary.totalRevenue)}
                  </TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-sm text-gray-500">{item.account}</TableCell>
                    <TableCell className="text-right font-semibold text-red-600">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {item.percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-red-50 font-bold">
                  <TableCell colSpan={2}>Total Expenses</TableCell>
                  <TableCell className="text-right text-red-700">
                    {formatCurrency(summary.totalExpenses)}
                  </TableCell>
                  <TableCell className="text-right">100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Query Info */}
      <Card className="border-blue-300 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Data Source: ledger_entries table</p>
              <p className="mt-1">
                Revenue = SUM(credit_amount) WHERE account_code IN (4000-4999)<br />
                Expenses = SUM(debit_amount) WHERE account_code IN (5000-5999)<br />
                Net Profit = Revenue - Expenses
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
