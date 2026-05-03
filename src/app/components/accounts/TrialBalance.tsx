import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService, CHART_OF_ACCOUNTS_HEADS } from "../../services/accountingEntryService";
import { Download } from "lucide-react";

interface AccountBalance {
  account: string;
  accountLabel: string;
  nature: string;
  openingDr: number;
  openingCr: number;
  transactionDr: number;
  transactionCr: number;
  closingDr: number;
  closingCr: number;
}

export function TrialBalance() {
  const { city } = useCity();
  const [selectedFY, setSelectedFY] = useState(() => {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`;
  });
  const [asOnDate, setAsOnDate] = useState(new Date().toISOString().split("T")[0]);

  // Calculate trial balance
  const trialBalance = useMemo(() => {
    const entries = accountingEntryService.getByDateRange("1900-01-01", asOnDate, city);
    const balances: Record<string, AccountBalance> = {};

    // Initialize all accounts
    CHART_OF_ACCOUNTS_HEADS.forEach((head) => {
      balances[head.value] = {
        account: head.value,
        accountLabel: head.label,
        nature: head.nature,
        openingDr: 0,
        openingCr: 0,
        transactionDr: 0,
        transactionCr: 0,
        closingDr: 0,
        closingCr: 0,
      };
    });

    // Calculate transactions
    entries.forEach((entry) => {
      // Debit account
      if (entry.debitAccount && balances[entry.debitAccount]) {
        balances[entry.debitAccount].transactionDr += entry.totalBillValue;
      }
      // Credit account
      if (entry.creditAccount && balances[entry.creditAccount]) {
        balances[entry.creditAccount].transactionCr += entry.totalBillValue;
      }
    });

    // Calculate closing balances
    Object.values(balances).forEach((bal) => {
      const netDebit = bal.openingDr + bal.transactionDr;
      const netCredit = bal.openingCr + bal.transactionCr;
      if (netDebit > netCredit) {
        bal.closingDr = netDebit - netCredit;
        bal.closingCr = 0;
      } else {
        bal.closingCr = netCredit - netDebit;
        bal.closingDr = 0;
      }
    });

    return Object.values(balances).filter((b) => b.transactionDr > 0 || b.transactionCr > 0);
  }, [asOnDate, city]);

  // Group by nature
  const grouped = useMemo(() => {
    const groups: Record<string, AccountBalance[]> = {
      asset: [],
      liability: [],
      income: [],
      expense: [],
    };
    trialBalance.forEach((bal) => {
      if (groups[bal.nature]) {
        groups[bal.nature].push(bal);
      }
    });
    return groups;
  }, [trialBalance]);

  // Totals
  const totals = useMemo(() => {
    return trialBalance.reduce(
      (acc, bal) => ({
        openingDr: acc.openingDr + bal.openingDr,
        openingCr: acc.openingCr + bal.openingCr,
        transactionDr: acc.transactionDr + bal.transactionDr,
        transactionCr: acc.transactionCr + bal.transactionCr,
        closingDr: acc.closingDr + bal.closingDr,
        closingCr: acc.closingCr + bal.closingCr,
      }),
      { openingDr: 0, openingCr: 0, transactionDr: 0, transactionCr: 0, closingDr: 0, closingCr: 0 }
    );
  }, [trialBalance]);

  const imbalance = Math.abs(totals.closingDr - totals.closingCr);
  const isBalanced = imbalance < 0.01; // Allow small rounding errors

  const exportCSV = () => {
    const headers = [
      "Account",
      "Opening Dr",
      "Opening Cr",
      "Transaction Dr",
      "Transaction Cr",
      "Closing Dr",
      "Closing Cr",
    ];
    const rows = trialBalance.map((b) => [
      b.accountLabel,
      b.openingDr.toFixed(2),
      b.openingCr.toFixed(2),
      b.transactionDr.toFixed(2),
      b.transactionCr.toFixed(2),
      b.closingDr.toFixed(2),
      b.closingCr.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trial-balance-${asOnDate}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trial Balance</h1>
          <p className="text-sm text-gray-600">Six-column trial balance</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 border rounded text-blue-600 hover:bg-blue-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Financial Year</label>
          <select
            value={selectedFY}
            onChange={(e) => setSelectedFY(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="24-25">2024-25</option>
            <option value="25-26">2025-26</option>
            <option value="26-27">2026-27</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">As on Date</label>
          <input
            type="date"
            value={asOnDate}
            onChange={(e) => setAsOnDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Imbalance Warning */}
      {!isBalanced && (
        <div className="p-4 bg-red-100 border border-red-400 rounded text-red-900">
          <p className="font-bold">Trial Balance is out of balance by ₹{imbalance.toFixed(2)}</p>
          <p className="text-sm">Check entries in the selected period.</p>
        </div>
      )}

      {/* Trial Balance Table */}
      <div className="border rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Account</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Opening Dr</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Opening Cr</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Transaction Dr</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Transaction Cr</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Closing Dr</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Closing Cr</th>
            </tr>
          </thead>
          <tbody>
            {/* Assets */}
            {grouped.asset.length > 0 && (
              <>
                <tr className="bg-blue-50">
                  <td className="px-4 py-2 font-bold text-sm" colSpan={7}>
                    ASSETS
                  </td>
                </tr>
                {grouped.asset.map((bal) => (
                  <tr key={bal.account} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{bal.accountLabel}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.openingDr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.openingCr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.transactionDr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.transactionCr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium">₹{bal.closingDr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium">₹{bal.closingCr.toFixed(2)}</td>
                  </tr>
                ))}
              </>
            )}

            {/* Liabilities */}
            {grouped.liability.length > 0 && (
              <>
                <tr className="bg-red-50">
                  <td className="px-4 py-2 font-bold text-sm" colSpan={7}>
                    LIABILITIES
                  </td>
                </tr>
                {grouped.liability.map((bal) => (
                  <tr key={bal.account} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{bal.accountLabel}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.openingDr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.openingCr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.transactionDr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.transactionCr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium">₹{bal.closingDr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium">₹{bal.closingCr.toFixed(2)}</td>
                  </tr>
                ))}
              </>
            )}

            {/* Income */}
            {grouped.income.length > 0 && (
              <>
                <tr className="bg-green-50">
                  <td className="px-4 py-2 font-bold text-sm" colSpan={7}>
                    INCOME
                  </td>
                </tr>
                {grouped.income.map((bal) => (
                  <tr key={bal.account} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{bal.accountLabel}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.openingDr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.openingCr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.transactionDr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.transactionCr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium">₹{bal.closingDr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium">₹{bal.closingCr.toFixed(2)}</td>
                  </tr>
                ))}
              </>
            )}

            {/* Expenses */}
            {grouped.expense.length > 0 && (
              <>
                <tr className="bg-amber-50">
                  <td className="px-4 py-2 font-bold text-sm" colSpan={7}>
                    EXPENSES
                  </td>
                </tr>
                {grouped.expense.map((bal) => (
                  <tr key={bal.account} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{bal.accountLabel}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.openingDr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.openingCr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.transactionDr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right">₹{bal.transactionCr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium">₹{bal.closingDr.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-right font-medium">₹{bal.closingCr.toFixed(2)}</td>
                  </tr>
                ))}
              </>
            )}

            {/* Grand Total */}
            <tr className="bg-gray-900 text-white font-bold">
              <td className="px-4 py-3">GRAND TOTAL</td>
              <td className="px-4 py-3 text-right">₹{totals.openingDr.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">₹{totals.openingCr.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">₹{totals.transactionDr.toFixed(2)}</td>
              <td className="px-4 py-3 text-right">₹{totals.transactionCr.toFixed(2)}</td>
              <td className={`px-4 py-3 text-right ${isBalanced ? "text-green-400" : "text-red-400"}`}>
                ₹{totals.closingDr.toFixed(2)}
              </td>
              <td className={`px-4 py-3 text-right ${isBalanced ? "text-green-400" : "text-red-400"}`}>
                ₹{totals.closingCr.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
