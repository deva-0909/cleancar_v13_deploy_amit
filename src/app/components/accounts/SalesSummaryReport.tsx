import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService } from "../../services/accountingEntryService";
import { showExportMenu } from "../../utils/gstExportUtils";
import { Download } from "lucide-react";

type TabType = "Sales" | "Sales Returns / Credit Notes";

export function SalesSummaryReport() {
  const { city } = useCity();
  const [activeTab, setActiveTab] = useState<TabType>("Sales");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Get sales entries
  const sales = useMemo(() => {
    const from = dateFrom || "1900-01-01";
    const to = dateTo || "2099-12-31";
    const salesEntries = accountingEntryService.getByType("Sales", city);
    return salesEntries.filter((e) => e.date >= from && e.date <= to);
  }, [city, dateFrom, dateTo]);

  // Get sales returns
  const salesReturns = useMemo(() => {
    const from = dateFrom || "1900-01-01";
    const to = dateTo || "2099-12-31";
    const returnEntries = accountingEntryService.getByType("SalesReturn", city);
    return returnEntries.filter((e) => e.date >= from && e.date <= to);
  }, [city, dateFrom, dateTo]);

  // Filter by tab
  const filteredEntries = useMemo(() => {
    return activeTab === "Sales" ? sales : salesReturns;
  }, [activeTab, sales, salesReturns]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredEntries.reduce(
      (acc, e) => ({
        taxable: acc.taxable + e.taxableValue,
        cgst: acc.cgst + e.cgst,
        sgst: acc.sgst + e.sgst,
        igst: acc.igst + e.igst,
        total: acc.total + e.totalBillValue,
      }),
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );
  }, [filteredEntries]);

  // KPI calculations
  const totalSales = sales.reduce((sum, s) => sum + s.totalBillValue, 0);
  const totalReturns = salesReturns.reduce((sum, s) => sum + s.totalBillValue, 0);
  const netSales = totalSales - totalReturns;
  const totalOutputTax = sales.reduce((sum, s) => sum + s.cgst + s.sgst + s.igst, 0);

  const handleExport = (e: React.MouseEvent) => {
    const data = filteredEntries.map((entry) => ({
      Date: entry.date,
      "Voucher No": entry.voucherNumber,
      "Customer": entry.vendorName || "-",
      "Invoice No": entry.invoiceNumber,
      "Taxable Value": entry.taxableValue,
      CGST: entry.cgst,
      SGST: entry.sgst,
      IGST: entry.igst,
      Total: entry.totalBillValue,
      "Entry Type": entry.entryType,
      "Payment Mode": entry.paymentMode,
    }));
    showExportMenu(data, `sales-summary-${activeTab.toLowerCase()}`, e.currentTarget as HTMLElement);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Summary Report</h1>
          <p className="text-sm text-gray-600">Consolidated sales report</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border rounded text-blue-600 hover:bg-blue-50"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Date Filters */}
      <div className="flex gap-4 p-4 bg-gray-50 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border-l-4 border-green-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Sales</p>
          <p className="text-2xl font-bold text-green-600">₹{totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-red-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Returns</p>
          <p className="text-2xl font-bold text-red-600">₹{totalReturns.toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-blue-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Net Sales</p>
          <p className="text-2xl font-bold text-blue-600">₹{netSales.toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-purple-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Output Tax</p>
          <p className="text-2xl font-bold text-purple-600">₹{totalOutputTax.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["Sales", "Sales Returns / Credit Notes"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Voucher No</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Invoice No</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Taxable Value</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">CGST</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">SGST</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">IGST</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Entry Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Payment Mode</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{entry.date}</td>
                <td className="px-4 py-3 text-sm font-mono">{entry.voucherNumber}</td>
                <td className="px-4 py-3 text-sm">{entry.vendorName || "-"}</td>
                <td className="px-4 py-3 text-sm">{entry.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-right">₹{entry.taxableValue.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{entry.cgst.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{entry.sgst.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{entry.igst.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">₹{entry.totalBillValue.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{entry.entryType}</td>
                <td className="px-4 py-3 text-sm">{entry.paymentMode}</td>
              </tr>
            ))}
            {/* Footer Totals */}
            <tr className="bg-gray-100 font-bold">
              <td className="px-4 py-3" colSpan={4}>
                TOTAL
              </td>
              <td className="px-4 py-3 text-sm text-right">₹{totals.taxable.toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-right">₹{totals.cgst.toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-right">₹{totals.sgst.toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-right">₹{totals.igst.toFixed(2)}</td>
              <td className="px-4 py-3 text-sm text-right">₹{totals.total.toFixed(2)}</td>
              <td className="px-4 py-3" colSpan={2}></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
