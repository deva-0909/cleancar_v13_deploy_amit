import React, { useState, useEffect } from "react";
import { formatCurrency } from "../../lib/formatters";
import {
  FileText,
  DollarSign,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  CreditCard,
  RefreshCw,
  Filter,
  Download,
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { useCity } from "../../contexts/CityContext";
import { useCustomers } from "../../contexts/AppProvider";
import { useCustomerSubscriptions } from "../../contexts/AppProvider";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  serviceId?: string;
  serviceType?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED";
  paymentStatus: "PENDING" | "PARTIAL" | "COMPLETED";
  city?: string;
  cluster?: string;
  createdAt: string;
}

interface InvoiceFilters {
  city: string;
  status: string;
  dateRange: string;
  searchQuery: string;
}

interface InvoiceListResponse {
  invoices: Invoice[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface PaymentFormData {
  amount: string;
  paymentMode: string;
  paymentReference: string;
  paymentDate: string;
}

// ============================================================================
// MOCK DATA (Replace with real API in production)
// ============================================================================

const mockInvoices: Invoice[] = [
  {
    id: "inv_001",
    invoiceNumber: "INV-2026-001",
    customerId: "cust_123",
    customerName: "Rajesh Patel",
    serviceId: "svc_456",
    serviceType: "AC Service",
    invoiceDate: "2026-04-15",
    dueDate: "2026-04-30",
    subtotal: 2500.0,
    taxAmount: 450.0,
    discountAmount: 0.0,
    totalAmount: 2950.0,
    paidAmount: 0.0,
    balanceDue: 2950.0,
    status: "UNPAID",
    paymentStatus: "PENDING",
    city: "Surat",
    cluster: "West Zone",
    createdAt: "2026-04-15T10:30:00Z",
  },
  {
    id: "inv_002",
    invoiceNumber: "INV-2026-002",
    customerId: "cust_124",
    customerName: "Priya Sharma",
    serviceId: "svc_457",
    serviceType: "Washing Machine Repair",
    invoiceDate: "2026-04-10",
    dueDate: "2026-04-25",
    subtotal: 1800.0,
    taxAmount: 324.0,
    discountAmount: 100.0,
    totalAmount: 2024.0,
    paidAmount: 1000.0,
    balanceDue: 1024.0,
    status: "PARTIAL",
    paymentStatus: "PARTIAL",
    city: "Bangalore",
    cluster: "South Zone",
    createdAt: "2026-04-10T14:20:00Z",
  },
  {
    id: "inv_003",
    invoiceNumber: "INV-2026-003",
    customerId: "cust_125",
    customerName: "Amit Kumar",
    serviceId: "svc_458",
    serviceType: "Refrigerator Service",
    invoiceDate: "2026-04-05",
    dueDate: "2026-04-20",
    subtotal: 3200.0,
    taxAmount: 576.0,
    discountAmount: 200.0,
    totalAmount: 3576.0,
    paidAmount: 3576.0,
    balanceDue: 0.0,
    status: "PAID",
    paymentStatus: "COMPLETED",
    city: "Mumbai",
    cluster: "Central Zone",
    createdAt: "2026-04-05T09:15:00Z",
  },
  {
    id: "inv_004",
    invoiceNumber: "INV-2026-004",
    customerId: "cust_126",
    customerName: "Sneha Desai",
    serviceId: "svc_459",
    serviceType: "AC Installation",
    invoiceDate: "2026-03-28",
    dueDate: "2026-04-12",
    subtotal: 15000.0,
    taxAmount: 2700.0,
    discountAmount: 500.0,
    totalAmount: 17200.0,
    paidAmount: 0.0,
    balanceDue: 17200.0,
    status: "OVERDUE",
    paymentStatus: "PENDING",
    city: "Surat",
    cluster: "West Zone",
    createdAt: "2026-03-28T11:45:00Z",
  },
];

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchInvoices(
  filters: InvoiceFilters
): Promise<InvoiceListResponse> {
  // In production: Replace with real API call
  // const response = await fetch('/api/invoices?' + new URLSearchParams({
  //   city: filters.city,
  //   status: filters.status,
  //   dateRange: filters.dateRange,
  //   search: filters.searchQuery,
  // }));
  // return await response.json();

  // Mock delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Mock filtering
  let filtered = [...mockInvoices];

  if (filters.city !== "all") {
    filtered = filtered.filter((inv) => inv.city === filters.city);
  }

  if (filters.status !== "all") {
    filtered = filtered.filter((inv) => inv.status === filters.status);
  }

  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.customerName.toLowerCase().includes(query)
    );
  }

