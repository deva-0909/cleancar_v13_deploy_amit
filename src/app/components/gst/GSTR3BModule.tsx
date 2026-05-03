import { useState, useMemo } from "react";
import { ReceiptText, Download, AlertTriangle, Lock } from "lucide-react";
import { gstComplianceService } from "../../services/gstComplianceService";
import { showExportMenu } from "../../utils/gstExportUtils";

export function GSTR3BModule() {
  const [selectedMonth, setSelectedMonth] = useState("April");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedGSTIN, setSelectedGSTIN] = useState("24GAOPS5676E1Z3");
  const [status, setStatus] = useState<"Not Generated" | "Generated" | "Approved" | "Ready to File">("Not Generated");
  const [isApproved, setIsApproved] = useState(false);

  const transactions = gstComplianceService.getTransactions();
  const reconciliation = gstComplianceService.getReconciliation();

  const monthTransactions = useMemo(() =>
    transactions.filter(t =>
      t.month === selectedMonth &&
      t.year === selectedYear &&
      t.status === "Approved"
    ),
    [transactions, selectedMonth, selectedYear]
  );

  const salesTransactions = useMemo(() =>
    monthTransactions.filter(t => t.transactionType === "Sale"),
    [monthTransactions]
  );

  const purchaseTransactions = useMemo(() =>
    monthTransactions.filter(t => t.transactionType === "Purchase"),
    [monthTransactions]
  );

  const table31 = useMemo(() => {
    const taxableOutward = salesTransactions.reduce((s, t) => s + t.taxableValue, 0);
    const zeroRated = salesTransactions.filter(t => t.gstRate === 0).reduce((s, t) => s + t.taxableValue, 0);
    const nilRated = 0;
    const exempted = 0;
    const total = taxableOutward + zeroRated + nilRated + exempted;

    return { taxableOutward, zeroRated, nilRated, exempted, total };
  }, [salesTransactions]);

  const itcData = useMemo(() => {
    const itcFromBooks = purchaseTransactions
      .filter(t => t.itcEligible)
      .reduce((s, t) => s + t.itcAmount, 0);

    const itcFrom2B = reconciliation
      .filter(r => r.month === selectedMonth && r.year === selectedYear && r.itcClaimable)
      .reduce((s, r) => s + r.gstAmount, 0);

    const itcIneligible = purchaseTransactions
      .filter(t => !t.itcEligible)
      .reduce((s, t) => s + t.totalTax, 0);

    const netITCAvailable = itcFromBooks;
    const difference = itcFromBooks - itcFrom2B;

    return { itcFromBooks, itcFrom2B, itcIneligible, netITCAvailable, difference };
  }, [purchaseTransactions, reconciliation, selectedMonth, selectedYear]);

  const table6 = useMemo(() => {
    const outputTax = salesTransactions.reduce((s, t) => s + t.totalTax, 0);
    const itcCredit = itcData.netITCAvailable;
    const cashPayment = Math.max(0, outputTax - itcCredit);

    return { outputTax, itcCredit, cashPayment };
  }, [salesTransactions, itcData]);

  const handleApprove = () => {
    setIsApproved(true);
    setStatus("Ready to File");
  };

  const handleExport31 = (e: React.MouseEvent) => {
    const data = [{
      "Taxable Outward Supplies": table31.taxableOutward,
      "Zero-rated": table31.zeroRated,
      "Nil-rated": table31.nilRated,
      "Exempted": table31.exempted,
      "Total": table31.total
    }];
    showExportMenu(data, "gstr3b-table-3.1", e.currentTarget as HTMLElement);
  };

  const handleExportITC = (e: React.MouseEvent) => {
    const data = [{
      "ITC from Books": itcData.itcFromBooks,
      "ITC from GSTR-2B": itcData.itcFrom2B,
      "Difference": itcData.difference,
      "ITC Ineligible": itcData.itcIneligible,
      "Net ITC Available": itcData.netITCAvailable
    }];
    showExportMenu(data, "gstr3b-table-4-itc", e.currentTarget as HTMLElement);
  };

  const handleExportTable6 = (e: React.MouseEvent) => {
    const data = [{
      "Output Tax": table6.outputTax,
      "ITC Credit": table6.itcCredit,
      "Cash Payment Required": table6.cashPayment
    }];
    showExportMenu(data, "gstr3b-table-6-net-tax", e.currentTarget as HTMLElement);
  };

  const handleDownloadFullGSTR3BCSV = () => {
    const rows: string[] = [];
    const BOM = "\uFEFF";

    const esc = (v: any) => {
      const s = String(v ?? "");
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const buildSection = (title: string, headers: string[], dataRows: string[][]) => {
      rows.push(title);
      rows.push(headers.map(esc).join(","));
      dataRows.forEach(row => rows.push(row.map(esc).join(",")));
      rows.push("");
    };

    // Header
    rows.push(`GSTR-3B Summary Report`);
    rows.push(`GSTIN: ${selectedGSTIN}`);
    rows.push(`Period: ${selectedMonth} ${selectedYear}`);
    rows.push(`Status: ${status}`);
    rows.push(`Generated: ${new Date().toLocaleString()}`);
    rows.push("");
    rows.push("");

    // Table 3.1 — Outward Supplies
    buildSection(
      "Table 3.1 — Outward and Inward Supplies",
      ["Description", "Amount (₹)"],
      [
        ["Taxable outward supplies", table31.taxableOutward.toFixed(2)],
        ["Zero-rated supplies", table31.zeroRated.toFixed(2)],
        ["Nil-rated supplies", table31.nilRated.toFixed(2)],
        ["Exempted supplies", table31.exempted.toFixed(2)],
        ["Total", table31.total.toFixed(2)]
      ]
    );

    // Table 4 — ITC Available
    buildSection(
      "Table 4 — ITC Available (Input Tax Credit)",
      ["Description", "Amount (₹)"],
      [
        ["ITC as per books", itcData.itcFromBooks.toFixed(2)],
        ["ITC as per GSTR-2B", itcData.itcFrom2B.toFixed(2)],
        ["Difference", itcData.difference.toFixed(2)],
        ["ITC ineligible", itcData.itcIneligible.toFixed(2)],
        ["Net ITC available", itcData.netITCAvailable.toFixed(2)]
      ]
    );

    // Table 6 — Net Tax Payable
    buildSection(
      "Table 6 — Net Tax Payable",
      ["Description", "Amount (₹)"],
      [
        ["Output tax", table6.outputTax.toFixed(2)],
        ["ITC credit", table6.itcCredit.toFixed(2)],
        ["Cash payment required", table6.cashPayment.toFixed(2)]
      ]
    );

    // Transaction Summary
    buildSection(
      "Transaction Summary",
      ["Type", "Count", "Total Taxable Value (₹)", "Total Tax (₹)"],
      [
        [
          "Sales",
          String(salesTransactions.length),
          salesTransactions.reduce((s, t) => s + t.taxableValue, 0).toFixed(2),
          salesTransactions.reduce((s, t) => s + t.totalTax, 0).toFixed(2)
        ],
        [
          "Purchases",
          String(purchaseTransactions.length),
          purchaseTransactions.reduce((s, t) => s + t.taxableValue, 0).toFixed(2),
          purchaseTransactions.reduce((s, t) => s + t.totalTax, 0).toFixed(2)
        ]
      ]
    );

    // ITC Reconciliation Status
    if (Math.abs(itcData.difference) > 0) {
      rows.push("ITC Reconciliation Alert");
      rows.push(`Difference between books and GSTR-2B: ₹${itcData.difference.toFixed(2)}`);
      if (Math.abs(itcData.difference) > 1000) {
        rows.push("⚠️ Difference exceeds ₹1,000 - Reconciliation required before filing");
      }
      rows.push("");
    }

    // Footer
    rows.push("");
    rows.push("Note: This report is generated from approved transactions only.");
    rows.push("Please verify all amounts before filing with GSTN portal.");

    const csvContent = BOM + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GSTR3B_${selectedMonth}_${selectedYear}_${selectedGSTIN}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Generated": return "bg-gray-100 text-gray-700";
      case "Generated": return "bg-blue-100 text-blue-700";
      case "Approved": return "bg-green-100 text-green-700";
      case "Ready to File": return "bg-purple-100 text-purple-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ReceiptText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">GSTR-3B Summary</h1>
            <p className="text-sm text-gray-600">Monthly summary of outward and inward supplies</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            disabled={isApproved}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            <option>April</option>
            <option>March</option>
            <option>February</option>
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            disabled={isApproved}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
          >
            <option>2026</option>
            <option>2025</option>
          </select>
          <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-mono">{selectedGSTIN}</div>
          <span className={`px-3 py-2 rounded-lg text-sm font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Table 3.1 — Outward and Inward Supplies</h3>
          <button
            onClick={handleExport31}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {isApproved && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-600" />
            <span className="text-sm text-purple-900">Values are locked after approval</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 text-sm">
                <td className="py-3 text-gray-900">Taxable outward supplies</td>
                <td className="py-3 text-right font-medium text-gray-900">₹{table31.taxableOutward.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-gray-100 text-sm">
                <td className="py-3 text-gray-900">Zero-rated supplies</td>
                <td className="py-3 text-right text-gray-700">₹{table31.zeroRated.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-gray-100 text-sm">
                <td className="py-3 text-gray-900">Nil-rated supplies</td>
                <td className="py-3 text-right text-gray-700">₹{table31.nilRated.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-gray-100 text-sm">
                <td className="py-3 text-gray-900">Exempted supplies</td>
                <td className="py-3 text-right text-gray-700">₹{table31.exempted.toLocaleString()}</td>
              </tr>
              <tr className="text-sm bg-gray-50">
                <td className="py-3 font-semibold text-gray-900">Total</td>
                <td className="py-3 text-right font-semibold text-gray-900">₹{table31.total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Table 4 — ITC Available</h3>
          <button
            onClick={handleExportITC}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div>
            <p className="text-sm text-blue-900 mb-1">ITC as per books</p>
            <p className="text-xl font-semibold text-blue-900">₹{itcData.itcFromBooks.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-blue-900 mb-1">ITC as per 2B</p>
            <p className="text-xl font-semibold text-blue-900">₹{itcData.itcFrom2B.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-blue-900 mb-1">Difference</p>
            <p className={`text-xl font-semibold ${Math.abs(itcData.difference) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ₹{itcData.difference.toLocaleString()}
            </p>
          </div>
        </div>

        {Math.abs(itcData.difference) > 1000 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">ITC Reconciliation Required</p>
              <p className="text-sm text-amber-700">Difference exceeds ₹1,000. Reconcile ITC before filing.</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 text-sm">
                <td className="py-3 text-gray-900">ITC from GSTR-2B imports</td>
                <td className="py-3 text-right text-gray-700">₹{itcData.itcFrom2B.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-gray-100 text-sm">
                <td className="py-3 text-gray-900">ITC ineligible</td>
                <td className="py-3 text-right text-gray-700">₹{itcData.itcIneligible.toLocaleString()}</td>
              </tr>
              <tr className="text-sm bg-green-50">
                <td className="py-3 font-semibold text-gray-900">Net ITC available</td>
                <td className="py-3 text-right font-semibold text-green-600">₹{itcData.netITCAvailable.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Table 6 — Net Tax Payable</h3>
          <button
            onClick={handleExportTable6}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                <th className="pb-3 font-medium">Description</th>
                <th className="pb-3 font-medium text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 text-sm">
                <td className="py-3 text-gray-900">Output tax</td>
                <td className="py-3 text-right text-gray-700">₹{table6.outputTax.toLocaleString()}</td>
              </tr>
              <tr className="border-b border-gray-100 text-sm">
                <td className="py-3 text-gray-900">ITC credit</td>
                <td className="py-3 text-right text-green-600">-₹{table6.itcCredit.toLocaleString()}</td>
              </tr>
              <tr className="text-sm bg-purple-50">
                <td className="py-3 font-semibold text-gray-900">Cash payment required</td>
                <td className="py-3 text-right font-semibold text-purple-600">₹{table6.cashPayment.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Export Options</h3>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleDownloadFullGSTR3BCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Download Full GSTR-3B Report (CSV)
          </button>
          <p className="text-sm text-gray-600">
            Comprehensive CSV export with all tables and reconciliation data
          </p>
        </div>
      </div>

      {!isApproved && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Manager Approval Required</h3>
              <p className="text-sm text-gray-600">Once approved, all values will be locked and ready for filing.</p>
            </div>
            <button
              onClick={handleApprove}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Approve GSTR-3B
            </button>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">GSTR-3B Approved</p>
              <p className="text-sm text-green-700">All values are locked. This return is ready to file.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
