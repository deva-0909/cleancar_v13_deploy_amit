/**
 * IncentiveVisibilityAdmin.tsx
 *
 * Super Admin control panel for activating / deactivating the Incentive screen
 * per role or per individual employee.
 *
 * Reads/writes via incentiveVisibilityService — no direct localStorage here.
 *
 * Route: /admin/incentive-visibility
 * Access: Super Admin only
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Switch } from "../ui/switch";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "../ui/dialog";
import {
  Eye, EyeOff, Users, User, RefreshCw, AlertCircle,
  CheckCircle2, Shield, Clock, Info,
} from "lucide-react";
import { toast } from "sonner";
import { incentiveVisibilityService } from "../../services/incentiveVisibilityService";
import type { IncentiveVisibilityConfig } from "../../services/incentiveVisibilityService";
import { useRole } from "../../contexts/RoleContext";
import { useEmployeeData } from "../../hooks/useEmployeeData";

const ROLE_COLORS: Record<string, string> = {
  "Sales Manager": "bg-purple-100 text-purple-700 border-purple-200",
  "Sales Head":    "bg-indigo-100 text-indigo-700 border-indigo-200",
  "TSM":           "bg-blue-100 text-blue-700 border-blue-200",
  "TSE":           "bg-sky-100 text-sky-700 border-sky-200",
  "Supervisor":    "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Car Washer":    "bg-teal-100 text-teal-700 border-teal-200",
  "CCE":           "bg-orange-100 text-orange-700 border-orange-200",
};

function roleChip(role: string) {
  const cls = ROLE_COLORS[role] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {role}
    </span>
  );
}

function statusBadge(visible: boolean, isOverride = false) {
  return visible ? (
    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 gap-1 text-xs">
      <CheckCircle2 className="w-3 h-3" /> Visible{isOverride ? " (override)" : ""}
    </Badge>
  ) : (
    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 gap-1 text-xs">
      <EyeOff className="w-3 h-3" /> Hidden{isOverride ? " (override)" : ""}
    </Badge>
  );
}

export function IncentiveVisibilityAdmin() {
  const { currentUser } = useRole();
  const { employees } = useEmployeeData();

  const [config, setConfig] = useState<IncentiveVisibilityConfig>(
    incentiveVisibilityService.getConfig()
  );
  const [allRoles]  = useState<string[]>(incentiveVisibilityService.getAllRoles());
  const [tab, setTab] = useState<"roles" | "employees">("roles");
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [resetDialog, setResetDialog] = useState(false);
  const [empOverrideDialog, setEmpOverrideDialog] = useState<{
    empId: string; empName: string; empRole: string; currentVisible: boolean;
  } | null>(null);

  const updatedBy = currentUser?.name ?? "Super Admin";
  const reload = () => setConfig(incentiveVisibilityService.getConfig());
  useEffect(() => { reload(); }, []);

  const incentiveEmployees = employees.filter(
    (e: any) => allRoles.includes(e.designation || e.role)
  );

  const filteredEmployees = incentiveEmployees.filter((e: any) => {
    const role = e.designation || e.role || "";
    const name = (e.fullName || e.name || "").toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase()) ||
      (e.id || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || role === filterRole;
    return matchSearch && matchRole;
  });

  function handleRoleToggle(role: string, visible: boolean) {
    incentiveVisibilityService.setRoleVisibility(role, visible, updatedBy);
    reload();
    toast.success(`Incentive screen ${visible ? "enabled" : "disabled"} for all ${role} employees.`);
  }

  function handleEmployeeToggle(empId: string, empName: string, empRole: string) {
    const currentVisible = incentiveVisibilityService.isVisible(empRole, empId);
    setEmpOverrideDialog({ empId, empName, empRole, currentVisible });
  }

  function confirmEmployeeOverride(action: "hide" | "show" | "clear") {
    if (!empOverrideDialog) return;
    const { empId, empName, empRole } = empOverrideDialog;
    if (action === "clear") {
      incentiveVisibilityService.clearEmployeeOverride(empId, updatedBy);
      toast.success(`Removed override for ${empName} — now follows ${empRole} role default.`);
    } else {
      incentiveVisibilityService.setEmployeeVisibility(empId, action === "show", updatedBy);
      toast.success(`Incentive screen ${action === "show" ? "shown" : "hidden"} for ${empName}.`);
    }
    reload();
    setEmpOverrideDialog(null);
  }

  function handleReset() {
    incentiveVisibilityService.reset(updatedBy);
    reload();
    setResetDialog(false);
    toast.success("All incentive visibility settings reset to defaults.");
  }

  const lastUpdated = config.updatedAt
    ? new Date(config.updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  const hiddenRoles   = allRoles.filter(r => !config.roles[r]);
  const overrideCount = Object.keys(config.employees).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-semibold text-gray-900">Incentive Screen Visibility</h1>
          </div>
          <p className="text-sm text-gray-500">
            Control which roles and employees see the Incentive tab in their app.
            Employee-level settings override role defaults.
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setResetDialog(true)}>
          <RefreshCw className="w-3.5 h-3.5" /> Reset all to defaults
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Roles with Incentive Visible</p>
          <p className="text-2xl font-bold text-green-700">
            {allRoles.filter(r => config.roles[r]).length}
            <span className="text-sm font-normal text-gray-400"> / {allRoles.length}</span>
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1">Employee Overrides Active</p>
          <p className="text-2xl font-bold text-indigo-700">{overrideCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Last Updated
          </p>
          <p className="text-sm font-medium text-gray-700 mt-1">{lastUpdated}</p>
          <p className="text-xs text-gray-400">by {config.updatedBy}</p>
        </Card>
      </div>

      {hiddenRoles.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-sm">
            Incentive screen is currently <strong>hidden</strong> for:{" "}
            {hiddenRoles.join(", ")}.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["roles", "employees"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              tab === t
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "roles"
              ? <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> By Role</span>
              : <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> By Employee</span>}
          </button>
        ))}
      </div>

      {/* By Role */}
      {tab === "roles" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role-Level Defaults</CardTitle>
            <CardDescription>
              Turning off a role hides the Incentive tab for <em>all</em> employees in that role,
              unless they have an individual override.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employees Affected</TableHead>
                  <TableHead className="text-right">Toggle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRoles.map(role => {
                  const visible  = config.roles[role] ?? true;
                  const empCount = employees.filter(
                    (e: any) => (e.designation || e.role) === role
                  ).length;
                  return (
                    <TableRow key={role}>
                      <TableCell>{roleChip(role)}</TableCell>
                      <TableCell>{statusBadge(visible)}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {empCount} employee{empCount !== 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={visible}
                          onCheckedChange={(v) => handleRoleToggle(role, v)}
                          className="data-[state=checked]:bg-indigo-600"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* By Employee */}
      {tab === "employees" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Employee-Level Overrides</CardTitle>
            <CardDescription>
              Individual settings override the role default. Use to show/hide for a specific person
              without affecting others in their role.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Search by name or ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="max-w-xs text-sm"
              />
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-48 text-sm">
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {allRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-sm text-gray-400">
                No employees match this filter.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Role Default</TableHead>
                    <TableHead>Override</TableHead>
                    <TableHead>Effective</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((emp: any) => {
                    const empId   = emp.id || emp.employeeId;
                    const empRole = emp.designation || emp.role || "";
                    const empName = emp.fullName || emp.name || empId;
                    const roleDef = config.roles[empRole] ?? true;
                    const hasOverride = empId in config.employees;
                    const overrideVal = config.employees[empId];
                    const effective = incentiveVisibilityService.isVisible(empRole, empId);
                    return (
                      <TableRow key={empId}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{empName}</p>
                            <p className="text-xs text-gray-400">{empId}</p>
                          </div>
                        </TableCell>
                        <TableCell>{roleChip(empRole)}</TableCell>
                        <TableCell>{statusBadge(roleDef)}</TableCell>
                        <TableCell>
                          {hasOverride
                            ? statusBadge(overrideVal, true)
                            : <span className="text-xs text-gray-400 italic">None</span>}
                        </TableCell>
                        <TableCell>{statusBadge(effective)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline" size="sm"
                            className="text-xs h-7 px-2.5"
                            onClick={() => handleEmployeeToggle(empId, empName, empRole)}
                          >
                            {hasOverride ? "Change" : "Override"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-500">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-400" />
        Changes take effect immediately — the employee will see or lose the Incentive tab
        on their next page load or tab switch. No restart required.
      </div>

      {/* Employee override dialog */}
      <Dialog open={!!empOverrideDialog} onOpenChange={() => setEmpOverrideDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Incentive Visibility</DialogTitle>
            <DialogDescription>
              Set a personal override for <strong>{empOverrideDialog?.empName}</strong>.
              This overrides the {empOverrideDialog?.empRole} role default
              ({config.roles[empOverrideDialog?.empRole ?? ""] ? "currently visible" : "currently hidden"}).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                 onClick={() => confirmEmployeeOverride("show")}>
              <Eye className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">Force Show</p>
                <p className="text-xs text-green-600">Incentive tab always visible for this employee, regardless of role setting.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
                 onClick={() => confirmEmployeeOverride("hide")}>
              <EyeOff className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Force Hide</p>
                <p className="text-xs text-red-600">Incentive tab always hidden for this employee, regardless of role setting.</p>
              </div>
            </div>
            {empOverrideDialog?.empId && empOverrideDialog.empId in config.employees && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                   onClick={() => confirmEmployeeOverride("clear")}>
                <RefreshCw className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Remove Override</p>
                  <p className="text-xs text-gray-500">Revert to {empOverrideDialog?.empRole} role default.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpOverrideDialog(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset dialog */}
      <Dialog open={resetDialog} onOpenChange={setResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset all visibility settings?</DialogTitle>
            <DialogDescription>
              This will reset all role defaults to <strong>visible</strong> and remove all
              individual employee overrides. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset}>Yes, reset all</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
