import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService } from "../../services/accountingEntryService";
import { showExportMenu } from "../../utils/gstExportUtils";
import { Download } from "lucide-react";

type TabType = "All Purchases" | "GST Purchases" | "Non-GST" | "RCM" | "Asset Purchases";

export function PurchaseSummaryReport() {
  const { city } = useCity();
  const [activeTab, setActiveTab] = useState<TabType>("All Purchases");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Get purchase entries
  const purchases = useMemo(() => {
    const from = dateFrom || "1900-01-01";
    const to = dateTo || "2099-12-31";
    const purchaseEntries = accountingEntryService.getByType("Purchase", city);
    const expenseEntries = accountingEntryService.getByType("Expense", city);
    const assetEntries = accountingEntryService.getByType("AssetPurchase", city);
    return [...purchaseEntries, ...expenseEntries, ...assetEntries].filter((e) => e.date >= from && e.date <= to);
  }, [city, dateFrom, dateTo]);

  // Filter by tab
  const filteredPurchases = useMemo(() => {
    if (activeTab === "All Purchases") return purchases;
    if (activeTab === "GST Purchases")
      return purchases.filter((p) => p.gstEntryType === "B2B" || p.gstEntryType === "Unregistered");
    if (activeTab === "Non-GST") return purchases.filter((p) => p.gstEntryType === "NonGST");
    if (activeTab === "RCM") return purchases.filter((p) => p.isRCM);
    if (activeTab === "Asset Purchases") return purchases.filter((p) => p.entryType === "AssetPurchase");
    return purchases;
  }, [purchases, activeTab]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredPurchases.reduce(
      (acc, p) => ({
        taxable: acc.taxable + p.taxableValue,
        cgst: acc.cgst + p.cgst,
        sgst: acc.sgst + p.sgst,
        igst: acc.igst + p.igst,
        total: acc.total + p.totalBillValue,
      }),
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 }
    );
  }, [filteredPurchases]);

  const handleExport = (e: React.MouseEvent) => {
    const data = filteredPurchases.map((p) => ({
      Date: p.date,
      "Voucher No": p.voucherNumber,
      Vendor: p.vendorName || "-",
      "Invoice No": p.invoiceNumber,
      "Taxable Value": p.taxableValue,
      CGST: p.cgst,
      SGST: p.sgst,
      IGST: p.igst,
      Total: p.totalBillValue,
      "Entry Type": p.entryType,
      "Payment Mode": p.paymentMode,
    }));
    showExportMenu(data, `purchase-summary-${activeTab.toLowerCase()}`, e.currentTarget as HTMLElement);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Purchase Summary Report</h1>
          <p className="text-sm text-gray-600">Consolidated purchase report</p>
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
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white border-l-4 border-blue-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Taxable</p>
          <p className="text-2xl font-bold text-gray-900">₹{totals.taxable.toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-amber-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total CGST</p>
          <p className="text-2xl font-bold text-gray-900">₹{totals.cgst.toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-amber-600 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total SGST</p>
          <p className="text-2xl font-bold text-gray-900">₹{totals.sgst.toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-purple-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total IGST</p>
          <p className="text-2xl font-bold text-gray-900">₹{totals.igst.toFixed(2)}</p>
        </div>
        <div className="bg-white border-l-4 border-green-500 p-4 rounded shadow">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">₹{totals.total.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["All Purchases", "GST Purchases", "Non-GST", "RCM", "Asset Purchases"] as TabType[]).map((tab) => (
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
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vendor</th>
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
            {filteredPurchases.map((purchase) => (
              <tr key={purchase.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{purchase.date}</td>
                <td className="px-4 py-3 text-sm font-mono">{purchase.voucherNumber}</td>
                <td className="px-4 py-3 text-sm">{purchase.vendorName || "-"}</td>
                <td className="px-4 py-3 text-sm">{purchase.invoiceNumber}</td>
                <td className="px-4 py-3 text-sm text-right">₹{purchase.taxableValue.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{purchase.cgst.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{purchase.sgst.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right">₹{purchase.igst.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">₹{purchase.totalBillValue.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{purchase.entryType}</td>
                <td className="px-4 py-3 text-sm">{purchase.paymentMode}</td>
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
