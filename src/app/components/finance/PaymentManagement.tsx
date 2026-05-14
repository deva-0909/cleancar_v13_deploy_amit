import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/formatters";
import {
  DollarSign,
  Calendar,
  AlertCircle,
  RefreshCw,
  Filter,
  Download,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BackButton } from "../ui/back-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService } from "../../services/accountingEntryService";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  paymentDate: string;
  paymentMode: string;
  paymentReference: string;
  amount: number;
  city?: string;
  cluster?: string;
  createdAt: string;
  createdBy: string;
  paymentTransactionId?: string;
}

interface PaymentFilters {
  city: string;
  paymentMode: string;
  dateRange: string;
  searchQuery: string;
}

interface PaymentListResponse {
  payments: Payment[];
  totalCount: number;
  totalAmount: number;
  page: number;
  pageSize: number;
}

interface PaymentSummary {
  totalPayments: number;
  totalAmount: number;
  byMode: {
    mode: string;
    count: number;
    amount: number;
  }[];
}

// ============================================================================
// MOCK DATA
// ============================================================================

// ✅ FIXED: Removed hardcoded mockPayments — real payments come from FinanceContext
const mockPayments: Payment[] = []; // empty — no fake data

const mockSummary: PaymentSummary = {
  totalPayments: 4,
  totalAmount: 18676.0,
  byMode: [
    { mode: "UPI", count: 1, amount: 3576.0 },
    { mode: "CASH", count: 1, amount: 1000.0 },
    { mode: "CARD", count: 1, amount: 5200.0 },
    { mode: "BANK_TRANSFER", count: 1, amount: 8900.0 },
  ],
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchPayments(
  filters: PaymentFilters,
  cityId: string
): Promise<PaymentListResponse> {
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Pull real payment journals: receipts posted as DR Bank/Cash, CR Accounts Receivable
  const allJournals = accountingEntryService.getAllJournals(cityId);
  const allLedgers  = accountingEntryService.getLedgers(cityId);

  const arLedger   = allLedgers.find(l => l.name === "Accounts Receivable");
  const bankLedger = allLedgers.find(l => l.name === "Axis Bank" && l.type === "bank");
  const cashLedger = allLedgers.find(l => l.name === "Petty Cash");

  const paymentJournals = allJournals.filter(jv => {
    if (jv.status !== "Posted") return false;
    const hasARCredit = jv.lines.some(
      l => arLedger && l.accountHead === arLedger.id && l.credit > 0
    );
    return hasARCredit;
  });

  let livePayments: Payment[] = paymentJournals.map((jv, idx) => {
    const bankLine = jv.lines.find(
      l => (bankLedger && l.accountHead === bankLedger.id) ||
           (cashLedger && l.accountHead === cashLedger.id)
    );
    const mode = bankLine && cashLedger && bankLine.accountHead === cashLedger.id
      ? "CASH" : "BANK_TRANSFER";
    const amount = Math.max(...jv.lines.map(l => l.debit));
    const invoiceMatch = jv.narration.match(/Invoice (INV-[\w-]+)/i);
    const customerMatch = jv.narration.match(/from (.+?) —/i);

    return {
      id: jv.id,
      paymentNumber: `PAY-${String(idx + 1).padStart(4, "0")}`,
      invoiceId: invoiceMatch?.[1] || "",
      invoiceNumber: invoiceMatch?.[1] || "—",
      customerName: customerMatch?.[1] || "—",
      paymentDate: jv.date,
      paymentMode: mode,
      paymentReference: jv.voucherNumber,
      amount,
      status: "COMPLETED" as const,
      city: jv.cityId,
      createdAt: jv.createdAt,
    };
  });

  if (filters.city !== "all") {
    livePayments = livePayments.filter(p => p.city === filters.city);
  }
  if (filters.paymentMode !== "all") {
    livePayments = livePayments.filter(p => p.paymentMode === filters.paymentMode);
  }
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    livePayments = livePayments.filter(
      p => p.paymentNumber.toLowerCase().includes(q) ||
           p.invoiceNumber.toLowerCase().includes(q) ||
           p.customerName.toLowerCase().includes(q)
    );
  }

  const totalAmount = livePayments.reduce((s, p) => s + p.amount, 0);
  return { payments: livePayments, totalCount: livePayments.length, totalAmount, page: 1, pageSize: 100 };
}

