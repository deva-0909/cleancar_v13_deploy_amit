import { useState, useEffect, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService, type EntryType } from "../../services/accountingEntryService";

type DateFilter = "Today" | "This Week" | "This Month" | "This FY" | "Custom";

export function AccountsDashboard() {
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

  // Cash and Bank balance (simplified - sum of credit entries)
  const cashBalance = entries
    .filter((e) => e.creditAccount === "cash_bank" && e.paymentMode === "Cash")
    .reduce((sum, e) => sum + e.totalBillValue, 0);

  const bankBalance = entries
    .filter((e) => e.creditAccount === "cash_bank" && e.paymentMode === "Bank")
    .reduce((sum, e) => sum + e.totalBillValue, 0);

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
        <div className="bg-white border-l-4 border-purple-600 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Advance Tax</p>
          <p className="text-2xl font-bold text-gray-400">₹0</p>
          <p className="text-xs text-gray-500 mt-1">Placeholder</p>
        </div>
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
    </div>
  );
}