  return {
    invoices: filtered,
    totalCount: filtered.length,
    page: 1,
    pageSize: 20,
  };
}

async function recordPayment(
  invoiceId: string,
  paymentData: PaymentFormData
): Promise<void> {
  // In production: Replace with real API call
  // const response = await fetch('/api/payments', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     invoiceId,
  //     amount: parseFloat(paymentData.amount),
  //     paymentMode: paymentData.paymentMode,
  //     paymentReference: paymentData.paymentReference,
  //     paymentDate: paymentData.paymentDate,
  //   }),
  // });
  // if (!response.ok) throw new Error('Failed to record payment');

  // Mock delay
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log("Payment recorded:", { invoiceId, paymentData });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusBadge(status: Invoice["status"]) {
  const statusConfig = {
    UNPAID: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
    PARTIAL: { color: "bg-blue-100 text-blue-800", icon: AlertCircle },
    PAID: { color: "bg-green-100 text-green-800", icon: CheckCircle },
    OVERDUE: { color: "bg-red-100 text-red-800", icon: AlertCircle },
    CANCELLED: { color: "bg-gray-100 text-gray-800", icon: XCircle },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge className={config.color}>
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  );
}
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isDueToday(dueDate: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dueDate === today;
}

function isOverdue(dueDate: string, status: Invoice["status"]): boolean {
  if (status === "PAID" || status === "CANCELLED") return false;
  const today = new Date().toISOString().split("T")[0];
  return dueDate < today;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function InvoiceManagement() {
  const { cityInfo } = useCity();
  const { customers } = useCustomers();
  const { subscriptions } = useCustomerSubscriptions();

  const generatedInvoices = subscriptions
    .filter(s => s.status === "Active")
    .slice(0, 20)
    .map((sub, i) => {
      const customer = customers.find(c => c.customerId === sub.customerId);
      const invoiceNum = i + 1;
      const baseAmount = sub.pricing?.finalPrice || 0;
      const taxableAmount = baseAmount;
      const cgst = Math.round(taxableAmount * 0.09);
      const sgst = Math.round(taxableAmount * 0.09);
      const totalAmount = Math.round(taxableAmount * 1.18);

      return {
        id: sub.subscriptionId,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(invoiceNum).padStart(4,"0")}`,
        invoiceDate: sub.startDate || new Date().toISOString().split("T")[0],
        dueDate: sub.renewalDate || new Date().toISOString().split("T")[0],
        customerId: sub.customerId,
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Customer",
        serviceType: sub.packageType,
        subtotal: baseAmount,
        taxAmount: cgst + sgst,
        discountAmount: sub.pricing?.discount || 0,
        totalAmount: totalAmount,
        paidAmount: totalAmount,
        balanceDue: 0,
        status: "PAID" as const,
        paymentStatus: "COMPLETED" as const,
        city: sub.cityId || "CITY-SURAT",
        createdAt: sub.startDate || new Date().toISOString(),
      };
    });

  const [invoices, setInvoices] = useState<Invoice[]>(generatedInvoices);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<InvoiceFilters>({
    city: "all",
    status: "all",
    dateRange: "all",
    searchQuery: "",
  });

  // Payment drawer state
  const [isPaymentDrawerOpen, setIsPaymentDrawerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState<PaymentFormData>({
    amount: "",
    paymentMode: "CASH",
    paymentReference: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Load invoices on mount and filter change
  useEffect(() => {
    loadInvoices();
  }, [filters]);

  async function loadInvoices() {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchInvoices(filters);
      setInvoices(data.invoices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoices");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFilterChange(key: keyof InvoiceFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleRecordPaymentClick(invoice: Invoice) {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: invoice.balanceDue.toString(),
      paymentMode: "CASH",
      paymentReference: "",
      paymentDate: new Date().toISOString().split("T")[0],
    });
    setIsPaymentDrawerOpen(true);
  }

  async function handleSubmitPayment() {
    if (!selectedInvoice) return;

    const paymentAmount = parseFloat(paymentForm.amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    if (paymentAmount > selectedInvoice.balanceDue) {
      alert("Payment amount cannot exceed outstanding balance");
      return;
    }

    setIsSubmittingPayment(true);

    try {
      await recordPayment(selectedInvoice.id, paymentForm);
      setIsPaymentDrawerOpen(false);
      loadInvoices(); // Reload to get updated invoice status
      alert("Payment recorded successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  function handleViewInvoice(invoiceId: string) {
    // Navigate to invoice detail page
    window.location.href = `/finance/invoices/${invoiceId}`;
  }

  // ============================================================================
  // RENDER: ERROR STATE
  // ============================================================================

  if (error && !isLoading) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Invoices</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={loadInvoices}
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
          <h1 className="text-2xl font-bold">Invoice Management</h1>
          <p className="text-gray-600">
            Manage invoices, payments, and receivables
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </div>

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
                  <SelectItem value={cityInfo?.displayName || "Surat"}>{cityInfo?.displayName || "Surat"}</SelectItem>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div>
              <Label>Date Range</Label>
              <Select
                value={filters.dateRange}
                onValueChange={(value) => handleFilterChange("dateRange", value)}
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
                placeholder="Invoice # or Customer Name"
                value={filters.searchQuery}
                onChange={(e) =>
                  handleFilterChange("searchQuery", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Invoices ({invoices.length})
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No invoices found</p>
              <Button variant="outline" onClick={() => setFilters({
                city: "all",
                status: "all",
                dateRange: "all",
                searchQuery: "",
              })}>
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-[1000px] sm:min-w-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Invoice Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{invoice.serviceType || "—"}</TableCell>
                    <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                    <TableCell>
                      <span
                        className={
                          isOverdue(invoice.dueDate, invoice.status)
                            ? "text-red-600 font-semibold"
                            : isDueToday(invoice.dueDate)
                            ? "text-orange-600 font-semibold"
                            : ""
                        }
                      >
                        {formatDate(invoice.dueDate)}
                        {isDueToday(invoice.dueDate) && " (Today)"}
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>{formatCurrency(invoice.paidAmount)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(invoice.balanceDue)}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{invoice.city || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewInvoice(invoice.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {invoice.status !== "PAID" &&
                          invoice.status !== "CANCELLED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRecordPaymentClick(invoice)}
                            >
                              <CreditCard className="w-4 h-4" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Recording Drawer */}
      <Sheet open={isPaymentDrawerOpen} onOpenChange={setIsPaymentDrawerOpen}>
        <SheetContent className="w-full sm:w-[500px] sm:w-[600px]">
          <SheetHeader>
            <SheetTitle>Record Payment</SheetTitle>
            <SheetDescription>
              Record payment for invoice {selectedInvoice?.invoiceNumber}
            </SheetDescription>
          </SheetHeader>

          {selectedInvoice && (
            <div className="mt-6 space-y-6">
              {/* Invoice Summary */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-semibold">
                        {selectedInvoice.customerName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid Amount:</span>
                      <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Outstanding:</span>
                      <span className="font-semibold text-lg text-blue-600">
                        {formatCurrency(selectedInvoice.balanceDue)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Form */}
              <div className="space-y-4">
                <div>
                  <Label>Payment Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum: {formatCurrency(selectedInvoice.balanceDue)}
                  </p>
                </div>

                <div>
                  <Label>Payment Mode *</Label>
                  <Select
                    value={paymentForm.paymentMode}
                    onValueChange={(value) =>
                      setPaymentForm({ ...paymentForm, paymentMode: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Payment Reference</Label>
                  <Input
                    placeholder="Transaction ID, Cheque #, etc."
                    value={paymentForm.paymentReference}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentReference: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Payment Date *</Label>
                  <Input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmitPayment}
                  disabled={isSubmittingPayment}
                  className="flex-1"
                >
                  {isSubmittingPayment ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Recording...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Record Payment
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsPaymentDrawerOpen(false)}
                  disabled={isSubmittingPayment}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