async function fetchPaymentSummary(
  filters: PaymentFilters
): Promise<PaymentSummary> {
  // In production: Replace with real API call
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockSummary;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaymentModeBadge(mode: string) {
  const modeConfig: Record<
    string,
    { color: string; label: string }
  > = {
    CASH: { color: "bg-green-100 text-green-800", label: "Cash" },
    CARD: { color: "bg-blue-100 text-blue-800", label: "Card" },
    UPI: { color: "bg-purple-100 text-purple-800", label: "UPI" },
    BANK_TRANSFER: { color: "bg-orange-100 text-orange-800", label: "Bank Transfer" },
    CHEQUE: { color: "bg-yellow-100 text-yellow-800", label: "Cheque" },
  };

  const config = modeConfig[mode] || {
    color: "bg-gray-100 text-gray-800",
    label: mode,
  };

  return <Badge className={config.color}>{config.label}</Badge>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PaymentManagement() {
  const { city } = useCity();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<PaymentFilters>({
    city: "all",
    paymentMode: "all",
    dateRange: "all",
    searchQuery: "",
  });

  useEffect(() => {
    loadPayments();
  }, [filters, city]);

  async function loadPayments() {
    setIsLoading(true);
    setError(null);

    try {
      const [paymentsData, summaryData] = await Promise.all([
        fetchPayments(filters, city),
        fetchPaymentSummary(filters),
      ]);
      setPayments(paymentsData.payments);
      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payments");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFilterChange(key: keyof PaymentFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleViewInvoice(invoiceId: string) {
    navigate(`/finance/invoices/${invoiceId}`);
  }

  function resetFilters() {
    setFilters({
      city: "all",
      paymentMode: "all",
      dateRange: "all",
      searchQuery: "",
    });
  }

  // ============================================================================
  // RENDER: ERROR STATE
  // ============================================================================

  if (error && !isLoading) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Payments</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={loadPayments}
              className="ml-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // ============================================================================
  // RENDER: MAIN UI
  // ============================================================================

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/finance" />
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Payment Management</h1>
          <p className="text-gray-600">
            View and track all payment transactions
          </p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Payments
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Payments */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{summary.totalPayments}</p>
                  )}
                </div>
                <DollarSign className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          {/* Total Amount */}
          <Card className="lg:col-span-2">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Amount Collected</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-32 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(summary.totalAmount)}
                    </p>
                  )}
                </div>
                <Calendar className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Mode Summary */}
          {summary.byMode.slice(0, 2).map((mode) => (
            <Card key={mode.mode}>
              <CardContent className="pt-6">
                <div>
                  <p className="text-sm text-gray-600">{mode.mode}</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-24 mt-1" />
                  ) : (
                    <>
                      <p className="text-lg font-bold">
                        {formatCurrency(mode.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{mode.count} transactions</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* City Filter */}
            <div>
              <Label>City</Label>
              <Select
                value={filters.city}
                onValueChange={(value) => handleFilterChange("city", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="Surat">Surat</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Ahmedabad">Ahmedabad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Mode Filter */}
            <div>
              <Label>Payment Mode</Label>
              <Select
                value={filters.paymentMode}
                onValueChange={(value) =>
                  handleFilterChange("paymentMode", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CHEQUE">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div>
              <Label>Date Range</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) =>
                  handleFilterChange("dateRange", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div>
              <Label>Search</Label>
              <Input
                placeholder="Payment # or Invoice #"
                value={filters.searchQuery}
                onChange={(e) =>
                  handleFilterChange("searchQuery", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Payment Transactions ({payments.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No payments found</p>
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment #</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Recorded By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.paymentNumber}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleViewInvoice(payment.invoiceId)}
                        className="text-blue-600 hover:underline"
                      >
                        {payment.invoiceNumber}
                      </button>
                    </TableCell>
                    <TableCell>{payment.customerName}</TableCell>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>{getPaymentModeBadge(payment.paymentMode)}</TableCell>
                    <TableCell>
                      {payment.paymentReference || (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>{payment.city || "—"}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {payment.createdBy}
                      </span>
                      <div className="text-xs text-gray-400">
                        {formatDateTime(payment.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInvoice(payment.invoiceId)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Mode Breakdown */}
      {summary && summary.byMode.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Mode Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {summary.byMode.map((mode) => (
                <div key={mode.mode} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{mode.mode}</span>
                    {getPaymentModeBadge(mode.mode)}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(mode.amount)}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {mode.count} transaction{mode.count !== 1 ? "s" : ""}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg: {formatCurrency(mode.amount / mode.count)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
