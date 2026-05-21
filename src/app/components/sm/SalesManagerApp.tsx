/**
 * SalesManagerApp.tsx
 *
 * Sales Manager (SM) Alliance module — 7-screen app per SM Module v2.0.
 *
 * Screens:
 *   1. Alliance Dashboard   — map overview, gate status, location statuses
 *   2. Location Detail      — per-location drill-down with all 3 mechanisms
 *   3. Submit Location      — new tie-up submission form
 *   4. Supervisor View      — assignment + check-in status
 *   5. Block Subscriptions  — block deals + phased bonus tracker
 *   6. Incentive Tracker    — gate + per-conversion + activation + block bonus
 *   7. BTL Expenses         — expense claims with receipt upload
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  MapPin, Building2, QrCode, Users, Package,
  Award, Receipt, AlertTriangle, CheckCircle2,
  TrendingUp, RefreshCw, ChevronDown, ChevronUp,
  Clock, XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  salesManagerService,
  type SMLocation, type SMBlockDeal, type LocationStatus,
} from "../../services/salesManagerService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusPin(status: LocationStatus) {
  const map: Record<LocationStatus, { color: string; label: string }> = {
    "Active":          { color: "bg-green-500",  label: "Active" },
    "Active Prospect": { color: "bg-gray-400",   label: "Active Prospect" },
    "At Risk":         { color: "bg-amber-500",  label: "At Risk" },
    "Inactive":        { color: "bg-red-600",    label: "Inactive" },
    "Pending Approval":{ color: "bg-blue-400",   label: "Pending Approval" },
    "Rejected":        { color: "bg-gray-600",   label: "Rejected" },
  };
  const c = map[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2.5 h-2.5 rounded-full ${c.color} shrink-0`} />
      <span className="text-xs font-medium">{c.label}</span>
    </span>
  );
}

function mechanismBadge(m1: number, m2: number, m3: number) {
  return (
    <div className="flex gap-1 flex-wrap">
      <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">M1: {m1}</span>
      <span className="px-1.5 py-0.5 rounded text-xs bg-indigo-100 text-indigo-700">QR: {m2}</span>
      <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">WA: {m3}</span>
    </div>
  );
}

// ── Alliance Dashboard ────────────────────────────────────────────────────────

function AllianceDashboard({ onTabChange }: { onTabChange: (t: string) => void }) {
  const locs    = salesManagerService.getLocations();
  const gate    = salesManagerService.getGateStatus();
  const alerts  = salesManagerService.getAlerts().filter(a => a.actionRequired);

  const statusCounts = {
    Active: locs.filter(l => l.status === "Active").length,
    "Active Prospect": locs.filter(l => l.status === "Active Prospect").length,
    "At Risk": locs.filter(l => l.status === "At Risk").length,
    Inactive: locs.filter(l => l.status === "Inactive").length,
  };

  return (
    <div className="space-y-6">
      {/* Gate status cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Location Gate", current: gate.locationGate.current, target: 5, met: gate.locationGate.met },
          { label: "Lead Gate MTD",  current: gate.leadGate.current,    target: 30, met: gate.leadGate.met },
          { label: "Conversion Gate",current: gate.conversionGate.current, target: 5, met: gate.conversionGate.met },
        ].map(g => (
          <Card key={g.label} className={`p-4 ${g.met ? "border-green-300 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <p className="text-xs text-gray-500 mb-1">{g.label}</p>
            <div className="flex items-end gap-1">
              <p className={`text-2xl font-bold ${g.met ? "text-green-700" : "text-red-700"}`}>{g.current}</p>
              <p className="text-gray-400 text-sm pb-0.5">/ {g.target}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
              <div
                className={`h-1.5 rounded-full ${g.met ? "bg-green-500" : "bg-red-400"}`}
                style={{ width: `${Math.min(100, (g.current / g.target) * 100)}%` }}
              />
            </div>
          </Card>
        ))}
      </div>

      {!gate.allMet && (
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          Gate not fully cleared — per-conversion fee not payable this month. Fixed salary only.
        </div>
      )}

      {/* Location status summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status} className="p-4 text-center">
            {statusPin(status as LocationStatus)}
            <p className="text-2xl font-bold text-gray-900 mt-2">{count}</p>
          </Card>
        ))}
      </div>

      {/* Active alerts */}
      {alerts.length > 0 && (
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            Action Required ({alerts.length})
          </h3>
          {alerts.map(a => (
            <div key={a.id} className={`p-3 rounded-lg text-sm flex items-start justify-between gap-3 ${
              a.severity === "CRITICAL" ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"
            }`}>
              <div>
                {a.locationName && <p className="font-medium">{a.locationName}</p>}
                <p className="text-gray-700">{a.message}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => {
                salesManagerService.dismissAlert(a.id);
                toast.success("Logged action");
              }}>Done</Button>
            </div>
          ))}
        </Card>
      )}

      {/* Locations overview */}
      <Card className="p-0 overflow-x-auto">
        <table className="w-full min-w-[750px] text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Location", "Type", "Status", "Leads MTD", "Conversions", "QR", "Last Activity"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {locs.map(loc => (
              <tr key={loc.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{loc.name}</p>
                  <p className="text-xs text-gray-500">{loc.contactPerson}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">{loc.type}</td>
                <td className="px-4 py-3">{statusPin(loc.status)}</td>
                <td className="px-4 py-3">{mechanismBadge(loc.leadsMTDM1, loc.leadsMTDM2, loc.leadsMTDM3)}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{loc.conversionsMTD}</span>
                  {loc.conversionRatePct > 0 && (
                    <span className="text-xs text-gray-400 ml-1">({loc.conversionRatePct}%)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {loc.qrCodeActive
                    ? <Badge className="bg-green-600 text-xs">Active</Badge>
                    : <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {loc.lastSupervisorActivity
                    ? `${Math.round((Date.now() - new Date(loc.lastSupervisorActivity).getTime()) / 3600000)}h ago`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Submit Location ───────────────────────────────────────────────────────────

function SubmitLocation() {
  const [form, setForm] = useState({
    name: "", type: "" as any, address: "", contactPerson: "", contactPhone: "",
    estimatedVehicles: "", proposedBTL: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.type || !form.address || !form.contactPerson) {
      toast.error("Please fill all required fields"); return;
    }
    setSubmitting(true);
    setTimeout(() => {
      toast.success("Location submitted for Sales Head approval", {
        description: "You will be notified within 24 hours.",
      });
      setForm({ name: "", type: "" as any, address: "", contactPerson: "", contactPhone: "",
        estimatedVehicles: "", proposedBTL: "", notes: "" });
      setSubmitting(false);
    }, 800);
  };

  return (
    <Card className="p-6 max-w-xl mx-auto space-y-4">
      <h2 className="font-semibold text-gray-900">Submit New Location for Approval</h2>
      <p className="text-xs text-gray-400">Sales Head must approve before any BTL activity begins.</p>

      {[
        { label: "Location Name *", key: "name", placeholder: "e.g. Adajan Heights Society" },
        { label: "Address *", key: "address", placeholder: "Full address" },
        { label: "Contact Person *", key: "contactPerson", placeholder: "Name & role" },
        { label: "Contact Mobile *", key: "contactPhone", placeholder: "+91 98765 XXXXX" },
        { label: "Estimated Vehicles", key: "estimatedVehicles", placeholder: "Approx. count" },
        { label: "Proposed BTL Activity", key: "proposedBTL", placeholder: "Stall / QR placement / Society notice" },
        { label: "Pitch Outcome Notes", key: "notes", placeholder: "What did the contact say?" },
      ].map(field => (
        <div key={field.key} className="space-y-1.5">
          <Label className="text-sm">{field.label}</Label>
          <Input
            placeholder={field.placeholder}
            value={(form as any)[field.key]}
            onChange={e => setForm(p => ({ ...p, [field.key]: e.target.value }))}
          />
        </div>
      ))}

      <div className="space-y-1.5">
        <Label className="text-sm">Location Type *</Label>
        <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
          <SelectContent>
            {["Society", "Corporate", "Petrol Pump", "RWA", "Shop-in-Shop"].map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
        {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
        Submit for Approval
      </Button>
    </Card>
  );
}

// ── Block Subscriptions ───────────────────────────────────────────────────────

function BlockSubscriptions() {
  const deals = salesManagerService.getBlockDeals();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-gray-900">Block Subscription Deals</h2>
        <Button size="sm" onClick={() => toast.info("Block deal submission — contact Sales Head")}>
          + Submit New Block Deal
        </Button>
      </div>

      {deals.map(deal => (
        <Card key={deal.id} className="p-5 border-2 border-purple-200">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="font-semibold">{deal.locationName}</p>
              <p className="text-xs text-gray-500">{deal.vehicleCount} vehicles · {deal.packageType} · {deal.commitmentTerm}-month</p>
            </div>
            <Badge className={
              deal.status === "Active" ? "bg-green-600" :
              deal.status === "Approved" ? "bg-blue-600" : "bg-orange-600"
            }>{deal.status}</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-500">Active Vehicles</p>
              <p className="font-bold">{deal.activeVehicles} / {deal.vehicleCount}</p>
            </div>
            <div className={`p-3 rounded ${deal.phase1Paid ? "bg-green-50" : "bg-gray-50"}`}>
              <p className="text-xs text-gray-500">Phase 1 Bonus (M1)</p>
              <p className="font-bold">
                ₹{deal.phase1Amount.toLocaleString()}
                {deal.phase1Paid && <span className="text-green-600 ml-1">✓ Paid</span>}
              </p>
            </div>
            <div className={`p-3 rounded ${deal.phase2Status === "paid" ? "bg-green-50" : "bg-blue-50"}`}>
              <p className="text-xs text-gray-500">Phase 2 (M3 pro-rata)</p>
              <p className="font-bold">₹{deal.phase2Amount.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Due {deal.phase2CheckDate}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <p className="text-xs text-gray-500">Retention Rate</p>
              <p className="font-bold">{Math.round((deal.activeVehicles / deal.vehicleCount) * 100)}%</p>
            </div>
          </div>
        </Card>
      ))}

      {deals.length === 0 && (
        <Card className="p-10 text-center text-gray-400">
          No block deals yet. Submit a deal for Sales Head approval.
        </Card>
      )}
    </div>
  );
}

// ── Incentive Tracker ─────────────────────────────────────────────────────────

function IncentiveTracker() {
  const data = salesManagerService.getIncentiveBreakdown();

  return (
    <div className="space-y-6">
      {/* Gate status */}
      <Card className={`p-5 border-2 ${data.gateStatus.allMet ? "border-green-300 bg-green-50" : "border-red-200 bg-red-50"}`}>
        <div className="flex items-center gap-2 mb-3">
          {data.gateStatus.allMet
            ? <CheckCircle2 className="w-5 h-5 text-green-600" />
            : <XCircle className="w-5 h-5 text-red-600" />}
          <h3 className="font-semibold">Gate Status — Per-Conversion Fee {data.gateStatus.allMet ? "ACTIVE ✅" : "NOT MET ❌"}</h3>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          {[
            { label: "Locations", ...data.gateStatus.locationGate },
            { label: "Leads MTD",  ...data.gateStatus.leadGate },
            { label: "Conversions",...data.gateStatus.conversionGate },
          ].map(g => (
            <div key={g.label} className={`p-3 rounded-lg ${g.met ? "bg-green-100" : "bg-red-100"}`}>
              <p className="text-xs text-gray-600">{g.label}</p>
              <p className={`font-bold ${g.met ? "text-green-700" : "text-red-700"}`}>
                {g.current} / {g.target}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Forecast */}
      <Card className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
        <p className="text-sm text-gray-600">Fixed Salary</p>
        <p className="text-3xl font-bold text-gray-900">₹{data.fixedSalary.toLocaleString()}</p>
        <p className="text-sm text-gray-600 mt-3">Variable Incentive Forecast</p>
        <p className="text-3xl font-bold text-purple-700">+ ₹{data.totalForecast.toLocaleString()}</p>
      </Card>

      {/* Breakdown */}
      <Card className="p-5">
        <h3 className="font-semibold mb-4">Incentive Breakdown</h3>
        {[
          { label: "Per-Conversion Fee (M1 tranches)", amount: data.perConversionFee,
            note: data.gateStatus.allMet ? "Gate cleared" : "Gate not met — ₹0" },
          { label: "Alliance Activation Bonus", amount: data.activationBonus,
            note: "₹500 per location at 5th paying customer" },
          { label: "Block Bonus — Phase 1 Paid",  amount: data.blockBonusM1, note: "" },
          { label: "Block Bonus — Phase 2 Forecast", amount: data.blockBonusM3Forecast, note: "Pro-rata on M3 retention" },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
            <div>
              <p className="font-medium">{row.label}</p>
              {row.note && <p className="text-xs text-gray-400">{row.note}</p>}
            </div>
            <p className={`font-bold ${row.amount > 0 ? "text-green-700" : "text-gray-400"}`}>
              {row.amount > 0 ? `₹${row.amount.toLocaleString()}` : "—"}
            </p>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── BTL Expenses ──────────────────────────────────────────────────────────────

function BTLExpenses() {
  const claims = salesManagerService.getExpenseClaims();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-semibold">BTL Expense Claims</h2>
          <p className="text-xs text-gray-400">Up to ₹4,000/month · Claims &gt;₹2,000 need Sales Head approval</p>
        </div>
        <Button size="sm" onClick={() => toast.info("Expense claim form — upload receipt to proceed")}>
          + New Claim
        </Button>
      </div>

      <div className="space-y-3">
        {claims.map(c => (
          <Card key={c.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{c.locationName}</p>
              <p className="text-xs text-gray-500">{c.activityType} · {c.activityDate}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">Receipt:</span>
                <Badge variant={c.hasReceipt ? "default" : "secondary"} className="text-xs">
                  {c.hasReceipt ? "Attached" : "Missing"}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold">₹{c.amount.toLocaleString()}</p>
              <Badge className={
                c.status === "Paid" ? "bg-green-600" :
                c.status === "Approved" ? "bg-blue-600" :
                c.status === "Rejected" ? "bg-red-600" : "bg-gray-500"
              }>{c.status}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export function SalesManagerApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const gate    = salesManagerService.getGateStatus();
  const alerts  = salesManagerService.getAlerts().filter(a => a.actionRequired);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Sales Manager App</h1>
          <p className="text-xs text-gray-500">Alliance management · Location oversight · BTL coordination</p>
        </div>
        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <Badge className="bg-red-600">{alerts.length} alerts</Badge>
          )}
          <Badge variant={gate.allMet ? "default" : "secondary"}>
            Gate: {gate.allMet ? "Cleared ✅" : "Not Met ❌"}
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-7 w-full mb-6 overflow-x-auto">
            <TabsTrigger value="dashboard" className="text-xs gap-1">
              <MapPin className="w-3 h-3 hidden sm:block" />Alliance
            </TabsTrigger>
            <TabsTrigger value="detail" className="text-xs gap-1">
              <Building2 className="w-3 h-3 hidden sm:block" />Locations
            </TabsTrigger>
            <TabsTrigger value="submit" className="text-xs gap-1">
              <MapPin className="w-3 h-3 hidden sm:block" />Submit
            </TabsTrigger>
            <TabsTrigger value="supervisor" className="text-xs gap-1">
              <Users className="w-3 h-3 hidden sm:block" />Supervisors
            </TabsTrigger>
            <TabsTrigger value="block" className="text-xs gap-1">
              <Package className="w-3 h-3 hidden sm:block" />Block Deals
            </TabsTrigger>
            <TabsTrigger value="incentive" className="text-xs gap-1">
              <Award className="w-3 h-3 hidden sm:block" />Incentives
            </TabsTrigger>
            <TabsTrigger value="expenses" className="text-xs gap-1">
              <Receipt className="w-3 h-3 hidden sm:block" />Expenses
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AllianceDashboard onTabChange={setActiveTab} />
          </TabsContent>
          <TabsContent value="detail">
            <AllianceDashboard onTabChange={setActiveTab} />
          </TabsContent>
          <TabsContent value="submit">
            <SubmitLocation />
          </TabsContent>
          <TabsContent value="supervisor">
            <Card className="p-8 text-center text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Supervisor Assignment View</p>
              <p className="text-sm mt-1">Supervisor check-in status and BTL schedule shown here.</p>
              <p className="text-xs mt-2">All assignments are auto-generated on location approval.</p>
            </Card>
          </TabsContent>
          <TabsContent value="block">
            <BlockSubscriptions />
          </TabsContent>
          <TabsContent value="incentive">
            <IncentiveTracker />
          </TabsContent>
          <TabsContent value="expenses">
            <BTLExpenses />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
