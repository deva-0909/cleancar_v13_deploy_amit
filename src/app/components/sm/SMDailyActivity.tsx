/**
 * SMDailyActivity.tsx
 * Sales Manager — Daily Activity Report
 *
 * Covers the SM's full day:
 *   Morning  (08:00–10:00) — Plan the day
 *   Field    (10:00–17:00) — Location visits + BTL coordination
 *   Evening  (17:00–19:00) — EOD report + tomorrow's plan
 *
 * Plugs into the existing SalesManagerApp as a new tab: value="daily"
 * Reads from salesManagerService (locations, alerts, BTL, gate status)
 * Persists to localStorage under the key "SM_DAILY_REPORT_<YYYY-MM-DD>"
 */

import { useState, useMemo, useRef } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import {
  CheckCircle2, Circle, AlertTriangle, MapPin, Users,
  TrendingUp, Clock, ChevronRight, ChevronDown,
  Sun, Target, FileText, Zap, Building2,
  Phone, Star, BarChart2, Save, RotateCcw,
  CalendarCheck, Lock, Car, Bike, Camera, Receipt,
  ChevronUp, IndianRupee
} from "lucide-react";
import { toast } from "sonner";
import { salesManagerService } from "../../services/salesManagerService";
import {
  travelReimbursementService,
  type TravelTrip,
  type VehicleType,
} from "../../services/travelReimbursementService";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";

// ── Types ────────────────────────────────────────────────────────────────────

type SessionId = "morning" | "field" | "evening";

interface PlannedVisit {
  locationId: string;
  locationName: string;
  locationType: string;
  priority: "HIGH" | "MEDIUM" | "FOLLOW_UP";
  objective: string;
  plannedTime: string;
  // filled during / after visit
  actualVisitDone: boolean;
  outcome?: "Positive" | "Neutral" | "Negative" | "No Answer";
  leadsCollected: number;
  conversionAttempts: number;
  notes: string;
  durationMinutes: number;
  // Travel — linked trip for this visit
  tripId?: string; // ID of the TravelTrip record in travelReimbursementService
}

interface BTLTask {
  id: string;
  supervisorName: string;
  locationName: string;
  task: string;
  status: "Pending" | "Done" | "Escalated";
  note: string;
}

interface DailyReport {
  date: string;
  morning: {
    locked: boolean;
    priorityForDay: string;
    plannedVisits: PlannedVisit[];
    btlTasksAssigned: BTLTask[];
    openAlerts: number;
  };
  field: {
    locked: boolean;
    visitsActual: PlannedVisit[]; // same array — updated in place
    unplannedVisits: number;
    totalLeads: number;
    totalConversions: number;
    totalKm: number;
  };
  evening: {
    locked: boolean;
    dayRating: 1 | 2 | 3 | 4 | 5;
    biggestWin: string;
    biggestBlock: string;
    tomorrowTop3: string;
    escalationsRaised: number;
    submittedAt?: string;
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];
const STORAGE_KEY = `SM_DAILY_REPORT_${TODAY}`;

function loadReport(): DailyReport {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch { /* ignore */ }

  const locs = salesManagerService.getLocations();
  const atRisk = locs.filter(l => l.status === "At Risk" || l.status === "Inactive");
  const prospects = locs.filter(l => l.status === "Active Prospect");
  const alerts = salesManagerService.getAlerts().filter(a => a.actionRequired);

  // Auto-suggest visits: at-risk first, then prospects
  const suggested = [...atRisk.slice(0, 2), ...prospects.slice(0, 2)];
  const plannedVisits: PlannedVisit[] = suggested.map((loc, i) => ({
    locationId: loc.id,
    locationName: loc.name,
    locationType: loc.type,
    priority: atRisk.includes(loc) ? "HIGH" : "MEDIUM",
    objective: atRisk.includes(loc)
      ? "Re-engage — understand churn risk and propose action plan"
      : "Progress to paid — present block deal option",
    plannedTime: i === 0 ? "10:30" : i === 1 ? "12:00" : i === 2 ? "14:30" : "16:00",
    actualVisitDone: false,
    leadsCollected: 0,
    conversionAttempts: 0,
    notes: "",
    durationMinutes: 0,
  }));

  return {
    date: TODAY,
    morning: {
      locked: false,
      priorityForDay: "",
      plannedVisits,
      btlTasksAssigned: [],
      openAlerts: alerts.length,
    },
    field: { locked: false, visitsActual: plannedVisits, unplannedVisits: 0, totalLeads: 0, totalConversions: 0, totalKm: 0 },
    evening: { locked: false, dayRating: 3, biggestWin: "", biggestBlock: "", tomorrowTop3: "", escalationsRaised: 0 },
  };
}

function saveReport(r: DailyReport) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(r)); } catch { /* ignore */ }
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SessionHeader({ icon, title, time, status }: {
  icon: React.ReactNode; title: string; time: string;
  status: "locked" | "active" | "upcoming";
}) {
  const colors = {
    locked:   "bg-teal-600 text-white",
    active:   "bg-orange-500 text-white",
    upcoming: "bg-gray-100 text-gray-500",
  };
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-4 ${colors[status]}`}>
      <div className="text-lg">{icon}</div>
      <div className="flex-1">
        <p className="font-bold text-sm">{title}</p>
        <p className="text-xs opacity-80">{time}</p>
      </div>
      {status === "locked" && <Lock className="w-4 h-4 opacity-60" />}
      {status === "active" && <Zap className="w-4 h-4" />}
    </div>
  );
}

function PriorityBadge({ p }: { p: PlannedVisit["priority"] }) {
  const map = {
    HIGH: "bg-red-100 text-red-700 border-red-200",
    MEDIUM: "bg-amber-100 text-amber-700 border-amber-200",
    FOLLOW_UP: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${map[p]}`}>{p.replace("_", " ")}</span>;
}

