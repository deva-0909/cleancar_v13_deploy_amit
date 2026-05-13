import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { accountingEntryService } from "../../services/accountingEntryService";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Payable {
  journalId: string;
  creditorId: string;
  creditorName: string;
  invoiceDate: string;
  dueDate: string | null;
  amountDue: number;
  voucherNumber: string;
  isOverdue: boolean;
  daysOverdue: number;
}

export default function PayablesDashboard() {
  const { currentUser } = useRole();
  const { city, cityId } = useCity();
  const [refresh, setRefresh] = useState(0);

  // Get all credit purchase entries (unpaid payables)
  const payables = useMemo(() => {
    const allJournals = accountingEntryService.getAllJournals(cityId);
    const today = new Date().toISOString().split("T")[0];

    const payablesList: Payable[] = [];

    // Find all credit entries (where vendor is credited, meaning we owe them)
    allJournals.forEach(journal => {
      journal.lines.forEach(line => {
        // Credit to vendor = we owe them money
        if (line.credit > 0 && line.accountLabel && !line.accountLabel.includes("Bank") && !line.accountLabel.includes("Cash")) {
          // Check if this payable has been paid
          const payments = allJournals.filter(j =>
            j.lines.some(l => l.debit > 0 && l.accountLabel === line.accountLabel) &&
            j.date >= journal.date
          );

          const totalPaid = payments.reduce((sum, p) => {
            const debitLine = p.lines.find(l => l.accountLabel === line.accountLabel && l.debit > 0);
            return sum + (debitLine?.debit || 0);
          }, 0);

          const amountDue = line.credit - totalPaid;

          if (amountDue > 0.01) {
            // Extract due date from narration if present
            const dueDateMatch = journal.narration?.match(/Due:\s*(\d{4}-\d{2}-\d{2})/);
            const dueDate = dueDateMatch ? dueDateMatch[1] : null;

            const isOverdue = dueDate ? dueDate < today : false;
            const daysOverdue = isOverdue && dueDate
              ? Math.floor((new Date(today).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24))
              : 0;

            payablesList.push({
              journalId: journal.id,
              creditorId: line.accountHead,
              creditorName: line.accountLabel,
              invoiceDate: journal.date,
              dueDate,
              amountDue,
              voucherNumber: journal.narration?.split(" ")[0] || journal.id.slice(0, 8),
              isOverdue,
              daysOverdue,
            });
          }
        }
      });
    });

    // Sort by due date (overdue first, then by date)
    return payablesList.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return a.invoiceDate.localeCompare(b.invoiceDate);
    });
  }, [cityId, refresh]);

  const totalOutstanding = payables.reduce((sum, p) => sum + p.amountDue, 0);
  const overduePayables = payables.filter(p => p.isOverdue);

  const handlePayNow = (payable: Payable) => {
    const bankLedger = accountingEntryService.getLedgers(cityId).find(l => l.name === "Axis Bank");
    if (!bankLedger) {
      toast.error("Axis Bank ledger not found"); return;
    }
    accountingEntryService.createJournal({
      date: new Date().toISOString().split("T")[0],
      narration: `Payment — ${payable.creditorName} — against ${payable.voucherNumber}`,
      lines: [
        { accountHead: payable.creditorId, accountLabel: payable.creditorName, debit: payable.amountDue, credit: 0 },
        { accountHead: bankLedger.id,      accountLabel: "Axis Bank",           debit: 0, credit: payable.amountDue },
      ],
      city, cityId, createdBy: currentUser?.name || "Accounts",
    }, city);
    toast.success(`Payment of ₹${(payable?.amountDue ?? 0).toLocaleString()} recorded for ${payable.creditorName}`);
    setRefresh(r => r + 1);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Payables Dashboard</h1>
        <div className="text-sm text-gray-500">
          Total Outstanding: <span className="font-bold text-red-700">₹{totalOutstanding.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {overduePayables.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="text-sm text-red-700">
            <strong>{overduePayables.length} overdue payable{overduePayables.length > 1 ? "s" : ""}</strong> totalling ₹{overduePayables.reduce((s,p) => s + p.amountDue, 0).toLocaleString("en-IN")} — pay immediately.
          </span>
        </div>
      )}

      {payables.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No outstanding payables.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="p-3 font-medium">Creditor Name</th>
                <th className="p-3 font-medium">Invoice Date</th>
                <th className="p-3 font-medium">Due Date</th>
                <th className="p-3 font-medium text-right">Amount Due</th>
                <th className="p-3 font-medium">Days Overdue</th>
                <th className="p-3 font-medium">Ref</th>
                <th className="p-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {payables.map((p, i) => (
                <tr key={`${p.journalId}-${i}`} className={`border-b ${p.isOverdue ? "bg-red-50" : "hover:bg-gray-50"}`}>
                  <td className="p-3 font-medium">{p.creditorName}</td>
                  <td className="p-3 text-gray-500">{p.invoiceDate}</td>
                  <td className="p-3">
                    {p.dueDate ? (
                      <span className={p.isOverdue ? "text-red-600 font-medium" : ""}>{p.dueDate}</span>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="p-3 text-right font-semibold">₹{p.amountDue.toLocaleString("en-IN")}</td>
                  <td className="p-3">
                    {p.daysOverdue > 0 ? (
                      <Badge className="bg-red-100 text-red-700">{p.daysOverdue}d overdue</Badge>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="p-3 font-mono text-xs text-gray-500">{p.voucherNumber}</td>
                  <td className="p-3">
                    <Button size="sm" variant="outline"
                      className="text-green-700 border-green-200 hover:bg-green-50"
                      onClick={() => handlePayNow(p)}>
                      Pay Now
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
