import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService } from "../../services/accountingEntryService";
import { Calculator, AlertCircle } from "lucide-react";

export default function AdvanceTaxCalculator() {
  const { city, cityInfo } = useCity();
  const [estimatedProfit, setEstimatedProfit] = useState(0);
  const [taxType, setTaxType] = useState<"company" | "individual">("company");
  const [tdsDeducted, setTdsDeducted] = useState(0);
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    instalment: number;
    amount: number;
    dueDate: string;
  } | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    bank: "",
    utrNumber: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const fy = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;

  // Calculate individual tax based on slabs (simplified for FY 2025-26)
  const calculateIndividualTax = (income: number): number => {
    // Old regime slabs (simplified)
    if (income <= 250000) return 0;
    if (income <= 500000) return (income - 250000) * 0.05;
    if (income <= 1000000)
      return 12500 + (income - 500000) * 0.2;
    return 112500 + (income - 1000000) * 0.3;
  };

  const { taxLiability, netTaxLiability, instalments } = useMemo(() => {
    const taxLiability =
      taxType === "company"
        ? Math.round(estimatedProfit * 0.26) // 26% including cess
        : calculateIndividualTax(estimatedProfit);

    const netTaxLiability = Math.max(0, taxLiability - tdsDeducted);

    const instalments = [
      {
        no: "1st",
        dueDate: `15 Jun ${fy}`,
        pct: 15,
        cumulativePct: 15,
        amount: Math.round(netTaxLiability * 0.15),
        status: "Pending" as const,
      },
      {
        no: "2nd",
        dueDate: `15 Sep ${fy}`,
        pct: 30,
        cumulativePct: 45,
        amount: Math.round(netTaxLiability * 0.45) - Math.round(netTaxLiability * 0.15),
        status: "Pending" as const,
      },
      {
        no: "3rd",
        dueDate: `15 Dec ${fy}`,
        pct: 30,
        cumulativePct: 75,
        amount: Math.round(netTaxLiability * 0.75) - Math.round(netTaxLiability * 0.45),
        status: "Pending" as const,
      },
      {
        no: "4th",
        dueDate: `15 Mar ${fy + 1}`,
        pct: 25,
        cumulativePct: 100,
        amount: Math.round(netTaxLiability) - Math.round(netTaxLiability * 0.75),
        status: "Pending" as const,
      },
    ];

    return { taxLiability, netTaxLiability, instalments };
  }, [estimatedProfit, taxType, tdsDeducted, fy]);

  const handlePayInstalment = (index: number) => {
    const instalment = instalments[index];
    setPaymentModal({
      open: true,
      instalment: index + 1,
      amount: instalment.amount,
      dueDate: instalment.dueDate,
    });
  };

  const handleConfirmPayment = () => {
    if (!paymentModal) return;

    // Post journal entry: Advance Tax (Asset) Dr → Bank Cr
    const advanceTaxLedger = accountingEntryService
      .getLedgers(city)
      .find((l) => l.name === "Advance Tax Paid");
    const bankLedger = accountingEntryService
      .getLedgers(city)
      .find((l) => l.name === paymentForm.bank);

    if (!advanceTaxLedger || !bankLedger) {
      alert("Ledger not found");
      return;
    }

    accountingEntryService.createJournal(
      {
        date: paymentForm.paymentDate,
        narration: `Advance Tax ${paymentModal.instalment}${
          paymentModal.instalment === 1
            ? "st"
            : paymentModal.instalment === 2
            ? "nd"
            : paymentModal.instalment === 3
            ? "rd"
            : "th"
        } Instalment - UTR ${paymentForm.utrNumber}`,
        lines: [
          {
            accountHead: advanceTaxLedger.accountHead,
            accountLabel: advanceTaxLedger.name,
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
        createdBy: "Advance Tax Calculator",
      },
      cityInfo.displayName
    );

    alert("Advance tax payment recorded successfully!");
    setPaymentModal(null);
    setPaymentForm({
      bank: "",
      utrNumber: "",
      paymentDate: new Date().toISOString().split("T")[0],
    });
    window.location.reload();
  };

  const bankLedgers = accountingEntryService
    .getLedgers(city)
    .filter((l) => l.accountHead === "cash_bank");

  const nextInstalment = instalments.find((i) => i.status === "Pending");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Advance Tax Calculator</h1>
          <p className="text-sm text-gray-600">
            Calculate and pay advance tax instalments for FY {fy}-{(fy + 1) % 100}
          </p>
        </div>
        <div className="p-2 bg-blue-100 rounded-lg">
          <Calculator className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-4">Tax Calculator</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Annual Net Profit (₹)
            </label>
            <input
              type="number"
              min="0"
              value={estimatedProfit}
              onChange={(e) => setEstimatedProfit(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pull from P&L projection or enter manually
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
            <select
              value={taxType}
              onChange={(e) => setTaxType(e.target.value as "company" | "individual")}
              className="w-full border rounded px-3 py-2"
            >
              <option value="company">Company (26% flat including cess)</option>
              <option value="individual">Individual (slab rates)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TDS Already Deducted (₹)
            </label>
            <input
              type="number"
              min="0"
              value={tdsDeducted}
              onChange={(e) => setTdsDeducted(Number(e.target.value))}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 mb-4">Tax Liability Summary</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Estimated Profit</p>
              <p className="text-xl font-bold text-gray-900">
                ₹{estimatedProfit.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tax Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {taxType === "company" ? "26%" : "Slab"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Tax Liability</p>
              <p className="text-xl font-bold text-purple-600">
                ₹{taxLiability.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">TDS Deducted</p>
              <p className="text-xl font-bold text-green-600">
                -₹{tdsDeducted.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="border-t-2 border-blue-300 pt-4 mt-4">
            <p className="text-sm text-gray-600">Net Tax Payable (Advance Tax)</p>
            <p className="text-3xl font-bold text-blue-600">
              ₹{netTaxLiability.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Instalment Schedule */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Instalment Schedule</h2>
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Instalment
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Due Date</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  Cumulative %
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  Instalment Amount
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {instalments.map((instalment, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{instalment.no} Instalment</td>
                  <td className="px-4 py-3 text-sm">{instalment.dueDate}</td>
                  <td className="px-4 py-3 text-sm text-right">{instalment.cumulativePct}%</td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    ₹{instalment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        instalment.status === "Paid"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {instalment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {instalment.status === "Pending" && instalment.amount > 0 && (
                      <button
                        onClick={() => handlePayInstalment(index)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                      >
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Next Instalment Alert */}
      {nextInstalment && netTaxLiability > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-orange-900">Next Advance Tax Due</p>
            <p className="text-sm text-orange-700">
              {nextInstalment.no} instalment of ₹
              {nextInstalment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is due on {nextInstalment.dueDate}
            </p>
          </div>
          <button
            onClick={() =>
              handlePayInstalment(instalments.findIndex((i) => i.no === nextInstalment.no))
            }
            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
          >
            Pay Now
          </button>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">
              Pay Advance Tax - {paymentModal.instalment}
              {paymentModal.instalment === 1
                ? "st"
                : paymentModal.instalment === 2
                ? "nd"
                : paymentModal.instalment === 3
                ? "rd"
                : "th"}{" "}
              Instalment
            </h3>
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
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="text"
                value={paymentModal.dueDate}
                readOnly
                className="w-full border rounded px-3 py-2 bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank</label>
              <select
                value={paymentForm.bank}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, bank: e.target.value }))}
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
              <label className="block text-sm font-medium mb-1">UTR Number</label>
              <input
                type="text"
                value={paymentForm.utrNumber}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, utrNumber: e.target.value }))
                }
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., 123456789012"
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
                disabled={!paymentForm.bank || !paymentForm.utrNumber}
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
