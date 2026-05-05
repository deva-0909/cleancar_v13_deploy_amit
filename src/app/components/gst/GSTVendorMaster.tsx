import { useState, useMemo } from "react";
import { Building2, Plus, Search, Download, X, Check, AlertCircle, Edit2, Ban, CheckCircle } from "lucide-react";
import { gstComplianceService, type GSTVendor, type VendorRiskLevel } from "../../services/gstComplianceService";
import { showExportMenu } from "../../utils/gstExportUtils";
import { GST_STATE_OPTIONS, GST_STATES } from "../../services/accountingEntryService";

export function GSTVendorMaster() {
  const [vendors, setVendors] = useState<GSTVendor[]>(gstComplianceService.getVendors());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRisk, setFilterRisk] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<GSTVendor | null>(null);
  const [viewingVendor, setViewingVendor] = useState<GSTVendor | null>(null);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchSearch = !searchTerm ||
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.gstin.toLowerCase().includes(searchTerm.toLowerCase());
      const matchState = !filterState || v.state === filterState;
      const matchStatus = !filterStatus || v.status === filterStatus;
      const matchRisk = !filterRisk || v.riskLevel === filterRisk;
      return matchSearch && matchState && matchStatus && matchRisk;
    });
  }, [vendors, searchTerm, filterState, filterStatus, filterRisk]);

  const states = useMemo(() => Array.from(new Set(vendors.map(v => v.state))), [vendors]);

  const handleExport = (e: React.MouseEvent) => {
    const data = filteredVendors.map(v => ({
      Name: v.name,
      GSTIN: v.gstin,
      PAN: v.pan,
      State: v.state,
      "Risk Score": v.riskScore,
      "Filing Status": v.filingStatus,
      Status: v.status,
      "Contact Person": v.contactPerson,
      Email: v.contactEmail,
      Phone: v.contactPhone
    }));
    showExportMenu(data, "gst-vendor-master", e.currentTarget as HTMLElement);
  };

  const handleSaveVendor = (vendor: GSTVendor) => {
    gstComplianceService.saveVendor(vendor);
    setVendors(gstComplianceService.getVendors());
    setShowAddForm(false);
    setEditingVendor(null);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">GST Vendor Master</h1>
            <p className="text-sm text-gray-600">Manage vendor information and GSTIN validation</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add Vendor</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or GSTIN..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <select
            value={filterState}
            onChange={e => setFilterState(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Blacklisted">Blacklisted</option>
          </select>
          <select
            value={filterRisk}
            onChange={e => setFilterRisk(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All Risk Levels</option>
            <option value="Clean">Clean</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                <th className="pb-3 font-medium">Vendor Name</th>
                <th className="pb-3 font-medium">GSTIN</th>
                <th className="pb-3 font-medium">State</th>
                <th className="pb-3 font-medium">PAN</th>
                <th className="pb-3 font-medium">Risk Score</th>
                <th className="pb-3 font-medium">Filing Status</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVendors.map(vendor => (
                <tr key={vendor.id} className="border-b border-gray-100 text-sm">
                  <td className="py-3 font-medium text-gray-900">{vendor.name}</td>
                  <td className="py-3 text-gray-700 font-mono text-xs">{vendor.gstin}</td>
                  <td className="py-3 text-gray-700">{vendor.state}</td>
                  <td className="py-3 text-gray-700 font-mono text-xs">{vendor.pan}</td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vendor.riskLevel === "Clean" ? "bg-green-100 text-green-700" :
                      vendor.riskLevel === "Medium" ? "bg-amber-100 text-amber-700" :
                      vendor.riskLevel === "High" ? "bg-orange-100 text-orange-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {vendor.riskScore}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vendor.filingStatus === "Regular Filer" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {vendor.filingStatus}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      vendor.status === "Active" ? "bg-blue-100 text-blue-700" :
                      vendor.status === "Inactive" ? "bg-gray-100 text-gray-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {vendor.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <button
                      onClick={() => setViewingVendor(vendor)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVendors.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    No vendors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddForm || editingVendor) && (
        <VendorForm
          vendor={editingVendor}
          onSave={handleSaveVendor}
          onClose={() => {
            setShowAddForm(false);
            setEditingVendor(null);
          }}
        />
      )}

      {viewingVendor && (
        <VendorDetail
          vendor={viewingVendor}
          onEdit={() => {
            setEditingVendor(viewingVendor);
            setViewingVendor(null);
          }}
          onClose={() => setViewingVendor(null)}
          onUpdate={(v) => {
            handleSaveVendor(v);
            setViewingVendor(null);
          }}
        />
      )}
    </div>
  );
}

function VendorForm({ vendor, onSave, onClose }: {
  vendor: GSTVendor | null;
  onSave: (v: GSTVendor) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<GSTVendor>>(vendor || {
    id: crypto.randomUUID(),
    name: "",
    gstin: "",
    pan: "",
    state: "",
    stateCode: "",
    address: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    vendorType: "Both",
    supplyType: "Regular",
    paymentTerms: "",
    bankAccountNumber: "",
    ifscCode: "",
    gstinValidated: false,
    riskScore: 0,
    riskLevel: "Medium",
    filingStatus: "Unknown",
    createdBy: "Current User",
    createdAt: new Date().toISOString(),
    status: "Active",
    notes: ""
  });

  const [gstinError, setGstinError] = useState("");
  const [gstinValid, setGstinValid] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(true);

  const handleGSTINBlur = () => {
    if (!formData.gstin) return;
    const validation = gstComplianceService.validateGSTIN(formData.gstin);
    if (validation.valid) {
      setGstinValid(true);
      setGstinError("");
      const riskScore = gstComplianceService.initVendorRisk(formData.gstin);
      setFormData(prev => ({
        ...prev,
        stateCode: validation.stateCode,
        gstinValidated: true,
        gstinValidatedOn: new Date().toISOString(),
        riskScore,
        riskLevel: riskScore > 70 ? "Critical" : riskScore > 50 ? "High" : riskScore > 30 ? "Medium" : "Clean"
      }));
    } else {
      setGstinValid(false);
      setGstinError(validation.error || "Invalid GSTIN");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gstinValid) {
      alert("Please fix GSTIN validation errors");
      return;
    }
    onSave(formData as GSTVendor);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {vendor ? "Edit Vendor" : "Add New Vendor"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GSTIN <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.gstin}
                  onChange={e => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  onBlur={handleGSTINBlur}
                  className={`w-full px-3 py-2 border rounded-lg text-sm pr-10 ${
                    gstinError ? "border-red-500" : gstinValid ? "border-green-500" : "border-gray-300"
                  }`}
                />
                {gstinValid && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-600" />}
                {gstinError && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-600" />}
              </div>
              {gstinError && <p className="text-xs text-red-600 mt-1">{gstinError}</p>}
              {gstinValid && (
                <p className="text-xs text-green-600 mt-1">
                  Risk Score initialized: {formData.riskScore} — {formData.riskLevel}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PAN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.pan}
                onChange={e => setFormData(prev => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.stateCode}
                onChange={e => setFormData(prev => ({ ...prev, stateCode: e.target.value, state: GST_STATES[e.target.value] || "" }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Select state</option>
                {GST_STATE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={e => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={e => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Type</label>
              <select
                value={formData.vendorType}
                onChange={e => setFormData(prev => ({ ...prev, vendorType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="GSTRegistered">GST Registered</option>
                <option value="NonRegistered">Non-Registered</option>
                <option value="SEZ">SEZ</option>
                <option value="Import">Import</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supply Type</label>
              <select
                value={formData.supplyType}
                onChange={e => setFormData(prev => ({ ...prev, supplyType: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="Regular">Regular</option>
                <option value="RCM">RCM</option>
                <option value="SEZ">SEZ</option>
                <option value="Deemed Export">Deemed Export</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                rows={2}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="approval"
              checked={requiresApproval}
              onChange={e => setRequiresApproval(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="approval" className="text-sm text-gray-700">
              Requires manager approval before activation
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              {vendor ? "Update" : "Add"} Vendor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function VendorDetail({ vendor, onEdit, onClose, onUpdate }: {
  vendor: GSTVendor;
  onEdit: () => void;
  onClose: () => void;
  onUpdate: (v: GSTVendor) => void;
}) {
  const handleStatusChange = (status: "Active" | "Inactive" | "Blacklisted") => {
    onUpdate({ ...vendor, status });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Vendor Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="text-sm text-gray-600">Vendor Name</label>
              <p className="font-medium text-gray-900">{vendor.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">GSTIN</label>
              <p className="font-mono text-sm text-gray-900">{vendor.gstin}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">PAN</label>
              <p className="font-mono text-sm text-gray-900">{vendor.pan}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">State</label>
              <p className="text-gray-900">{vendor.state} ({vendor.stateCode})</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-gray-600">Address</label>
              <p className="text-gray-900">{vendor.address}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Risk Score</label>
              <p className="font-semibold text-gray-900">{vendor.riskScore} ({vendor.riskLevel})</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Filing Status</label>
              <p className="text-gray-900">{vendor.filingStatus}</p>
            </div>
          </div>

          {/* Linked transactions */}
          {(() => {
            const linked = gstComplianceService.getTransactions()
              .filter(t => t.partyId === vendor.id);
            if (linked.length === 0) return (
              <div className="text-sm text-gray-500 italic">No transactions found for this vendor.</div>
            );
            const totalTaxable = linked.reduce((s, t) => s + t.taxableValue, 0);
            const totalITC     = linked.filter(t => t.itcEligible).reduce((s, t) => s + t.itcAmount, 0);
            return (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Linked Transactions ({linked.length}) — Total Taxable: ₹{totalTaxable.toLocaleString()} | ITC Claimed: ₹{totalITC.toLocaleString()}
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 border border-gray-200">Invoice No.</th>
                        <th className="text-left p-2 border border-gray-200">Date</th>
                        <th className="text-right p-2 border border-gray-200">Taxable (₹)</th>
                        <th className="text-right p-2 border border-gray-200">GST (₹)</th>
                        <th className="text-left p-2 border border-gray-200">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linked.slice(0, 10).map(t => (
                        <tr key={t.id} className="border-b border-gray-100">
                          <td className="p-2 font-mono">{t.invoiceNumber}</td>
                          <td className="p-2">{t.invoiceDate}</td>
                          <td className="p-2 text-right">{t.taxableValue.toLocaleString()}</td>
                          <td className="p-2 text-right">{t.totalTax.toLocaleString()}</td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              t.status === "Filed" ? "bg-purple-100 text-purple-700"
                              : t.status === "Approved" ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                            }`}>{t.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {linked.length > 10 && (
                    <p className="text-xs text-gray-500 mt-1">Showing 10 of {linked.length} transactions.</p>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusChange("Blacklisted")}
                className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
              >
                <Ban className="w-4 h-4" />
                Blacklist
              </button>
              <button
                onClick={() => handleStatusChange("Active")}
                className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Reactivate
              </button>
            </div>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
