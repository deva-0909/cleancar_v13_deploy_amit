import { useState, useMemo } from "react";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService, CHART_OF_ACCOUNTS_HEADS } from "../../services/accountingEntryService";
import { Download } from "lucide-react";

export function AccountsLedger() {
  const { city } = useCity();
  const [selectedAccount, setSelectedAccount] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Get ledger entries for selected account
  const ledgerEntries = useMemo(() => {
    if (!selectedAccount) return [];
    const from = dateFrom || "1900-01-01";
    const to = dateTo || "2099-12-31";
    const entries = accountingEntryService.getLedgerEntries(selectedAccount, city);
    return entries.filter((e) => e.date >= from && e.date <= to).sort((a, b) => a.date.localeCompare(b.date));
  }, [selectedAccount, dateFrom, dateTo, city]);

  // Calculate running balance
  const ledgerWithBalance = useMemo(() => {
    let runningBalance = 0;
    return ledgerEntries.map((entry) => {
      const isDebit = entry.debitAccount === selectedAccount;
      const amount = entry.totalBillValue;
      runningBalance += isDebit ? amount : -amount;
      return {
        ...entry,
        debit: isDebit ? amount : 0,
        credit: isDebit ? 0 : amount,
        balance: runningBalance,
      };
    });
  }, [ledgerEntries, selectedAccount]);

  const openingBalance = 0; // Simplified - can be enhanced
  const closingBalance = ledgerWithBalance.length > 0 ? ledgerWithBalance[ledgerWithBalance.length - 1].balance : 0;
  const totalDebit = ledgerWithBalance.reduce((sum, e) => sum + e.debit, 0);
  const totalCredit = ledgerWithBalance.reduce((sum, e) => sum + e.credit, 0);

  const exportCSV = () => {
    const headers = ["Date", "Voucher No", "Description", "Debit", "Credit", "Balance"];
    const rows = ledgerWithBalance.map((e) => [
      e.date,
      e.voucherNumber,
      e.narration || e.invoiceNumber || "-",
      e.debit.toFixed(2),
      e.credit.toFixed(2),
      e.balance.toFixed(2),
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ledger-${selectedAccount}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ledger</h1>
          <p className="text-sm text-gray-600">Account-wise passbook in ledger format</p>
        </div>
        {selectedAccount && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border rounded text-blue-600 hover:bg-blue-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded">
        <div>
          <label className="block text-sm font-medium mb-1">Account</label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Account</option>
            {["asset", "liability", "income", "expense"].map((nature) => (
              <optgroup key={nature} label={nature.toUpperCase()}>
                {CHART_OF_ACCOUNTS_HEADS.filter((h) => h.nature === nature).map((h) => (
                  <option key={h.value} value={h.value}>
                    {h.label}
                  </option>
                ))}
              </optgroup>
            ))}
            <optgroup label="PAYMENT ACCOUNTS">
              <option value="cash_bank">Cash & Bank</option>
            </optgroup>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      {!selectedAccount ? (
        <div className="text-center py-12 text-gray-500">
          <p>Select an account to view ledger</p>
        </div>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Voucher No</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Description</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Debit (₹)</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Credit (₹)</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Closing Balance (₹)</th>
              </tr>
            </thead>
            <tbody>
              {/* Opening Balance */}
              <tr className="bg-blue-50 font-bold">
                <td className="px-4 py-3" colSpan={3}>
                  Opening Balance
                </td>
                <td className="px-4 py-3 text-right">-</td>
                <td className="px-4 py-3 text-right">-</td>
                <td className="px-4 py-3 text-right">₹{openingBalance.toFixed(2)}</td>
              </tr>

              {/* Transactions */}
              {ledgerWithBalance.map((entry, idx) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{entry.date}</td>
                  <td className="px-4 py-3 text-sm font-mono">{entry.voucherNumber}</td>
                  <td className="px-4 py-3 text-sm">{entry.narration || entry.invoiceNumber || "-"}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">
                    {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-green-600">
                    {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">₹{entry.balance.toFixed(2)}</td>
                </tr>
              ))}

              {/* Closing Balance */}
              <tr className="bg-green-50 font-bold">
                <td className="px-4 py-3" colSpan={3}>
                  Closing Balance
                </td>
                <td className="px-4 py-3 text-right text-red-600">₹{totalDebit.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-green-600">₹{totalCredit.toFixed(2)}</td>
                <td className="px-4 py-3 text-right">₹{closingBalance.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {ledgerWithBalance.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions found for this account in the selected period</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