function StarRating({ value, onChange }: { value: number; onChange: (n: 1|2|3|4|5) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onChange(n as 1|2|3|4|5)}
          className={`transition-transform hover:scale-110 ${n <= value ? "text-amber-400" : "text-gray-200"}`}>
          <Star className="w-6 h-6 fill-current" />
        </button>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SMDailyActivity() {
  const [report, setReport] = useState<DailyReport>(loadReport);
  const [openSession, setOpenSession] = useState<SessionId>("morning");
  const [saving, setSaving] = useState(false);
  const [travelRefresh, setTravelRefresh] = useState(0);

  // Context hooks for travel service
  const { currentUser } = useRole();
  const { employees } = useEmployee();
  const { city, cityInfo } = useCity();

  const gate = salesManagerService.getGateStatus();
  const locs = salesManagerService.getLocations();

  // Travel — today's trips for this SM
  const todayTrips = useMemo(() => {
    return travelReimbursementService
      .getTripsByEmployee(currentUser?.employeeId || "")
      .filter(t => t.tripDate === TODAY);
  }, [travelRefresh, currentUser?.employeeId]);

  const todayTripKm = todayTrips.reduce((s, t) => s + (t.totalKm ?? 0), 0);
  const todayTripAmt = todayTrips.reduce((s, t) => s + (t.netPayableAmount ?? 0), 0);
  const activeDraftTrip = todayTrips.find(t => t.status === "Draft");

  // Travel rate for SM (4W default)
  const rate4W = travelReimbursementService.getEffectiveRate(currentUser?.employeeId || "", "4W");
  const rate2W = travelReimbursementService.getEffectiveRate(currentUser?.employeeId || "", "2W");

  const emp = employees.find(e => e.id === currentUser?.employeeId);
  const reportingMgr = employees.find(e =>
    e.fullName === emp?.reportingManager || e.id === emp?.reportingManager
  );

  // derived
  const totalLeads = report.field.visitsActual.reduce((s, v) => s + v.leadsCollected, 0);
  const totalConversions = report.field.visitsActual.reduce((s, v) => s + v.conversionAttempts, 0);
  const visitsCompleted = report.field.visitsActual.filter(v => v.actualVisitDone).length;

  function update(fn: (r: DailyReport) => DailyReport) {
    setReport(prev => {
      const next = fn(structuredClone(prev));
      saveReport(next);
      return next;
    });
  }

  function lockMorning() {
    if (!report.morning.priorityForDay.trim()) {
      toast.error("Set today's priority before locking");
      return;
    }
    update(r => { r.morning.locked = true; return r; });
    setOpenSession("field");
    toast.success("Morning plan locked ✓ Head to the field!");
  }

  function lockField() {
    update(r => {
      r.field.locked = true;
      r.field.totalLeads = totalLeads;
      r.field.totalConversions = totalConversions;
      r.field.totalKm = todayTripKm; // pulled from travelReimbursementService
      return r;
    });
    setOpenSession("evening");
    toast.success("Field session locked ✓ Time for EOD report");
  }

  function submitEOD() {
    if (!report.evening.biggestWin.trim() || !report.evening.tomorrowTop3.trim()) {
      toast.error("Fill biggest win and tomorrow's top 3 before submitting");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      update(r => {
        r.evening.locked = true;
        r.evening.submittedAt = new Date().toISOString();
        return r;
      });
      setSaving(false);
      toast.success("Daily report submitted to Sales Head ✓");
    }, 800);
  }

  function updateVisit(idx: number, changes: Partial<PlannedVisit>) {
    update(r => {
      r.field.visitsActual[idx] = { ...r.field.visitsActual[idx], ...changes };
      return r;
    });
  }

  function addUnplannedVisit() {
    update(r => {
      const blank: PlannedVisit = {
        locationId: `UNPLANNED-${Date.now()}`,
        locationName: "",
        locationType: "Society",
        priority: "MEDIUM",
        objective: "Opportunistic visit",
        plannedTime: "--",
        actualVisitDone: true,
        leadsCollected: 0,
        conversionAttempts: 0,
        notes: "",
        durationMinutes: 0,
      };
      r.field.visitsActual.push(blank);
      r.field.unplannedVisits++;
      return r;
    });
  }

  // ── MORNING SECTION ──────────────────────────────────────────────────────

  function MorningSection() {
    const [pv, setPv] = useState(report.morning.priorityForDay);

    return (
      <div className="space-y-5">
        <SessionHeader
          icon={<Sun />}
          title="Morning Planning Session"
          time="8:00 AM – 10:00 AM"
          status={report.morning.locked ? "locked" : "active"}
        />

        {/* MTD Gate Snapshot */}
        <Card className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">MTD Gate Status</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Locations", current: gate.locationGate.current, target: 5, met: gate.locationGate.met },
              { label: "Leads", current: gate.leadGate.current, target: 30, met: gate.leadGate.met },
              { label: "Conversions", current: gate.conversionGate.current, target: 5, met: gate.conversionGate.met },
            ].map(g => (
              <div key={g.label} className={`rounded-lg p-3 text-center ${g.met ? "bg-teal-50 border border-teal-200" : "bg-red-50 border border-red-200"}`}>
                <p className="text-xs text-gray-500 mb-1">{g.label}</p>
                <p className={`text-xl font-bold ${g.met ? "text-teal-700" : "text-red-600"}`}>
                  {g.current}<span className="text-xs font-normal text-gray-400">/{g.target}</span>
                </p>
              </div>
            ))}
          </div>
          {!gate.allMet && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mt-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Gate not cleared — focus on conversions today to unlock per-conversion fees
            </p>
          )}
        </Card>

        {/* Priority for the day */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-orange-500" />
            Today's #1 Priority
          </label>
          <Input
            value={pv}
            onChange={e => { setPv(e.target.value); update(r => { r.morning.priorityForDay = e.target.value; return r; }); }}
            placeholder="e.g. Close Adajan Heights block deal — 12 vehicles pending"
            className="text-sm"
            disabled={report.morning.locked}
          />
        </div>

        {/* Open Alerts */}
        {report.morning.openAlerts > 0 && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">
              <strong>{report.morning.openAlerts} active alert(s)</strong> need action today — check Alliance Dashboard
            </p>
          </div>
        )}

        {/* Planned Visits */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-teal-600" />
            Planned Visits Today
            <span className="ml-auto text-xs text-gray-400 font-normal">Auto-suggested from at-risk + prospects</span>
          </p>
          <div className="space-y-2">
            {report.morning.plannedVisits.map((v, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 bg-white flex items-start gap-3">
                <div className="mt-0.5">
                  <Building2 className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800 truncate">{v.locationName}</p>
                    <PriorityBadge p={v.priority} />
                    <span className="text-xs text-gray-400">{v.locationType}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{v.objective}</p>
                  <p className="text-xs text-teal-600 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {v.plannedTime}
                  </p>
                </div>
              </div>
            ))}
            {report.morning.plannedVisits.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No locations suggested — all locations healthy</p>
            )}
          </div>
        </div>

        {!report.morning.locked && (
          <Button onClick={lockMorning} className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2">
            <Lock className="w-4 h-4" /> Lock Morning Plan & Head Out
          </Button>
        )}
        {report.morning.locked && (
          <div className="text-center py-2 text-sm text-teal-600 font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Morning plan locked
          </div>
        )}
      </div>
    );
  }

  // ── FIELD SECTION ────────────────────────────────────────────────────────

  function FieldSection() {
    return (
      <div className="space-y-5">
        <SessionHeader
          icon={<MapPin />}
          title="Field Execution"
          time="10:00 AM – 5:00 PM"
          status={report.field.locked ? "locked" : report.morning.locked ? "active" : "upcoming"}
        />

        {!report.morning.locked && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Lock the Morning Plan first before updating field activity
          </div>
        )}

        {/* Today's Trips mini-summary */}
        {todayTrips.length > 0 && (
          <Card className="p-3 border-purple-200 bg-purple-50/40">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-purple-700 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5" /> Today's Trips ({todayTrips.length})
              </p>
              <span className="text-sm font-bold text-purple-700">
                {todayTripKm} km · ₹{todayTripAmt.toLocaleString()}
              </span>
            </div>
            <div className="space-y-1">
              {todayTrips.map(t => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate max-w-[60%]">{t.visitLocation}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{t.totalKm ?? "—"} km</span>
                    <span className={`px-1.5 py-0.5 rounded-full border text-xs font-medium ${
                      t.status === "Draft" ? "bg-gray-100 text-gray-600 border-gray-200" :
                      t.status === "Approved" ? "bg-green-100 text-green-700 border-green-200" :
                      "bg-amber-100 text-amber-700 border-amber-200"
                    }`}>{t.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Visit Cards */}
        <div className="space-y-3">
          {report.field.visitsActual.map((visit, idx) => (
            <VisitCard
              key={visit.locationId}
              visit={visit}
              idx={idx}
              locked={report.field.locked || !report.morning.locked}
              onChange={(changes) => updateVisit(idx, changes)}
            />
          ))}
        </div>

        {/* Add unplanned visit */}
        {!report.field.locked && report.morning.locked && (
          <Button
            variant="outline"
            onClick={addUnplannedVisit}
            className="w-full border-dashed text-sm gap-1.5 text-gray-500"
          >
            <MapPin className="w-4 h-4" /> + Add Unplanned Visit
          </Button>
        )}

        {/* Field totals */}
        <Card className="p-4 bg-slate-50 border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Field Totals</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Visits Done", value: visitsCompleted, suffix: `/ ${report.field.visitsActual.length}`, color: "text-teal-700" },
              { label: "Leads Collected", value: totalLeads, suffix: "", color: "text-blue-700" },
              { label: "Conversions", value: totalConversions, suffix: "", color: "text-green-700" },
              { label: "Travel Km", value: todayTripKm, suffix: " km", color: "text-purple-700" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}<span className="text-xs font-normal text-gray-400">{s.suffix}</span></p>
              </div>
            ))}
          </div>
          {/* Travel reimbursement line */}
          {todayTripAmt > 0 && (
            <div className="mt-3 flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
              <span className="text-xs text-purple-700 flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5" />
                Travel reimbursement today
              </span>
              <span className="text-sm font-bold text-purple-700">₹{todayTripAmt.toLocaleString()}</span>
            </div>
          )}
          {activeDraftTrip && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Trip in progress — {activeDraftTrip.visitLocation}. End the trip from the visit card below.
            </div>
          )}
        </Card>

        {!report.field.locked && report.morning.locked && (
          <Button onClick={lockField} className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2">
            <Lock className="w-4 h-4" /> Lock Field Session & Start EOD
          </Button>
        )}
        {report.field.locked && (
          <div className="text-center py-2 text-sm text-orange-600 font-medium flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Field session locked
          </div>
        )}
      </div>
    );
  }

  // ── EVENING SECTION ──────────────────────────────────────────────────────

  function EveningSection() {
    const [win, setWin] = useState(report.evening.biggestWin);
    const [block, setBlock] = useState(report.evening.biggestBlock);
    const [tmr, setTmr] = useState(report.evening.tomorrowTop3);

    function syncText(field: keyof typeof report.evening, value: string) {
      update(r => { (r.evening as any)[field] = value; return r; });
    }

    return (
      <div className="space-y-5">
        <SessionHeader
          icon={<FileText />}
          title="EOD Report & Next-Day Plan"
          time="5:00 PM – 7:00 PM"
          status={report.evening.locked ? "locked" : report.field.locked ? "active" : "upcoming"}
        />

        {!report.field.locked && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Lock the Field Session first before submitting the EOD report
          </div>
        )}

        {/* Day Summary */}
        <Card className="p-4 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-200">
          <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide mb-3">Today's Numbers</p>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div><p className="text-2xl font-bold text-teal-700">{visitsCompleted}</p><p className="text-xs text-gray-500">Visits</p></div>
            <div><p className="text-2xl font-bold text-blue-700">{totalLeads}</p><p className="text-xs text-gray-500">Leads</p></div>
            <div><p className="text-2xl font-bold text-green-700">{totalConversions}</p><p className="text-xs text-gray-500">Conv.</p></div>
            <div><p className="text-2xl font-bold text-purple-700">{todayTripKm}</p><p className="text-xs text-gray-500">Km</p></div>
          </div>
          {todayTripAmt > 0 && (
            <div className="mt-3 flex items-center justify-between bg-white/70 rounded-lg px-3 py-2 border border-teal-200">
              <span className="text-xs text-purple-700 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" /> Travel reimbursement pending
              </span>
              <span className="text-sm font-bold text-purple-700">₹{todayTripAmt.toLocaleString()}</span>
            </div>
          )}
          {todayTrips.some(t => t.status === "Draft") && (
            <p className="text-xs text-amber-700 mt-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {todayTrips.filter(t => t.status === "Draft").length} trip(s) still in Draft — submit from Field section before locking
            </p>
          )}
        </Card>

        {/* Day Rating */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400" />
            How did the day go?
          </label>
          <StarRating
            value={report.evening.dayRating}
            onChange={v => update(r => { r.evening.dayRating = v; return r; })}
          />
        </div>

        {/* Biggest Win */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Biggest Win Today
          </label>
          <Textarea
            value={win}
            onChange={e => { setWin(e.target.value); syncText("biggestWin", e.target.value); }}
            placeholder="e.g. Adajan Heights agreed to a 15-vehicle block — send MOU tomorrow"
            rows={2}
            className="text-sm resize-none"
            disabled={report.evening.locked}
          />
        </div>

        {/* Biggest Block */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            Biggest Obstacle / Escalation Needed
          </label>
          <Textarea
            value={block}
            onChange={e => { setBlock(e.target.value); syncText("biggestBlock", e.target.value); }}
            placeholder="e.g. HP Vesu pump manager unavailable — needs SH intervention for second appointment"
            rows={2}
            className="text-sm resize-none"
            disabled={report.evening.locked}
          />
        </div>

        {/* Tomorrow Top 3 */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4 text-teal-600" />
            Tomorrow's Top 3 Actions
          </label>
          <Textarea
            value={tmr}
            onChange={e => { setTmr(e.target.value); syncText("tomorrowTop3", e.target.value); }}
            placeholder={"1. Follow up Adajan Heights — send MOU\n2. Visit HP Vesu pump at 11 AM with SH\n3. Call 5 warm leads from this week"}
            rows={4}
            className="text-sm resize-none"
            disabled={report.evening.locked}
          />
        </div>

        {/* Escalations */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Escalations raised today</label>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 w-7 p-0"
              onClick={() => update(r => { r.evening.escalationsRaised = Math.max(0, r.evening.escalationsRaised - 1); return r; })}
              disabled={report.evening.locked}>−</Button>
            <span className="w-6 text-center font-bold">{report.evening.escalationsRaised}</span>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0"
              onClick={() => update(r => { r.evening.escalationsRaised++; return r; })}
              disabled={report.evening.locked}>+</Button>
          </div>
        </div>

        {!report.evening.locked && report.field.locked && (
          <Button onClick={submitEOD} disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white gap-2">
            {saving ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Submitting…" : "Submit Daily Report to Sales Head"}
          </Button>
        )}

        {report.evening.locked && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-center">
            <CheckCircle2 className="w-5 h-5 text-teal-600 mx-auto mb-1" />
            <p className="text-sm font-semibold text-teal-700">Report submitted</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {report.evening.submittedAt && new Date(report.evening.submittedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        )}
      </div>
    );
  }

  // ── VISIT CARD (inline edit during field session) ────────────────────────
  // Each visit card has an embedded Trip Tracker:
  //   • If no trip linked yet → show "Start Trip" button
  //   • If trip is Draft (in progress) → show "End Trip" form
  //   • If trip is submitted/approved → show summary pill

  function VisitCard({ visit, idx, locked, onChange }: {
    visit: PlannedVisit; idx: number; locked: boolean;
    onChange: (c: Partial<PlannedVisit>) => void;
  }) {
    const [expanded, setExpanded] = useState(false);
    const [tripPanel, setTripPanel] = useState<"closed" | "start" | "end">("closed");

    // Trip state — start form
    const [vehicleType, setVehicleType] = useState<VehicleType>("4W");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [startReading, setStartReading] = useState<number | "">("");
    const [startPhotoData, setStartPhotoData] = useState("");
    const startFileRef = useRef<HTMLInputElement>(null);

    // Trip state — end form
    const [endTime, setEndTime] = useState(new Date().toTimeString().slice(0, 5));
    const [endReading, setEndReading] = useState<number | "">("");
    const [endPhotoData, setEndPhotoData] = useState("");
    const endFileRef = useRef<HTMLInputElement>(null);

    // Get linked trip if any
    const linkedTrip: TravelTrip | undefined = useMemo(() =>
      visit.tripId
        ? travelReimbursementService.getTrips().find(t => t.id === visit.tripId)
        : undefined,
      [visit.tripId, travelRefresh]
    );

    const capturePhoto = (file: File, cb: (d: string) => void) => {
      const r = new FileReader();
      r.onload = e => cb(e.target?.result as string);
      r.readAsDataURL(file);
    };

    function handleStartTrip() {
      if (!vehicleNumber.trim()) { toast.error("Vehicle number required"); return; }
      if (startReading === "")   { toast.error("Start odometer reading required"); return; }
      if (activeDraftTrip && activeDraftTrip.id !== visit.tripId) {
        toast.error("End the current trip in progress before starting a new one"); return;
      }

      let startPhotoId: string | undefined;
      if (startPhotoData) {
        const p = travelReimbursementService.savePhoto({
          tripId: "", type: "start_odometer",
          dataUrl: startPhotoData, capturedAt: new Date().toISOString(),
          fileName: `start_${Date.now()}.jpg`,
        });
        startPhotoId = p.id;
      }

      const trip = travelReimbursementService.startTrip({
        employeeId: currentUser?.employeeId || "",
        employeeName: emp?.fullName || currentUser?.name || "",
        designation: emp?.designation || "",
        cityId: city, city: cityInfo.displayName,
        reportingManagerId: reportingMgr?.id || emp?.reportingManager || "",
        reportingManagerName: reportingMgr?.fullName || emp?.reportingManager || "",
        vehicleType, vehicleNumber,
        tripDate: TODAY,
        startTime: new Date().toTimeString().slice(0, 5),
        purposeOfVisit: visit.objective || visit.locationName,
        visitLocation: visit.locationName,
        startReading: Number(startReading),
        startPhotoId,
      });

      onChange({ tripId: trip.id });
      setTripPanel("end");
      setTravelRefresh(r => r + 1);
      toast.success(`Trip started from ${visit.locationName}`);
    }

    function handleEndTrip() {
      if (!linkedTrip) return;
      if (endReading === "")  { toast.error("End odometer reading required"); return; }
      if (Number(endReading) <= linkedTrip.startReading) {
        toast.error("End reading must be greater than start reading"); return;
      }

      let endPhotoId: string | undefined;
      if (endPhotoData) {
        const p = travelReimbursementService.savePhoto({
          tripId: linkedTrip.id, type: "end_odometer",
          dataUrl: endPhotoData, capturedAt: new Date().toISOString(),
          fileName: `end_${Date.now()}.jpg`,
        });
        endPhotoId = p.id;
      }

      const updated = travelReimbursementService.endTrip(linkedTrip.id, {
        endTime,
        endReading: Number(endReading),
        outcomeOfVisit: visit.notes || visit.outcome || "Visit completed",
        endPhotoId,
      });

      // Auto-submit for approval
      travelReimbursementService.submitTrip(updated.id);
      setTripPanel("closed");
      setTravelRefresh(r => r + 1);
      toast.success(
        `Trip submitted — ${updated.totalKm} km · ₹${updated.netPayableAmount?.toLocaleString()} reimbursement`
      );
    }

    const tripStatusColor: Record<string, string> = {
      Draft:            "bg-gray-100 text-gray-600 border-gray-200",
      "Pending Manager":"bg-amber-100 text-amber-700 border-amber-200",
      "Pending HR":     "bg-blue-100 text-blue-700 border-blue-200",
      Approved:         "bg-green-100 text-green-700 border-green-200",
      Rejected:         "bg-red-100 text-red-700 border-red-200",
    };

    return (
      <div className={`border rounded-xl overflow-hidden transition-all ${visit.actualVisitDone ? "border-teal-200 bg-teal-50/40" : "border-gray-200 bg-white"}`}>
        {/* Header row */}
        <div className="flex items-center gap-3 p-3">
          <button
            disabled={locked}
            onClick={() => onChange({ actualVisitDone: !visit.actualVisitDone })}
            className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${visit.actualVisitDone ? "bg-teal-500 border-teal-500" : "border-gray-300 hover:border-teal-400"}`}
          >
            {visit.actualVisitDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${visit.actualVisitDone ? "line-through text-gray-400" : "text-gray-800"}`}>
              {visit.locationName || "New location"}
            </p>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <PriorityBadge p={visit.priority} />
              <span className="text-xs text-gray-400">{visit.plannedTime}</span>
              {/* Travel pill */}
              {linkedTrip && (
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${tripStatusColor[linkedTrip.status] ?? "bg-gray-100 text-gray-600"}`}>
                  🚗 {linkedTrip.totalKm ? `${linkedTrip.totalKm} km · ₹${linkedTrip.netPayableAmount?.toLocaleString()}` : "Trip in progress"}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => setExpanded(e => !e)} className="text-gray-400 p-1">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded panel */}
        {expanded && (
          <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-3">
            {/* Location name if unplanned */}
            {visit.locationId.startsWith("UNPLANNED") && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Location Name</label>
                <Input value={visit.locationName} onChange={e => onChange({ locationName: e.target.value })}
                  className="h-8 text-sm" disabled={locked} placeholder="e.g. Shyam Nagar Society" />
              </div>
            )}

            {/* Outcome */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Outcome</label>
              <div className="flex gap-1.5 flex-wrap">
                {(["Positive", "Neutral", "Negative", "No Answer"] as const).map(o => (
                  <button key={o} disabled={locked}
                    onClick={() => onChange({ outcome: o })}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${visit.outcome === o
                      ? o === "Positive" ? "bg-green-100 border-green-400 text-green-700"
                        : o === "Negative" ? "bg-red-100 border-red-400 text-red-700"
                        : o === "No Answer" ? "bg-gray-100 border-gray-400 text-gray-600"
                        : "bg-amber-100 border-amber-400 text-amber-700"
                      : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>
                    {o}
                  </button>
                ))}
              </div>
            </div>

            {/* Leads + Conversions + Duration */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { label: "Leads", field: "leadsCollected" as const },
                { label: "Conv. Attempts", field: "conversionAttempts" as const },
                { label: "Duration (min)", field: "durationMinutes" as const },
              ]).map(f => (
                <div key={f.field}>
                  <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                  <Input type="number" min={0} value={visit[f.field] || ""}
                    onChange={e => onChange({ [f.field]: Number(e.target.value) })}
                    className="h-8 text-sm" disabled={locked} />
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Notes</label>
              <Textarea value={visit.notes} onChange={e => onChange({ notes: e.target.value })}
                rows={2} className="text-sm resize-none" disabled={locked}
                placeholder="Key discussion points, follow-up needed…" />
            </div>

            {/* ── TRAVEL TRACKER ─────────────────────────────────────────── */}
            {!locked && (
              <div className="border border-purple-200 rounded-xl bg-purple-50/50 overflow-hidden">
                <button
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-purple-800"
                  onClick={() => setTripPanel(p => p === "closed" ? (linkedTrip?.status === "Draft" ? "end" : "start") : "closed")}
                >
                  <Car className="w-4 h-4 text-purple-600" />
                  <span className="flex-1 text-left">
                    {linkedTrip
                      ? linkedTrip.status === "Draft"
                        ? `Trip in progress — ${linkedTrip.visitLocation} · End trip`
                        : `Trip recorded: ${linkedTrip.totalKm} km · ₹${linkedTrip.netPayableAmount?.toLocaleString()}`
                      : "Log travel for this visit"}
                  </span>
                  {tripPanel !== "closed"
                    ? <ChevronUp className="w-4 h-4 text-purple-500" />
                    : <ChevronDown className="w-4 h-4 text-purple-500" />}
                </button>

                {/* ── START TRIP FORM ────────────────────────────────── */}
                {tripPanel === "start" && !linkedTrip && (
                  <div className="px-3 pb-3 border-t border-purple-200 pt-3 space-y-3 bg-white">
                    <p className="text-xs text-gray-500">Pre-filled from visit. Adjust if needed.</p>

                    {/* Vehicle type */}
                    <div className="flex gap-2">
                      {(["2W", "4W"] as VehicleType[]).map(vt => (
                        <button key={vt}
                          onClick={() => setVehicleType(vt)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-colors ${vehicleType === vt ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-500"}`}
                        >
                          {vt === "2W" ? <Bike className="w-3.5 h-3.5" /> : <Car className="w-3.5 h-3.5" />}
                          {vt} &nbsp;<span className="opacity-60">₹{vt === "2W" ? rate2W : rate4W}/km</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Vehicle No. *</label>
                        <Input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                          className="h-8 text-sm" placeholder="GJ05AB1234" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Start Odometer *</label>
                        <Input type="number" min={0} value={startReading}
                          onChange={e => setStartReading(Number(e.target.value))}
                          className="h-8 text-sm" placeholder="km" />
                      </div>
                    </div>

                    {/* Start photo */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Start Odometer Photo</label>
                      <input ref={startFileRef} type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={e => e.target.files?.[0] && capturePhoto(e.target.files[0], setStartPhotoData)} />
                      {startPhotoData ? (
                        <div className="relative">
                          <img src={startPhotoData} alt="Start" className="w-full h-24 object-cover rounded-lg border" />
                          <button onClick={() => setStartPhotoData("")}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => startFileRef.current?.click()}
                          className="w-full h-16 border-2 border-dashed border-purple-200 rounded-lg flex items-center justify-center gap-2 text-xs text-purple-500 hover:bg-purple-50">
                          <Camera className="w-4 h-4" /> Capture odometer
                        </button>
                      )}
                    </div>

                    <Button onClick={handleStartTrip}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm h-9 gap-1.5">
                      <Car className="w-4 h-4" /> Start Trip
                    </Button>
                  </div>
                )}

                {/* ── END TRIP FORM ──────────────────────────────────── */}
                {(tripPanel === "end" || (linkedTrip?.status === "Draft" && tripPanel !== "start")) && linkedTrip && (
                  <div className="px-3 pb-3 border-t border-purple-200 pt-3 space-y-3 bg-white">
                    <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                      Started at <strong>{linkedTrip.startTime}</strong> · Odo start: <strong>{linkedTrip.startReading} km</strong>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">End Time *</label>
                        <Input type="time" value={endTime}
                          onChange={e => setEndTime(e.target.value)} className="h-8 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">End Odometer *</label>
                        <Input type="number" min={linkedTrip.startReading + 1} value={endReading}
                          onChange={e => setEndReading(Number(e.target.value))}
                          className="h-8 text-sm" placeholder={`> ${linkedTrip.startReading}`} />
                      </div>
                    </div>

                    {/* Live estimate */}
                    {endReading !== "" && Number(endReading) > linkedTrip.startReading && (
                      <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                        <span className="text-xs text-purple-700">{Number(endReading) - linkedTrip.startReading} km</span>
                        <span className="text-sm font-bold text-purple-700">
                          ₹{Math.round((Number(endReading) - linkedTrip.startReading) * linkedTrip.ratePerKm).toLocaleString()} est.
                        </span>
                      </div>
                    )}

                    {/* End photo */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">End Odometer Photo</label>
                      <input ref={endFileRef} type="file" accept="image/*" capture="environment" className="hidden"
                        onChange={e => e.target.files?.[0] && capturePhoto(e.target.files[0], setEndPhotoData)} />
                      {endPhotoData ? (
                        <div className="relative">
                          <img src={endPhotoData} alt="End" className="w-full h-24 object-cover rounded-lg border" />
                          <button onClick={() => setEndPhotoData("")}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">✕</button>
                        </div>
                      ) : (
                        <button onClick={() => endFileRef.current?.click()}
                          className="w-full h-16 border-2 border-dashed border-purple-200 rounded-lg flex items-center justify-center gap-2 text-xs text-purple-500 hover:bg-purple-50">
                          <Camera className="w-4 h-4" /> Capture odometer
                        </button>
                      )}
                    </div>

                    <Button onClick={handleEndTrip}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm h-9 gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> End Trip & Submit for Approval
                    </Button>
                  </div>
                )}

                {/* ── SUBMITTED SUMMARY ─────────────────────────────── */}
                {linkedTrip && linkedTrip.status !== "Draft" && tripPanel === "closed" && (
                  <div className="px-3 pb-3 pt-1">
                    <div className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-purple-100">
                      <span className="text-gray-500">{linkedTrip.vehicleNumber} · {linkedTrip.vehicleType}</span>
                      <span className="text-gray-500">{linkedTrip.startReading}→{linkedTrip.endReading} km</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full border text-xs ${tripStatusColor[linkedTrip.status] ?? ""}`}>
                        {linkedTrip.status}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Show read-only trip summary when field is locked */}
            {locked && linkedTrip && (
              <div className="flex items-center justify-between text-xs bg-purple-50 rounded-lg px-3 py-2 border border-purple-100">
                <span className="text-purple-700 flex items-center gap-1"><Car className="w-3 h-3" /> {linkedTrip.totalKm} km</span>
                <span className="font-bold text-purple-700">₹{linkedTrip.netPayableAmount?.toLocaleString()}</span>
                <span className={`px-2 py-0.5 rounded-full border text-xs ${tripStatusColor[linkedTrip.status] ?? ""}`}>{linkedTrip.status}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── RENDER ───────────────────────────────────────────────────────────────

  const sessionProgress = [
    { id: "morning" as SessionId, label: "Morning", done: report.morning.locked },
    { id: "field"   as SessionId, label: "Field",   done: report.field.locked },
    { id: "evening" as SessionId, label: "EOD",     done: report.evening.locked },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Daily Activity Report</h2>
            <p className="text-xs text-gray-400 mt-0.5">{fmt(TODAY)}</p>
          </div>
          {report.evening.locked && (
            <Badge className="bg-teal-100 text-teal-700 border-teal-200">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Submitted
            </Badge>
          )}
        </div>

        {/* Session progress pills */}
        <div className="flex gap-2 mt-4">
          {sessionProgress.map((s, i) => (
            <button key={s.id} onClick={() => setOpenSession(s.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${openSession === s.id
                ? "border-teal-500 bg-teal-50 text-teal-700"
                : s.done
                  ? "border-teal-200 bg-teal-50/50 text-teal-600"
                  : "border-gray-200 bg-white text-gray-400"}`}>
              {s.done
                ? <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                : <Circle className="w-3.5 h-3.5" />}
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active session */}
      <div className="min-h-[400px]">
        {openSession === "morning" && <MorningSection />}
        {openSession === "field"   && <FieldSection />}
        {openSession === "evening" && <EveningSection />}
      </div>
    </div>
  );
}
