import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService, type EntryType } from "../../services/accountingEntryService";

type DateFilter = "Today" | "This Week" | "This Month" | "This FY" | "Custom";

const ADVANCE_TAX_KEY = "ADVANCE_TAX_PAYMENTS";

export function AccountsDashboard() {
  const navigate = useNavigate();
  const { city, cityInfo, availableCities } = useCity();
  const [selectedCity, setSelectedCity] = useState(city);
  const [dateFilter, setDateFilter] = useState<DateFilter>("Today");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  // Get date range based on filter
  const dateRange = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    if (dateFilter === "Today") {
      return { from: today, to: today };
    }
    if (dateFilter === "This Week") {
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      return { from: weekStart.toISOString().split("T")[0], to: today };
    }
    if (dateFilter === "This Month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: monthStart.toISOString().split("T")[0], to: today };
    }
    if (dateFilter === "This FY") {
      const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const fyStart = `${year}-04-01`;
      return { from: fyStart, to: today };
    }
    // Custom
    return { from: customFrom || today, to: customTo || today };
  }, [dateFilter, customFrom, customTo]);

  // Fetch entries for the selected period
  const entries = useMemo(() => {
    return accountingEntryService.getByDateRange(dateRange.from, dateRange.to, selectedCity);
  }, [dateRange, selectedCity]);

  // Calculate today's entries
  const todayEntries = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return accountingEntryService.getByDateRange(today, today, selectedCity);
  }, [selectedCity]);

  // Calculate this month's entries
  const thisMonthEntries = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const today = now.toISOString().split("T")[0];
    return accountingEntryService.getByDateRange(monthStart, today, selectedCity);
  }, [selectedCity]);

  // KPI calculations
  const salesToday = todayEntries
    .filter((e) => e.entryType === "Sales")
    .reduce((sum, e) => sum + e.totalBillValue, 0);

  const salesThisMonth = thisMonthEntries
    .filter((e) => e.entryType === "Sales")
    .reduce((sum, e) => sum + e.totalBillValue, 0);

  const expensesToday = todayEntries
    .filter((e) => e.entryType === "Expense" || e.entryType === "Purchase")
    .reduce((sum, e) => sum + e.totalBillValue, 0);

  const expensesThisMonth = thisMonthEntries
    .filter((e) => e.entryType === "Expense" || e.entryType === "Purchase")
    .reduce((sum, e) => sum + e.totalBillValue, 0);

  // GST calculations
  const gstPayableOutput = entries
    .filter((e) => e.entryType === "Sales")
    .reduce((sum, e) => sum + e.cgst + e.sgst + e.igst, 0);

  const gstInputCredit = entries
    .filter((e) => (e.entryType === "Purchase" || e.entryType === "Expense") && !e.isRCM)
    .reduce((sum, e) => sum + e.cgst + e.sgst + e.igst, 0);

  const netGSTPayable = gstPayableOutput - gstInputCredit;

  // Net profit calculation
  const income = entries
    .filter((e) => e.entryType === "Sales" || e.expenseAccount === "direct_income")
    .reduce((sum, e) => sum + e.totalBillValue, 0);

  const expenses = entries
    .filter(
      (e) =>
        e.entryType === "Purchase" ||
        e.entryType === "Expense" ||
        e.expenseAccount === "direct_expense" ||
        e.expenseAccount === "indirect_expenses"
    )
    .reduce((sum, e) => sum + e.totalBillValue, 0);

  const netProfit = income - expenses;

  // Cash and Bank balance (ledger-based)
  const pettyCashLedger = accountingEntryService.getLedgers(selectedCity)
    .find(l => l.name === "Petty Cash" && l.type === "other");
  const bankLedger = accountingEntryService.getLedgers(selectedCity)
    .find(l => l.name === "Axis Bank" && l.type === "bank");

  const cashBalance = pettyCashLedger
    ? (() => {
        const bal = accountingEntryService.getLedgerBalance(pettyCashLedger.id);
        return bal.balanceType === "Dr" ? bal.balance : -bal.balance;
      })()
    : 0;

  const bankBalance = bankLedger
    ? (() => {
        const bal = accountingEntryService.getLedgerBalance(bankLedger.id);
        return bal.balanceType === "Dr" ? bal.balance : -bal.balance;
      })()
    : 0;

  // Phase 2 - Ledger-based KPIs
  const debtorsLedgers = accountingEntryService.getLedgersByHead("debtors", selectedCity);
  const debtorsTotal = debtorsLedgers.reduce((sum, ledger) => {
    const balance = accountingEntryService.getLedgerBalance(ledger.id);
    return sum + (balance.balanceType === "Dr" ? balance.balance : 0);
  }, 0);

  const razorpayLedger = accountingEntryService.getLedgers(selectedCity)
    .find(l => l.name === "Razorpay" && l.type === "payment_gateway");
  const razorpayBalance = razorpayLedger
    ? accountingEntryService.getLedgerBalance(razorpayLedger.id).balance
    : 0;

  const chargesLedger = accountingEntryService.getLedgers(selectedCity)
    .find(l => l.name === "Razorpay Charges" && l.type === "vendor");
  const unpaidCharges = chargesLedger
    ? (() => {
        const balance = accountingEntryService.getLedgerBalance(chargesLedger.id);
        return balance.balanceType === "Cr" ? balance.balance : 0;
      })()
    : 0;

  // Advance Tax - Next Due Instalment
  const nextAdvanceTaxDue = useMemo(() => {
    const fy = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const paidMap: Record<string, boolean> = (() => {
      try { return JSON.parse(localStorage.getItem(ADVANCE_TAX_KEY) || "{}"); } catch { return {}; }
    })();
    const schedule = [
      { no: "1st", date: `${fy}-06-15`, label: `15 Jun ${fy}`,       pct: 0.15 },
      { no: "2nd", date: `${fy}-09-15`, label: `15 Sep ${fy}`,       pct: 0.45 },
      { no: "3rd", date: `${fy}-12-15`, label: `15 Dec ${fy}`,       pct: 0.75 },
      { no: "4th", date: `${fy + 1}-03-15`, label: `15 Mar ${fy+1}`, pct: 1.00 },
    ];
    return schedule.find(s =>
      !paidMap[`${fy}-${s.no}`] &&
      s.date >= new Date().toISOString().split("T")[0]
    ) || null;
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts Dashboard</h1>
          <p className="text-sm text-gray-600">
            {dateRange.from} to {dateRange.to}
          </p>
        </div>
        <div className="flex gap-4">
          {/* City Filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="border rounded px-3 py-2"
          >
            {availableCities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <div className="flex gap-2">
            {(["Today", "This Week", "This Month", "This FY", "Custom"] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-3 py-2 border rounded text-sm ${
                  dateFilter === filter
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Inputs */}
      {dateFilter === "Custom" && (
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border rounded px-3 py-2"
            />
          </div>
        </div>
      )}

      {/* KPI Cards Row 1 - Sales (Green) */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border-l-4 border-green-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Sales Today</p>
          <p className="text-3xl font-bold text-gray-900">₹{salesToday.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">From Sales entries</p>
        </div>
        <div className="bg-white border-l-4 border-green-600 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Sales This Month</p>
          <p className="text-3xl font-bold text-gray-900">₹{salesThisMonth.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">From Sales entries</p>
        </div>
      </div>

      {/* KPI Cards Row 2 - Expenses (Red) */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white border-l-4 border-red-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Expenses Today</p>
          <p className="text-3xl font-bold text-gray-900">₹{expensesToday.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Expense + Purchase</p>
        </div>
        <div className="bg-white border-l-4 border-red-600 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Expenses This Month</p>
          <p className="text-3xl font-bold text-gray-900">₹{expensesThisMonth.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Expense + Purchase</p>
        </div>
      </div>

      {/* KPI Cards Row 3 - GST (Amber/Purple) */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white border-l-4 border-amber-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">GST Payable (Output)</p>
          <p className="text-2xl font-bold text-gray-900">₹{gstPayableOutput.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">From Sales</p>
        </div>
        <div className="bg-white border-l-4 border-amber-600 p-4 rounded shadow">
          <p className="text-sm text-gray-600">GST Input Credit</p>
          <p className="text-2xl font-bold text-gray-900">₹{gstInputCredit.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Purchase + Expense (non-RCM)</p>
        </div>
        <div
          className={`bg-white border-l-4 p-4 rounded shadow ${
            netGSTPayable >= 0 ? "border-red-500" : "border-green-500"
          }`}
        >
          <p className="text-sm text-gray-600">Net GST Payable</p>
          <p className={`text-2xl font-bold ${netGSTPayable >= 0 ? "text-red-600" : "text-green-600"}`}>
            ₹{netGSTPayable.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Output - Input</p>
        </div>
        <div className="bg-white border-l-4 border-purple-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">TDS Payable</p>
          <p className="text-2xl font-bold text-gray-400">₹0</p>
          <p className="text-xs text-gray-500 mt-1">Configure TDS in settings</p>
        </div>
        {nextAdvanceTaxDue && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 cursor-pointer hover:shadow-md"
            onClick={() => navigate("/accounts/advance-tax")}>
            <p className="text-xs font-medium text-orange-800 mb-1">Next Advance Tax Due</p>
            <p className="text-xl font-bold text-orange-900">
              {nextAdvanceTaxDue.label}
            </p>
            <p className="text-xs text-orange-600 mt-1">
              {nextAdvanceTaxDue.pct * 100}% cumulative — click to pay
            </p>
          </div>
        )}
      </div>

      {/* KPI Cards Row 4 - Profit & Cash (Blue) */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white border-l-4 border-blue-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Net Profit (Live)</p>
          <p className={`text-3xl font-bold ${netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
            ₹{netProfit.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Income - Expenses</p>
        </div>
        <div className="bg-white border-l-4 border-blue-600 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Cash Balance</p>
          <p className="text-3xl font-bold text-gray-900">₹{cashBalance.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Cash account credits</p>
        </div>
        <div className="bg-white border-l-4 border-blue-700 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Bank Balance</p>
          <p className="text-3xl font-bold text-gray-900">₹{bankBalance.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Bank account credits</p>
        </div>
      </div>

      {/* KPI Cards Row 5 - Ledger Balances (Phase 2) */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white border-l-4 border-indigo-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Debtors Total</p>
          <p className="text-3xl font-bold text-indigo-600">₹{debtorsTotal.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Customer outstanding receivables</p>
        </div>
        <div className="bg-white border-l-4 border-purple-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Razorpay Balance</p>
          <p className={`text-3xl font-bold ${razorpayBalance === 0 ? "text-green-600" : "text-amber-600"}`}>
            ₹{razorpayBalance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Should be NIL if all settled</p>
        </div>
        <div className="bg-white border-l-4 border-rose-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Unpaid Transaction Charges</p>
          <p className="text-3xl font-bold text-rose-600">₹{unpaidCharges.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Pending Razorpay charges</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border rounded-lg p-6 shadow">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-4">
          <Link
            to="/accounts/razorpay-flow"
            className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
          >
            <Zap className="w-5 h-5 text-purple-600" />
            <div>
              <div className="font-medium text-purple-900 text-sm">Razorpay Settlement</div>
              <div className="text-xs text-purple-600">Post 5-step payment cycle</div>
            </div>
          </Link>
          <Link
            to="/accounts/accounting-entry"
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
          >
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <div className="font-medium text-blue-900 text-sm">New Entry</div>
              <div className="text-xs text-blue-600">Create accounting entry</div>
            </div>
          </Link>
          <Link
            to="/accounts/ledger"
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
          >
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <div>
              <div className="font-medium text-green-900 text-sm">View Ledger</div>
              <div className="text-xs text-green-600">Account balances</div>
            </div>
          </Link>
          <Link
            to="/accounts/ledger-master"
            className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <div>
              <div className="font-medium text-indigo-900 text-sm">Ledger Master</div>
              <div className="text-xs text-indigo-600">Manage ledgers</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
