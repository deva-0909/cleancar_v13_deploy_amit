import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService, TDS_RATE_CHART } from "../../services/accountingEntryService";
import { Download, AlertTriangle } from "lucide-react";

type TabType = "Rate Chart" | "TDS Payable" | "Monthly Report";

export default function TDSPayableModule() {
  const { city, cityInfo } = useCity();
  const [activeTab, setActiveTab] = useState<TabType>("TDS Payable");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    section: string;
    amount: number;
  } | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    bank: "",
    challanNumber: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  // Get all TDS-related journal entries
  const tdsEntries = useMemo(() => {
    const allMovements = accountingEntryService.getAllMovements(
      "2025-04-01",
      "2027-03-31",
      city
    );
    // Filter movements where debit ledger is a TDS Payable ledger
    const tdsPayableLedgers = accountingEntryService
      .getLedgers(city)
      .filter((l) => l.accountHead === "tds_payable");
    const tdsLedgerIds = new Set(tdsPayableLedgers.map((l) => l.id));

    return allMovements.filter((m) => tdsLedgerIds.has(m.creditLedgerId));
  }, [city]);

  // Group TDS entries by section
  const tdsBySection = useMemo(() => {
    const grouped: Record<
      string,
      {
        section: string;
        nature: string;
        entries: Array<{
          date: string;
          deducteeName: string;
          invoiceRef: string;
          taxableAmount: number;
          tdsAmount: number;
        }>;
        totalTDS: number;
        isPaid: boolean;
        challanNumber?: string;
      }
    > = {};

    tdsEntries.forEach((movement) => {
      // Extract section from ledger name (e.g., "TDS Payable - 194J")
      const sectionMatch = movement.creditLedgerName.match(/194[A-Z]?/);
      const section = sectionMatch ? sectionMatch[0] : "Other";

      if (!grouped[section]) {
        const rateInfo = TDS_RATE_CHART.find((r) => r.section === section);
        grouped[section] = {
          section,
          nature: rateInfo?.natureOfPayment || "Unknown",
          entries: [],
          totalTDS: 0,
          isPaid: false,
        };
      }

      grouped[section].entries.push({
        date: movement.date,
        deducteeName: movement.debitLedgerName,
        invoiceRef: movement.narration || "-",
        taxableAmount: movement.amount * 10, // Approximate (TDS is typically 10%)
        tdsAmount: movement.amount,
      });
      grouped[section].totalTDS += movement.amount;
    });

    return grouped;
  }, [tdsEntries]);

  // Calculate overdue sections (due by 7th of next month, except March → 30th April)
  const overdueSections = useMemo(() => {
    const today = new Date();
    const overdue: string[] = [];

    Object.entries(tdsBySection).forEach(([section, data]) => {
      if (data.isPaid) return;

      const latestEntry = data.entries[data.entries.length - 1];
      if (!latestEntry) return;

      const entryDate = new Date(latestEntry.date);
      const entryMonth = entryDate.getMonth();
      const entryYear = entryDate.getFullYear();

      // Due date: 7th of next month (or 30th April for March)
      const dueDate =
        entryMonth === 2
          ? new Date(entryYear, 3, 30) // March → 30 April
          : new Date(entryYear, entryMonth + 1, 7);

      if (today > dueDate && data.totalTDS > 0) {
        overdue.push(section);
      }
    });

    return overdue;
  }, [tdsBySection]);

  // Monthly report data
  const monthlyReport = useMemo(() => {
    return Object.entries(tdsBySection).map(([section, data]) => {
      const monthEntries = data.entries.filter((e) => {
        const entryDate = new Date(e.date);
        return (
          entryDate.getMonth() + 1 === selectedMonth &&
          entryDate.getFullYear() === selectedYear
        );
      });
      const deducteeCount = new Set(monthEntries.map((e) => e.deducteeName)).size;
      const taxableAmount = monthEntries.reduce((sum, e) => sum + e.taxableAmount, 0);
      const tdsAmount = monthEntries.reduce((sum, e) => sum + e.tdsAmount, 0);

      return {
        section,
        nature: data.nature,
        deducteeCount,
        taxableAmount,
        tdsAmount,
        status: data.isPaid ? "Paid" : "Pending",
        challanNumber: data.challanNumber || "-",
      };
    });
  }, [tdsBySection, selectedMonth, selectedYear]);

  const handlePayNow = (section: string, amount: number) => {
    setPaymentModal({ open: true, section, amount });
  };

  const handleConfirmPayment = () => {
    if (!paymentModal) return;

    // Post journal entry: TDS Payable (section) Dr → Bank Cr
    const tdsLedger = accountingEntryService
      .getLedgers(city)
      .find((l) => l.name.includes(paymentModal.section));
    const bankLedger = accountingEntryService
      .getLedgers(city)
      .find((l) => l.name === paymentForm.bank);

    if (!tdsLedger || !bankLedger) {
      toast.info("Ledger not found");
      return;
    }

    accountingEntryService.createJournal(
      {
        date: paymentForm.paymentDate,
        narration: `TDS Payment - ${paymentModal.section} - Challan ${paymentForm.challanNumber}`,
        lines: [
          {
            accountHead: tdsLedger.accountHead,
            accountLabel: tdsLedger.name,
            debit: paymentModal.amount,
            credit: 0,
          },
          {
            accountHead: bankLedger.accountHead,
            accountLabel: bankLedger.name,
            debit: 0,
            credit: paymentModal.amount,
          },
        ],
        city: cityInfo.displayName,
        cityId: city,
        createdBy: "TDS Module",
      },
      cityInfo.displayName
    );

    toast.success("TDS payment recorded successfully!");
    setPaymentModal(null);
    setPaymentForm({
      bank: "",
      challanNumber: "",
      paymentDate: new Date().toISOString().split("T")[0],
    });
    window.location.reload();
  };

  const getDueDate = (section: string) => {
    const entries = tdsBySection[section]?.entries || [];
    if (entries.length === 0) return "-";

    const latestEntry = entries[entries.length - 1];
    const entryDate = new Date(latestEntry.date);
    const entryMonth = entryDate.getMonth();
    const entryYear = entryDate.getFullYear();

    if (entryMonth === 2) {
      // March → 30 April
      return `30 Apr ${entryYear}`;
    } else {
      const dueMonth = entryMonth + 1;
      const dueYear = dueMonth > 11 ? entryYear + 1 : entryYear;
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `7 ${monthNames[dueMonth % 12]} ${dueYear}`;
    }
  };

  const bankLedgers = accountingEntryService
    .getLedgers(city)
    .filter((l) => l.accountHead === "cash_bank");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">TDS Payable</h1>
          <p className="text-sm text-gray-600">Tax Deducted at Source management</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border rounded text-blue-600 hover:bg-blue-50">
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Overdue Alert */}
      {overdueSections.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">TDS overdue for sections:</p>
            <p className="text-sm text-red-700">
              {overdueSections.join(", ")} — deposit immediately to avoid penalties
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(["Rate Chart", "TDS Payable", "Monthly Report"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Rate Chart Tab */}
      {activeTab === "Rate Chart" && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
            <strong>Note:</strong> TDS is deducted at source and deposited to government by 7th of
            the following month (except March — 30th April).
          </div>
          <div className="border rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Section</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Nature of Payment
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Rate (Individual)
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Rate (Company)
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Threshold (Single)
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Threshold (Annual)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {TDS_RATE_CHART.map((rate) => (
                  <tr key={rate.section} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{rate.section}</td>
                    <td className="px-4 py-3 text-sm">{rate.natureOfPayment}</td>
                    <td className="px-4 py-3 text-sm text-right">{rate.rateIndividual}%</td>
                    <td className="px-4 py-3 text-sm text-right">{rate.rateCompany}%</td>
                    <td className="px-4 py-3 text-sm text-right">
                      ₹{rate.thresholdSingle.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      ₹{rate.thresholdAnnual.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TDS Payable Tab */}
      {activeTab === "TDS Payable" && (
        <div className="space-y-6">
          {Object.entries(tdsBySection).map(([section, data]) => (
            <div key={section} className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">
                  Section {section} — {data.nature}
                </h3>
                <span className="text-xl font-bold text-gray-900">
                  Total: ₹{data.totalTDS.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="space-y-1 font-mono text-sm mb-3">
                {data.entries.map((entry, idx) => (
                  <div key={idx} className="flex justify-between py-1 text-gray-700">
                    <span className="text-gray-500">{entry.date}</span>
                    <span>{entry.deducteeName}</span>
                    <span>{entry.invoiceRef}</span>
                    <span>
                      ₹{entry.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (TDS: ₹
                      {entry.tdsAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 flex items-center justify-between">
                <span className="text-sm text-gray-600">Due: {getDueDate(section)}</span>
                {!data.isPaid && data.totalTDS > 0 && (
                  <button
                    onClick={() => handlePayNow(section, data.totalTDS)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  >
                    Pay Now
                  </button>
                )}
                {data.isPaid && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">
                    Paid — {data.challanNumber}
                  </span>
                )}
              </div>
            </div>
          ))}
          {Object.keys(tdsBySection).length === 0 && (
            <div className="text-center py-12 text-gray-500">No TDS entries found</div>
          )}
        </div>
      )}

      {/* Monthly Report Tab */}
      {activeTab === "Monthly Report" && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border rounded px-3 py-2"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {new Date(2026, i, 1).toLocaleString("default", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border rounded px-3 py-2"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
              </select>
            </div>
          </div>
          <div className="border rounded overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Section</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Nature</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Deductee Count
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    Taxable Amount
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                    TDS Amount
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Challan No
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {monthlyReport
                  .filter((r) => r.tdsAmount > 0)
                  .map((report) => (
                    <tr key={report.section} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">{report.section}</td>
                      <td className="px-4 py-3 text-sm">{report.nature}</td>
                      <td className="px-4 py-3 text-sm text-right">{report.deducteeCount}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        ₹{report.taxableAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        ₹{report.tdsAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            report.status === "Paid"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{report.challanNumber}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Pay TDS - Section {paymentModal.section}</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Amount (₹)</label>
              <input
                type="number"
                value={paymentModal.amount}
                readOnly
                className="w-full border rounded px-3 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank</label>
              <select
                value={paymentForm.bank}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, bank: e.target.value }))
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select Bank</option>
                {bankLedgers.map((bank) => (
                  <option key={bank.id} value={bank.name}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Challan Number</label>
              <input
                type="text"
                value={paymentForm.challanNumber}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, challanNumber: e.target.value }))
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Date</label>
              <input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, paymentDate: e.target.value }))
                }
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPaymentModal(null)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={!paymentForm.bank || !paymentForm.challanNumber}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
