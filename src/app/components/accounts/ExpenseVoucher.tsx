import { useState, useEffect } from "react";
import { Receipt, Save } from "lucide-react";
import { accountingEntryService, calculateGST, TDS_RATE_CHART, type ItemMaster, type LedgerMaster } from "../../services/accountingEntryService";
import { gstComplianceService, COMPANY_GST_CONFIG } from "../../services/gstComplianceService";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { toast } from "sonner";

type PaymentMode = "Cash" | "Bank" | "Credit (Partial)" | "Credit (Full)";

export function ExpenseVoucher() {
  const { city, cityId } = useCity();
  const { currentUser } = useRole();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vendorId: "",
    itemId: "",
    hsnCode: "",
    expenseLedgerId: "",
    quantity: 1,
    unitPrice: 0,
    totalAmount: 0,
    gstRate: 18 as 0 | 5 | 12 | 18 | 28 | 40,
    supplyType: "" as "INTRA_STATE" | "INTER_STATE" | "",
    cgst: 0,
    sgst: 0,
    igst: 0,
    grandTotal: 0,
    tdsSection: "",
    tdsAmount: 0,
    paymentMode: "Cash" as PaymentMode,
    amountPaidNow: 0,
    creditorLedgerId: "",
    dueDate: "",
    narration: "",
  });

  const [vendors, setVendors] = useState<LedgerMaster[]>([]);
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [expenseLedgers, setExpenseLedgers] = useState<LedgerMaster[]>([]);
  const [creditors, setCreditors] = useState<LedgerMaster[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<LedgerMaster | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemMaster | null>(null);

  useEffect(() => {
    const allLedgers = accountingEntryService.getLedgers(cityId);
    setVendors(allLedgers.filter(l => 
      l.accountHead === "accounts_payable" || 
      l.accountHead === "other_liabilities" ||
      l.type === "vendor"
    ));
    setExpenseLedgers(allLedgers.filter(l => {
      const isExpense = l.nature === "expense";
      return isExpense;
    }));
    setCreditors(allLedgers.filter(l => l.accountHead === "accounts_payable" || l.accountHead === "other_liabilities" || l.accountHead === "credit_cards"));
    setItems(accountingEntryService.getItems());
  }, [cityId]);

  useEffect(() => {
    if (formData.quantity && formData.unitPrice) {
      const totalAmount = formData.quantity * formData.unitPrice;
      setFormData(prev => ({ ...prev, totalAmount }));
    }
  }, [formData.quantity, formData.unitPrice]);

  useEffect(() => {
    if (formData.totalAmount && formData.gstRate !== undefined && formData.supplyType) {
      const supplyType = formData.supplyType as "INTRA_STATE" | "INTER_STATE" | "EXPORT" | "RCM_INTRA" | "RCM_INTER";
      const gst = gstComplianceService.calculateGST(formData.totalAmount, formData.gstRate, supplyType);
      setFormData(prev => ({
        ...prev,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
        grandTotal: gst.invoiceTotal,
      }));
    }
  }, [formData.totalAmount, formData.gstRate, formData.supplyType]);

  useEffect(() => {
    // Auto-calculate TDS
    if (formData.tdsSection && formData.totalAmount) {
      const tdsConfig = TDS_RATE_CHART.find(t => t.section === formData.tdsSection);
      if (tdsConfig) {
        const tdsAmount = Math.round(formData.totalAmount * tdsConfig.rateCompany) / 100;
        setFormData(prev => ({ ...prev, tdsAmount }));
      }
    } else {
      setFormData(prev => ({ ...prev, tdsAmount: 0 }));
    }
  }, [formData.tdsSection, formData.totalAmount]);

  useEffect(() => {
    if (formData.paymentMode === "Cash" || formData.paymentMode === "Bank") {
      setFormData(prev => ({ ...prev, amountPaidNow: prev.grandTotal }));
    }
  }, [formData.paymentMode, formData.grandTotal]);

  const handleVendorChange = (vendorId: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      setSelectedVendor(vendor);
      // Derive supply type from vendor's state vs company state
      // For simplicity, if vendor has gstin, extract state code
      let vendorStateCode = COMPANY_GST_CONFIG.stateCode;
      if (vendor.gstin && vendor.gstin.length >= 2) {
        vendorStateCode = vendor.gstin.substring(0, 2);
      }
      const supplyType = vendorStateCode === COMPANY_GST_CONFIG.stateCode ? "INTRA_STATE" : "INTER_STATE";
      setFormData(prev => ({ ...prev, vendorId, supplyType }));
    }
  };

  const handleItemChange = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      setSelectedItem(item);
      setFormData(prev => ({
        ...prev,
        itemId,
        hsnCode: item.hsnCode,
        expenseLedgerId: item.defaultExpenseLedgerId,
        gstRate: item.defaultGSTRate,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vendorId || !formData.itemId || !formData.expenseLedgerId) {
      toast.error("Please fill all required fields");
      return;
    }

    const vendor = vendors.find(v => v.id === formData.vendorId);
    const expenseLedger = expenseLedgers.find(l => l.id === formData.expenseLedgerId);
    const inputCGSTLedger = accountingEntryService.getLedgers(cityId).find(l => l.name === "Input CGST");
    const inputSGSTLedger = accountingEntryService.getLedgers(cityId).find(l => l.name === "Input SGST");
    const inputIGSTLedger = accountingEntryService.getLedgers(cityId).find(l => l.name === "Input IGST");
    const axisBankLedger = accountingEntryService.getLedgers(cityId).find(l => l.name === "Axis Bank");

    if (!vendor || !expenseLedger) {
      toast.error("Invalid vendor or expense ledger"); return;
    }

    if (formData.paymentMode === "Credit (Partial)") {
      if (formData.amountPaidNow <= 0) {
        toast.error("Amount paid now must be greater than 0 for partial payment"); return;
      }
      if (formData.amountPaidNow >= formData.grandTotal) {
        toast.error("Amount paid now must be less than grand total for partial payment. Use 'Bank' mode for full payment."); return;
      }
      if (!formData.creditorLedgerId) {
        toast.error("Creditor ledger is required for partial payment"); return;
      }
      if (!formData.dueDate) {
        toast.error("Due date is required for partial payment"); return;
      }
    }
    if (formData.paymentMode === "Credit (Full)") {
      if (!formData.creditorLedgerId) {
        toast.error("Creditor ledger is required for credit purchase"); return;
      }
      if (!formData.dueDate) {
        toast.error("Due date is required for credit purchase"); return;
      }
    }

    const existingEntries = accountingEntryService.getAllEntries(cityId);
    const fy = new Date().getMonth() >= 3
      ? `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`
      : `${new Date().getFullYear() - 1}-${String(new Date().getFullYear()).slice(-2)}`;
    const prefix = `EXP/${city.toUpperCase()}/${fy}`;
    const maxSeq = existingEntries
      .filter(e => e.voucherNumber?.startsWith(prefix))
      .map(e => parseInt(e.voucherNumber.split("/").pop() || "0", 10))
      .reduce((max, n) => Math.max(max, n), 0);
    const voucherNumber = `${prefix}/${String(maxSeq + 1).padStart(4, "0")}`;

    if ((formData.paymentMode === "Cash" || formData.paymentMode === "Bank" || formData.paymentMode === "Credit (Partial)") && !axisBankLedger) {
      toast.error("Axis Bank ledger not found. Please ensure system ledgers are initialized in Ledger Master.");
      return;
    }
    if (formData.cgst > 0 && !inputCGSTLedger) {
      toast.error("Input CGST ledger not found. Please initialize system ledgers.");
      return;
    }
    if (formData.sgst > 0 && !inputSGSTLedger) {
      toast.error("Input SGST ledger not found. Please initialize system ledgers.");
      return;
    }
    if (formData.igst > 0 && !inputIGSTLedger) {
      toast.error("Input IGST ledger not found. Please initialize system ledgers.");
      return;
    }

    // Create journal entries based on payment mode
    if (formData.paymentMode === "Cash" || formData.paymentMode === "Bank") {
      // Two entries: Purchase + Payment
      // Entry 1: Purchase
      accountingEntryService.createJournal({
        date: formData.date,
        narration: `Purchase from ${vendor.name} - ${formData.narration || selectedItem?.itemName || ""}`,
        lines: [
          { accountHead: expenseLedger.id, accountLabel: expenseLedger.name, debit: formData.totalAmount, credit: 0 },
          ...(formData.cgst > 0 ? [{ accountHead: inputCGSTLedger.id, accountLabel: "Input CGST", debit: formData.cgst, credit: 0 }] : []),
          ...(formData.sgst > 0 ? [{ accountHead: inputSGSTLedger.id, accountLabel: "Input SGST", debit: formData.sgst, credit: 0 }] : []),
          ...(formData.igst > 0 ? [{ accountHead: inputIGSTLedger.id, accountLabel: "Input IGST", debit: formData.igst, credit: 0 }] : []),
          { accountHead: vendor.id, accountLabel: vendor.name, debit: 0, credit: formData.grandTotal },
        ],
        city,
        cityId,
        createdBy: currentUser.name,
      }, city);

      // Entry 2: Payment
      accountingEntryService.createJournal({
        date: formData.date,
        narration: `Payment to ${vendor.name} via ${formData.paymentMode}`,
        lines: [
          { accountHead: vendor.id, accountLabel: vendor.name, debit: formData.grandTotal, credit: 0 },
          { accountHead: axisBankLedger.id, accountLabel: "Axis Bank", debit: 0, credit: formData.grandTotal },
        ],
        city,
        cityId,
        createdBy: currentUser.name,
      }, city);
    } else if (formData.paymentMode === "Credit (Full)") {
      // Single entry: Purchase on credit
      accountingEntryService.createJournal({
        date: formData.date,
        narration: `Purchase from ${vendor.name} on credit - Due: ${formData.dueDate} - ${formData.narration || selectedItem?.itemName || ""}`,
        lines: [
          { accountHead: expenseLedger.id, accountLabel: expenseLedger.name, debit: formData.totalAmount, credit: 0 },
          ...(formData.cgst > 0 ? [{ accountHead: inputCGSTLedger.id, accountLabel: "Input CGST", debit: formData.cgst, credit: 0 }] : []),
          ...(formData.sgst > 0 ? [{ accountHead: inputSGSTLedger.id, accountLabel: "Input SGST", debit: formData.sgst, credit: 0 }] : []),
          ...(formData.igst > 0 ? [{ accountHead: inputIGSTLedger.id, accountLabel: "Input IGST", debit: formData.igst, credit: 0 }] : []),
          { accountHead: vendor.id, accountLabel: vendor.name, debit: 0, credit: formData.grandTotal },
        ],
        city,
        cityId,
        createdBy: currentUser.name,
      }, city);
    } else if (formData.paymentMode === "Credit (Partial)") {
      const balance = formData.grandTotal - formData.amountPaidNow;
      // Single entry: Purchase with partial payment
      accountingEntryService.createJournal({
        date: formData.date,
        narration: `Purchase from ${vendor.name} - Partial payment - ${formData.narration || selectedItem?.itemName || ""}`,
        lines: [
          { accountHead: expenseLedger.id, accountLabel: expenseLedger.name, debit: formData.totalAmount, credit: 0 },
          ...(formData.cgst > 0 ? [{ accountHead: inputCGSTLedger.id, accountLabel: "Input CGST", debit: formData.cgst, credit: 0 }] : []),
          ...(formData.sgst > 0 ? [{ accountHead: inputSGSTLedger.id, accountLabel: "Input SGST", debit: formData.sgst, credit: 0 }] : []),
          ...(formData.igst > 0 ? [{ accountHead: inputIGSTLedger.id, accountLabel: "Input IGST", debit: formData.igst, credit: 0 }] : []),
          { accountHead: axisBankLedger.id, accountLabel: "Axis Bank", debit: 0, credit: formData.amountPaidNow },
          { accountHead: vendor.id, accountLabel: vendor.name, debit: 0, credit: balance },
        ],
        city,
        cityId,
        createdBy: currentUser.name,
      }, city);
    }

    // TDS entry if applicable
    // This adjusts the vendor payable: vendor owes net-of-TDS, remainder goes to TDS Payable.
    // NOTE: The expense debit was already posted in the purchase journal above — do NOT debit it again here.
    if (formData.tdsAmount > 0 && formData.tdsSection) {
      const tdsLedger = accountingEntryService.getLedgers(cityId).find(l => l.name === "TDS Payable");
      if (tdsLedger) {
        // Reverse the full vendor credit from purchase journal, then re-credit net + TDS split
        accountingEntryService.createJournal({
          date: formData.date,
          narration: `TDS u/s ${formData.tdsSection} on invoice to ${vendor.name} — TDS ₹${formData.tdsAmount.toFixed(2)} deducted at source`,
          lines: [
            // DR Vendor Payable for TDS amount (reduces what we owe them — they'll collect TDS from govt)
            { accountHead: vendor.id, accountLabel: vendor.name, debit: formData.tdsAmount, credit: 0 },
            // CR TDS Payable (our liability to deposit with income tax dept)
            { accountHead: tdsLedger.id, accountLabel: "TDS Payable", debit: 0, credit: formData.tdsAmount },
          ],
          city,
          cityId,
          createdBy: currentUser.name,
        }, city);
      } else {
        toast.warning("TDS Payable ledger not found — TDS adjustment skipped. Please initialize system ledgers.");
      }
    }

    toast.success(`Expense voucher ${voucherNumber} created successfully!`);
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      vendorId: "",
      itemId: "",
      hsnCode: "",
      expenseLedgerId: "",
      quantity: 1,
      unitPrice: 0,
      totalAmount: 0,
      gstRate: 18,
      supplyType: "",
      cgst: 0,
      sgst: 0,
      igst: 0,
      grandTotal: 0,
      tdsSection: "",
      tdsAmount: 0,
      paymentMode: "Cash",
      amountPaidNow: 0,
      creditorLedgerId: "",
      dueDate: "",
      narration: "",
    });
    setSelectedVendor(null);
    setSelectedItem(null);
  };

  const getJournalPreview = () => {
    if (!formData.vendorId || !formData.expenseLedgerId) return null;

    const vendor = vendors.find(v => v.id === formData.vendorId);
    const expenseLedger = expenseLedgers.find(l => l.id === formData.expenseLedgerId);

    if (!vendor || !expenseLedger) return null;

    const lines: string[] = [];

    if (formData.paymentMode === "Cash" || formData.paymentMode === "Bank") {
      lines.push(`[${expenseLedger.name}]    Dr   ₹${(formData?.totalAmount ?? 0).toLocaleString()}`);
      if (formData.cgst > 0) lines.push(`Input CGST          Dr   ₹${(formData?.cgst ?? 0).toLocaleString()}`);
      if (formData.sgst > 0) lines.push(`Input SGST          Dr   ₹${(formData?.sgst ?? 0).toLocaleString()}`);
      if (formData.igst > 0) lines.push(`Input IGST          Dr   ₹${(formData?.igst ?? 0).toLocaleString()}`);
      lines.push(`    To [${vendor.name}]     Cr   ₹${(formData?.grandTotal ?? 0).toLocaleString()}`);
      lines.push(`── 2nd entry (auto-posted) ──`);
      lines.push(`[${vendor.name}]            Dr   ₹${(formData?.grandTotal ?? 0).toLocaleString()}`);
      lines.push(`    To Axis Bank    Cr   ₹${(formData?.grandTotal ?? 0).toLocaleString()}`);
    } else if (formData.paymentMode === "Credit (Full)") {
      lines.push(`[${expenseLedger.name}]    Dr   ₹${(formData?.totalAmount ?? 0).toLocaleString()}`);
      if (formData.cgst > 0) lines.push(`Input CGST          Dr   ₹${(formData?.cgst ?? 0).toLocaleString()}`);
      if (formData.sgst > 0) lines.push(`Input SGST          Dr   ₹${(formData?.sgst ?? 0).toLocaleString()}`);
      if (formData.igst > 0) lines.push(`Input IGST          Dr   ₹${(formData?.igst ?? 0).toLocaleString()}`);
      lines.push(`    To [${vendor.name}]     Cr   ₹${(formData?.grandTotal ?? 0).toLocaleString()}`);
      if (formData.dueDate) lines.push(`(Due: ${formData.dueDate} — recorded on creditor ledger)`);
    } else if (formData.paymentMode === "Credit (Partial)") {
      const balance = formData.grandTotal - formData.amountPaidNow;
      lines.push(`[${expenseLedger.name}]    Dr   ₹${(formData?.totalAmount ?? 0).toLocaleString()}`);
      if (formData.cgst > 0) lines.push(`Input CGST          Dr   ₹${(formData?.cgst ?? 0).toLocaleString()}`);
      if (formData.sgst > 0) lines.push(`Input SGST          Dr   ₹${(formData?.sgst ?? 0).toLocaleString()}`);
      if (formData.igst > 0) lines.push(`Input IGST          Dr   ₹${(formData?.igst ?? 0).toLocaleString()}`);
      lines.push(`    To Axis Bank    Cr   ₹${(formData?.amountPaidNow ?? 0).toLocaleString()}`);
      lines.push(`    To [${vendor.name}]     Cr   ₹${balance.toLocaleString()}`);
    }

    if (formData.tdsAmount > 0) {
      lines.push(`── TDS Entry ──`);
      lines.push(`[${expenseLedger.name}]    Dr   ₹${(formData?.totalAmount ?? 0).toLocaleString()}`);
      lines.push(`    To [${vendor.name}]     Cr   ₹${(formData.totalAmount - formData.tdsAmount).toLocaleString()}`);
      lines.push(`    To TDS Payable (${formData.tdsSection})  Cr  ₹${(formData?.tdsAmount ?? 0).toLocaleString()}`);
    }

    return lines;
  };

  const journalPreview = getJournalPreview();

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Receipt className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Expense Voucher</h1>
            <p className="text-sm text-gray-600">Record expense with items and GST</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 bg-white border rounded-lg p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.vendorId}
                onChange={e => handleVendorChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select vendor...</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.itemId}
                onChange={e => handleItemChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select item...</option>
                {items.filter(i => i.status === "Active").map(i => (
                  <option key={i.id} value={i.id}>{i.itemName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
              <input
                type="text"
                readOnly
                value={formData.hsnCode}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expense Ledger <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.expenseLedgerId}
                onChange={e => setFormData({ ...formData, expenseLedgerId: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select ledger...</option>
                {expenseLedgers.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.accountHeadLabel})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
              <input
                type="text"
                readOnly
                value={`₹${(formData?.totalAmount ?? 0).toLocaleString()}`}
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate</label>
              <select
                value={formData.gstRate}
                onChange={e => setFormData({ ...formData, gstRate: Number(e.target.value) as any })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
                <option value={40}>40%</option>
              </select>
            </div>

            {formData.supplyType && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Supply Type</label>
                <div className={`inline-flex items-center px-3 py-2 rounded text-sm font-medium ${
                  formData.supplyType === "INTRA_STATE"
                    ? "bg-green-100 text-green-700"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {formData.supplyType === "INTRA_STATE" ? "Intra-State — CGST + SGST" : "Inter-State — IGST only"}
                </div>
              </div>
            )}

            <div className="sm:col-span-2 grid grid-cols-4 gap-3 bg-gray-50 p-4 rounded-lg">
              <div>
                <label className="block text-xs text-gray-600 mb-1">CGST</label>
                <p className="font-semibold">₹{(formData?.cgst ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">SGST</label>
                <p className="font-semibold">₹{(formData?.sgst ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">IGST</label>
                <p className="font-semibold">₹{(formData?.igst ?? 0).toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Grand Total</label>
                <p className="font-bold text-lg">₹{(formData?.grandTotal ?? 0).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TDS Section</label>
              <select
                value={formData.tdsSection}
                onChange={e => setFormData({ ...formData, tdsSection: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">None</option>
                {TDS_RATE_CHART.map(t => (
                  <option key={t.section} value={t.section}>
                    {t.section} — {t.nature} ({t.rateCompany}%)
                  </option>
                ))}
              </select>
            </div>

            {formData.tdsSection && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TDS Amount</label>
                <input
                  type="text"
                  readOnly
                  value={`₹${(formData?.tdsAmount ?? 0).toLocaleString()}`}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                value={formData.paymentMode}
                onChange={e => setFormData({ ...formData, paymentMode: e.target.value as PaymentMode })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Credit (Partial)">Credit (Partial)</option>
                <option value="Credit (Full)">Credit (Full)</option>
              </select>
            </div>

            {(formData.paymentMode === "Cash" || formData.paymentMode === "Bank" || formData.paymentMode === "Credit (Partial)") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid Now</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amountPaidNow}
                  onChange={e => setFormData({ ...formData, amountPaidNow: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}

            {(formData.paymentMode === "Credit (Full)" || formData.paymentMode === "Credit (Partial)") && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Narration</label>
              <input
                type="text"
                value={formData.narration}
                onChange={e => setFormData({ ...formData, narration: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              <Save className="w-4 h-4" />
              Submit Voucher
            </button>
          </div>
        </div>

        {/* Right: Journal Preview */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Auto Journal Entry Preview</h3>
          {journalPreview ? (
            <div className="space-y-1 font-mono text-xs">
              {journalPreview.map((line, idx) => (
                <div key={idx} className={line.startsWith("──") ? "text-gray-500 mt-2 mb-2" : ""}>
                  {line}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Fill the form to see journal preview</p>
          )}
        </div>
      </form>
    </div>
  );
}
