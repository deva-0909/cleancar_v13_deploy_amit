/**
 * Admin Plan Management Interface
 *
 * Full CRUD interface for subscription plan administration.
 * Role-based access: SUPER_ADMIN, ADMIN, MANAGER, VIEWER
 *
 * Features:
 * - Plan tier management (create, edit, disable, delete)
 * - Base pricing configuration
 * - Duration discount editing (SUPER_ADMIN only)
 * - Add-on service management
 * - Combo offer configuration
 * - Audit log viewing
 *
 * @component
 */

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Edit,
  Trash2,
  Plus,
  Save,
  X,
  Eye,
  Archive,
  AlertCircle,
  Clock,
  Lock,
} from "lucide-react";
import { subscriptionPlansService } from "../../services/subscriptionPlansService";
import type {
  VehicleCategory,
  PlanTier,
  Addon,
  ComboOffer,
  UserRole,
  BillingDurationType,
} from "../../types/subscriptionPlans.types";
import { ROLE_PERMISSIONS } from "../../constants/subscriptionPlans.constants";
import { QuickDataVerification } from "./QuickDataVerification";

interface AdminPlanManagementProps {
  userRole?: UserRole;
}

function AdminPlanManagement({
  userRole = "ADMIN",
}: AdminPlanManagementProps) {
  const [activeTab, setActiveTab] = useState<"plans" | "addons" | "combos" | "discounts" | "audit">("plans");
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [allTiers, setAllTiers] = useState<PlanTier[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [combos, setComboOffers] = useState<ComboOffer[]>([]);

  // Plan Edit Dialog State
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<PlanTier | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<PlanTier>>({});

  // Plan Create Dialog State
  const [createPlanDialogOpen, setCreatePlanDialogOpen] = useState(false);
  const [newPlanData, setNewPlanData] = useState<Partial<PlanTier>>({
    vehicleCategoryId: "",
    name: "WATER_WASH",
    displayName: "",
    baseMonthlyPrice: 0,
    isActive: true,
  });

  // Add-on Edit State
  const [editAddonDialogOpen, setEditAddonDialogOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [addonFormData, setAddonFormData] = useState<Partial<Addon>>({});

  // Add-on Create State
  const [createAddonDialogOpen, setCreateAddonDialogOpen] = useState(false);
  const [newAddonData, setNewAddonData] = useState<Partial<Addon>>({
    name: "",
    description: "",
    price: 0,
    billingType: "PER_VISIT",
    isActive: true,
  });

  // Combo Edit/Create State
  const [editComboDialogOpen, setEditComboDialogOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboOffer | null>(null);
  const [comboFormData, setComboFormData] = useState<Partial<ComboOffer>>({});

  // Success/Error Messages
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<
    Array<{
      id: string;
      timestamp: Date;
      user: string;
      action: string;
      entity: string;
      details: string;
      oldValue?: string;
      newValue?: string;
    }>
  >([]);

  // Helper to add audit log
  const addAuditLog = (
    action: string,
    entity: string,
    details: string,
    oldValue?: string,
    newValue?: string
  ) => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date(),
      user: userRole,
      action,
      entity,
      details,
      oldValue,
      newValue,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Duration Discount State
  const [discountEditMode, setDiscountEditMode] = useState(false);
  const [durationDiscounts, setDurationDiscounts] = useState({
    MONTHLY: 0,
    QUARTERLY: 5,
    HALF_YEARLY: 10,
    NINE_MONTHS: 12,
    ANNUAL: 15,
  });

  const permissions = ROLE_PERMISSIONS[userRole];

  // Load initial data
  useEffect(() => {
    const loadedCategories = subscriptionPlansService.getVehicleCategories();
    setCategories(loadedCategories);

    const loadedTiers = subscriptionPlansService.getAllPlanTiers();
    setAllTiers(loadedTiers);

    const loadedAddons = subscriptionPlansService.getAddons(true); // Include inactive
    setAddons(loadedAddons);

    const loadedCombos = subscriptionPlansService.getComboOffers();
    setComboOffers(loadedCombos);
  }, []);

  // ============================================
  // PLAN TIER MANAGEMENT
  // ============================================

  const handleEditPlan = (tier: PlanTier) => {
    if (!permissions.canEditPlan) return;
    setEditingTier(tier);
    setEditFormData(tier);
    setEditDialogOpen(true);
  };

  const handleSavePlan = () => {
    if (!permissions.canEditPlan) return;

    // Recalculate cost per wash if price changed
    const updatedData = {
      ...editFormData,
      costPerWash: editFormData.baseMonthlyPrice
        ? Number((editFormData.baseMonthlyPrice / 26).toFixed(2))
        : editingTier?.costPerWash || 0,
    };

    // In production: PUT /api/admin/plan-tiers/:id

    // Update local state
    setAllTiers((prev) =>
      prev.map((t) =>
        t.id === editingTier?.id ? { ...t, ...updatedData } : t
      )
    );

    setSuccessMessage(`Plan "${editingTier?.displayName}" updated successfully`);
    setTimeout(() => setSuccessMessage(""), 3000);

    // Audit log
    addAuditLog(
      "UPDATE",
      "Plan Tier",
      `Updated ${editingTier?.displayName}`,
      `₹${editingTier?.baseMonthlyPrice}`,
      `₹${updatedData.baseMonthlyPrice}`
    );

    setEditDialogOpen(false);
    setEditingTier(null);
    setEditFormData({});
  };

  const handleCreatePlan = () => {
    if (!permissions.canCreatePlan) return;

    if (!newPlanData.vehicleCategoryId || !newPlanData.baseMonthlyPrice) {
      setErrorMessage("Please fill in all required fields");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const newTier: PlanTier = {
      id: `pt-new-${Date.now()}`,
      name: newPlanData.name as any,
      displayName: newPlanData.displayName || newPlanData.name || "",
      vehicleCategoryId: newPlanData.vehicleCategoryId,
      baseMonthlyPrice: newPlanData.baseMonthlyPrice,
      costPerWash: Number((newPlanData.baseMonthlyPrice / 26).toFixed(2)),
      washesPerMonth: 26,
      isActive: true,
      sortOrder: allTiers.length,
    };

    // In production: POST /api/admin/plan-tiers

    setAllTiers((prev) => [...prev, newTier]);
    setSuccessMessage(`Plan "${newTier.displayName}" created successfully`);
    setTimeout(() => setSuccessMessage(""), 3000);

    // Audit log
    addAuditLog(
      "CREATE",
      "Plan Tier",
      `Created ${newTier.displayName} for ${categories.find((c) => c.id === newTier.vehicleCategoryId)?.displayName}`,
      undefined,
      `₹${newTier.baseMonthlyPrice}/month`
    );

    setCreatePlanDialogOpen(false);
    setNewPlanData({
      vehicleCategoryId: "",
      name: "WATER_WASH",
      displayName: "",
      baseMonthlyPrice: 0,
      isActive: true,
    });
  };

  const handleDisablePlan = (tierId: string) => {
    if (!permissions.canDisablePlan) return;

    const tier = allTiers.find((t) => t.id === tierId);
    if (!tier) return;

    // In production: PATCH /api/admin/plan-tiers/:id { isActive: false }

    setAllTiers((prev) =>
      prev.map((t) => (t.id === tierId ? { ...t, isActive: false } : t))
    );

    setSuccessMessage(`Plan "${tier.displayName}" disabled`);
    setTimeout(() => setSuccessMessage(""), 3000);

    // Audit log
    addAuditLog(
      "DISABLE",
      "Plan Tier",
      `Disabled ${tier.displayName}`,
      "Active",
      "Disabled"
    );
  };

  const handleDeletePlan = (tierId: string) => {
    if (!permissions.canDeletePlan) return;

    const tier = allTiers.find((t) => t.id === tierId);
    if (!tier) return;

    // In production: Check for active subscribers first
    // DELETE /api/admin/plan-tiers/:id (only if no subscribers)

    setAllTiers((prev) => prev.filter((t) => t.id !== tierId));

    setSuccessMessage(`Plan "${tier.displayName}" deleted`);
    setTimeout(() => setSuccessMessage(""), 3000);

    // Audit log
    addAuditLog(
      "DELETE",
      "Plan Tier",
      `Deleted ${tier.displayName}`,
      `₹${tier.baseMonthlyPrice}`,
      undefined
    );
  };

  // ============================================
  // ADD-ON MANAGEMENT
  // ============================================

  const handleToggleAddon = (addonId: string, isActive: boolean) => {
    if (!permissions.canManageAddons) return;

    // In production: PATCH /api/admin/addons/:id { isActive }

    setAddons((prev) =>
      prev.map((a) => (a.id === addonId ? { ...a, isActive } : a))
    );

    const addon = addons.find((a) => a.id === addonId);
    setSuccessMessage(
      `Add-on "${addon?.name}" ${isActive ? "activated" : "deactivated"}`
    );
    setTimeout(() => setSuccessMessage(""), 3000);

    // Audit log
    if (addon) {
      addAuditLog(
        isActive ? "ACTIVATE" : "DEACTIVATE",
        "Add-on",
        `${isActive ? "Activated" : "Deactivated"} ${addon.name}`,
        isActive ? "Inactive" : "Active",
        isActive ? "Active" : "Inactive"
      );
    }
  };

  const handleEditAddon = (addon: Addon) => {
    if (!permissions.canManageAddons) return;
    setEditingAddon(addon);
    setAddonFormData(addon);
    setEditAddonDialogOpen(true);
  };

  const handleSaveAddon = () => {
    if (!permissions.canManageAddons) return;

    // In production: PUT /api/admin/addons/:id

    setAddons((prev) =>
      prev.map((a) =>
        a.id === editingAddon?.id ? { ...a, ...addonFormData } : a
      )
    );

    setSuccessMessage(`Add-on "${addonFormData.name}" updated successfully`);
    setTimeout(() => setSuccessMessage(""), 3000);

    // Audit log
    addAuditLog(
      "UPDATE",
      "Add-on",
      `Updated ${addonFormData.name}`,
      `₹${editingAddon?.price}`,
      `₹${addonFormData.price}`
    );

    setEditAddonDialogOpen(false);
    setEditingAddon(null);
    setAddonFormData({});
  };

  const handleCreateAddon = () => {
    if (!permissions.canManageAddons) return;

    if (!newAddonData.name || !newAddonData.price) {
      setErrorMessage("Please fill in all required fields");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const newAddon: Addon = {
      id: `addon-new-${Date.now()}`,
      name: newAddonData.name,
      description: newAddonData.description || "",
      price: newAddonData.price,
      billingType: newAddonData.billingType || "PER_VISIT",
      bestPairedWith: [],
      marginPercent: 75,
      isActive: true,
      isOperationallyConfirmed: true,
      sortOrder: addons.length,
    };

    // In production: POST /api/admin/addons

    setAddons((prev) => [...prev, newAddon]);
    setSuccessMessage(`Add-on "${newAddon.name}" created successfully`);
    setTimeout(() => setSuccessMessage(""), 3000);

    // Audit log
    addAuditLog(
      "CREATE",
      "Add-on",
      `Created ${newAddon.name}`,
      undefined,
      `₹${newAddon.price} ${newAddon.billingType === "PER_VISIT" ? "per visit" : "per month"}`
    );

    setCreateAddonDialogOpen(false);
    setNewAddonData({
      name: "",
      description: "",
      price: 0,
      billingType: "PER_VISIT",
      isActive: true,
    });
  };

  // ============================================
  // COMBO OFFER MANAGEMENT
  // ============================================

  const handleEditCombo = (combo: ComboOffer) => {
    if (!permissions.canManageCombos) return;
    setEditingCombo(combo);
    setComboFormData(combo);
    setEditComboDialogOpen(true);
  };

  const handleSaveCombo = () => {
    if (!permissions.canManageCombos) return;

    // In production: PUT /api/admin/combos/:id

    setComboOffers((prev) =>
      prev.map((c) =>
        c.id === editingCombo?.id ? { ...c, ...comboFormData } : c
      )
    );

    setSuccessMessage(`Combo "${comboFormData.name}" updated successfully`);
    setTimeout(() => setSuccessMessage(""), 3000);

    // Audit log
    addAuditLog(
      "UPDATE",
      "Combo Offer",
      `Updated ${comboFormData.name}`,
      `₹${editingCombo?.comboPrice}`,
      `₹${comboFormData.comboPrice}`
    );

    setEditComboDialogOpen(false);
    setEditingCombo(null);
    setComboFormData({});
  };

  // ============================================
  // DURATION DISCOUNT MANAGEMENT
  // ============================================

  const handleSaveDiscounts = () => {
    if (!permissions.canEditDurationDiscounts) return;

    // In production: POST /api/admin/billing-durations/discounts

    setSuccessMessage("Duration discounts updated successfully");
    setTimeout(() => setSuccessMessage(""), 3000);

    // Audit log - log each discount that changed
    const changes = Object.entries(durationDiscounts)
      .map(([key, value]) => `${key}: ${value}%`)
      .join(", ");
    addAuditLog(
      "UPDATE",
      "Duration Discounts",
      "Updated billing duration discounts",
      "Various",
      changes
    );

    setDiscountEditMode(false);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Data Verification Banner */}
        <QuickDataVerification />

        {/* Success Message */}
        {successMessage && (
          <Card className="p-4 bg-green-50 border-2 border-green-400 mb-4">
            <div className="flex items-center gap-2 text-green-800">
              <Save className="w-5 h-5" />
              <span className="font-medium">{successMessage}</span>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Card className="p-4 bg-red-50 border-2 border-red-400 mb-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          </Card>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subscription Plan Management
          </h1>
          <p className="text-gray-600">
            Manage plans, pricing, add-ons, and combo offers
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline">Role: {userRole}</Badge>
            {!permissions.canEditPlan && (
              <Badge variant="secondary">
                <Eye className="w-3 h-3 mr-1" />
                View Only
              </Badge>
            )}
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid grid-cols-5 w-full mb-6">
            <TabsTrigger value="plans">Plan Tiers</TabsTrigger>
            <TabsTrigger value="addons">Add-ons</TabsTrigger>
            <TabsTrigger value="combos">Combo Offers</TabsTrigger>
            <TabsTrigger value="discounts">
              Duration Discounts
              {!permissions.canEditDurationDiscounts && permissions.canViewAuditLog && (
                <Badge className="ml-2 text-xs" variant="secondary">Read Only</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" disabled={!permissions.canViewAuditLog}>
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB 1: PLAN TIERS ===== */}
          <TabsContent value="plans">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Plan Tiers</h2>
                {permissions.canCreatePlan && (
                  <Button
                    className="gap-2"
                    onClick={() => setCreatePlanDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Create New Plan
                  </Button>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Base Monthly Price</TableHead>
                    <TableHead>Cost per Wash</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allTiers.map((tier) => {
                    const category = categories.find(
                      (c) => c.id === tier.vehicleCategoryId
                    );
                    return (
                      <TableRow key={tier.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {category?.displayName || "Unknown"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {category?.type}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tier.displayName}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {subscriptionPlansService.formatPrice(tier.baseMonthlyPrice)}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {subscriptionPlansService.formatPrice(tier.costPerWash)}
                        </TableCell>
                        <TableCell>
                          {tier.isActive ? (
                            <Badge className="bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {permissions.canEditPlan && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditPlan(tier)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {permissions.canDisablePlan && tier.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDisablePlan(tier.id)}
                              >
                                <Archive className="w-4 h-4" />
                              </Button>
                            )}
                            {permissions.canDeletePlan && !tier.isActive && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePlan(tier.id)}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ===== TAB 2: ADD-ONS ===== */}
          <TabsContent value="addons">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Add-on Services</h2>
                {permissions.canManageAddons && (
                  <Button
                    className="gap-2"
                    onClick={() => setCreateAddonDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    Create Add-on
                  </Button>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Billing Type</TableHead>
                    <TableHead>Margin %</TableHead>
                    <TableHead>Operational Status</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addons.map((addon) => (
                    <TableRow key={addon.id}>
                      <TableCell className="font-medium">{addon.name}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-xs">
                        {addon.description}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {subscriptionPlansService.formatPrice(addon.price)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {addon.billingType === "PER_VISIT" ? "Per Visit" : "Per Month"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {addon.marginPercent}%
                      </TableCell>
                      <TableCell>
                        {addon.isOperationallyConfirmed ? (
                          <Badge className="bg-green-600">Confirmed</Badge>
                        ) : (
                          <Badge className="bg-yellow-600">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {permissions.canManageAddons ? (
                          <Switch
                            checked={addon.isActive}
                            onCheckedChange={(checked) =>
                              handleToggleAddon(addon.id, checked)
                            }
                          />
                        ) : (
                          <Badge variant={addon.isActive ? "default" : "secondary"}>
                            {addon.isActive ? "Yes" : "No"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {permissions.canManageAddons && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAddon(addon)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* ===== TAB 3: COMBO OFFERS ===== */}
          <TabsContent value="combos">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Combo Offers</h2>
                {permissions.canManageCombos && (
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Combo
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {combos.map((combo) => (
                  <Card key={combo.id} className="p-6 border-2">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">
                          {combo.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {combo.description}
                        </p>
                      </div>
                      {permissions.canManageCombos && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCombo(combo)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Normal Price:</span>
                        <span className="line-through">
                          {subscriptionPlansService.formatPrice(combo.normalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Combo Price:</span>
                        <span className="font-bold text-green-700">
                          {subscriptionPlansService.formatPrice(combo.comboPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">You Save:</span>
                        <Badge className="bg-green-600">
                          {subscriptionPlansService.formatPrice(combo.savingAmount)} ({combo.savingPercent}%)
                        </Badge>
                      </div>
                      <div className="pt-2 border-t text-xs text-gray-500">
                        {combo.validityRule}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ===== TAB 4: DURATION DISCOUNTS ===== */}
          <TabsContent value="discounts">
            <Card className="p-6">
              {!permissions.canEditDurationDiscounts && (
                <Card className="mb-6 p-4 bg-orange-50 border-2 border-orange-300">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Lock className="w-5 h-5 text-orange-700" />
                    <div className="text-sm text-orange-800">
                      <span className="font-semibold">Read-Only Mode:</span> Only{" "}
                      <strong>SUPER_ADMIN</strong> can edit duration discounts.
                      Your role ({userRole}) can view these settings but cannot
                      modify them.
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold mb-1">
                    Billing Duration Discounts
                  </h2>
                  <p className="text-sm text-gray-600">
                    Configure discount percentages for longer billing durations
                  </p>
                </div>
                {permissions.canEditDurationDiscounts && (
                  <div className="flex gap-2">
                    {discountEditMode ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setDiscountEditMode(false)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSaveDiscounts}>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setDiscountEditMode(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Discounts
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(durationDiscounts).map(([duration, discount]) => (
                  <Card key={duration} className="p-6 border-2">
                    <div className="mb-4">
                      <h3 className="font-semibold mb-1">
                        {duration === "NINE_MONTHS" ? "9 Months" : duration.replace("_", " ")}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {duration === "MONTHLY" && "1 month"}
                        {duration === "QUARTERLY" && "3 months"}
                        {duration === "HALF_YEARLY" && "6 months"}
                        {duration === "NINE_MONTHS" && "9 months"}
                        {duration === "ANNUAL" && "12 months"}
                      </p>
                    </div>

                    {discountEditMode && permissions.canEditDurationDiscounts ? (
                      <div>
                        <Label htmlFor={`discount-${duration}`}>
                          Discount Percentage
                        </Label>
                        <Input
                          id={`discount-${duration}`}
                          type="number"
                          min="0"
                          max="50"
                          value={discount}
                          onChange={(e) =>
                            setDurationDiscounts((prev) => ({
                              ...prev,
                              [duration]: Number(e.target.value),
                            }))
                          }
                          className="mt-2"
                        />
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-700">
                          {discount}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          {discount === 0 ? "No discount" : "Discount"}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              {permissions.canEditDurationDiscounts && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-700 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Important</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Changing discounts affects NEW subscriptions only</li>
                        <li>Existing subscribers keep their original pricing</li>
                        <li>All changes are logged in the audit trail</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* ===== TAB 5: AUDIT LOG ===== */}
          <TabsContent value="audit">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Audit Log</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete history of all changes to subscription plans
                  </p>
                </div>
                <Badge variant="outline">{auditLogs.length} entries</Badge>
              </div>

              {auditLogs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-2">
                    <Clock className="w-12 h-12 mx-auto mb-3" />
                  </div>
                  <p className="text-gray-600">
                    No changes recorded yet. All plan modifications will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <Card
                      key={log.id}
                      className="p-4 border-l-4 border-l-purple-500"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              className={
                                log.action === "CREATE"
                                  ? "bg-green-600"
                                  : log.action === "UPDATE"
                                  ? "bg-blue-600"
                                  : log.action === "DELETE"
                                  ? "bg-red-600"
                                  : log.action === "DISABLE"
                                  ? "bg-orange-600"
                                  : log.action === "ACTIVATE"
                                  ? "bg-emerald-600"
                                  : "bg-gray-600"
                              }
                            >
                              {log.action}
                            </Badge>
                            <span className="font-semibold text-gray-900">
                              {log.entity}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.user}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-700 mb-2">
                            {log.details}
                          </p>

                          {(log.oldValue || log.newValue) && (
                            <div className="flex items-center gap-4 text-xs">
                              {log.oldValue && (
                                <div>
                                  <span className="text-gray-500">
                                    Old value:{" "}
                                  </span>
                                  <span className="font-mono text-red-700">
                                    {log.oldValue}
                                  </span>
                                </div>
                              )}
                              {log.oldValue && log.newValue && (
                                <span className="text-gray-400">→</span>
                              )}
                              {log.newValue && (
                                <div>
                                  <span className="text-gray-500">
                                    New value:{" "}
                                  </span>
                                  <span className="font-mono text-green-700">
                                    {log.newValue}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-right text-xs text-gray-500">
                          <div>
                            {log.timestamp.toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <div>
                            {log.timestamp.toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-700 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">About Audit Logs</p>
                    <ul className="space-y-1 list-disc list-inside">
                      <li>All changes are tracked in real-time</li>
                      <li>
                        In production, logs are stored permanently in the
                        database
                      </li>
                      <li>Currently showing session changes only (demo mode)</li>
                      <li>Logs cannot be edited or deleted by anyone</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Plan Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Plan Tier</DialogTitle>
              <DialogDescription>
                Update plan pricing and configuration
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={editFormData.displayName || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      displayName: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="baseMonthlyPrice">
                  Base Monthly Price (₹)
                </Label>
                <Input
                  id="baseMonthlyPrice"
                  type="number"
                  min="100"
                  max="10000"
                  value={editFormData.baseMonthlyPrice || ""}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      baseMonthlyPrice: Number(e.target.value),
                    }))
                  }
                  disabled={!permissions.canEditPricing}
                />
                {!permissions.canEditPricing && (
                  <p className="text-xs text-gray-500">
                    Pricing changes require SUPER_ADMIN role
                  </p>
                )}
              </div>

              {editFormData.baseMonthlyPrice && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost per wash:</span>
                    <span className="font-medium">
                      {subscriptionPlansService.formatPrice(
                        Number(
                          (editFormData.baseMonthlyPrice / 26).toFixed(2)
                        )
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSavePlan}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Plan Dialog */}
        <Dialog open={createPlanDialogOpen} onOpenChange={setCreatePlanDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Plan Tier</DialogTitle>
              <DialogDescription>
                Add a new subscription plan tier
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="newVehicleCategory">Vehicle Category *</Label>
                <Select
                  value={newPlanData.vehicleCategoryId}
                  onValueChange={(value) =>
                    setNewPlanData((prev) => ({
                      ...prev,
                      vehicleCategoryId: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.displayName} ({cat.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newPlanName">Plan Tier *</Label>
                <Select
                  value={newPlanData.name}
                  onValueChange={(value) =>
                    setNewPlanData((prev) => ({
                      ...prev,
                      name: value as any,
                      displayName:
                        value === "WATER_WASH"
                          ? "Water Wash"
                          : value === "SHAMPOO_WASH"
                          ? "Shampoo Wash"
                          : value === "SHAMPOO_WAX"
                          ? "Shampoo + Wax"
                          : "Shampoo + Polish",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WATER_WASH">Water Wash</SelectItem>
                    <SelectItem value="SHAMPOO_WASH">Shampoo Wash</SelectItem>
                    <SelectItem value="SHAMPOO_WAX">Shampoo + Wax</SelectItem>
                    <SelectItem value="SHAMPOO_POLISH">
                      Shampoo + Polish
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newBasePrice">Base Monthly Price (₹) *</Label>
                <Input
                  id="newBasePrice"
                  type="number"
                  min="100"
                  max="10000"
                  value={newPlanData.baseMonthlyPrice || ""}
                  onChange={(e) =>
                    setNewPlanData((prev) => ({
                      ...prev,
                      baseMonthlyPrice: Number(e.target.value),
                    }))
                  }
                  placeholder="e.g., 699"
                />
                {newPlanData.baseMonthlyPrice > 0 && (
                  <p className="text-sm text-gray-600">
                    Cost per wash: ₹
                    {(newPlanData.baseMonthlyPrice / 26).toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreatePlanDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePlan}>
                <Plus className="w-4 h-4 mr-2" />
                Create Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Add-on Dialog */}
        <Dialog open={editAddonDialogOpen} onOpenChange={setEditAddonDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Add-on Service</DialogTitle>
              <DialogDescription>Update add-on details</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="addonName">Service Name</Label>
                <Input
                  id="addonName"
                  value={addonFormData.name || ""}
                  onChange={(e) =>
                    setAddonFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="addonDescription">Description</Label>
                <Input
                  id="addonDescription"
                  value={addonFormData.description || ""}
                  onChange={(e) =>
                    setAddonFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="addonPrice">Price (₹)</Label>
                <Input
                  id="addonPrice"
                  type="number"
                  min="0"
                  value={addonFormData.price || ""}
                  onChange={(e) =>
                    setAddonFormData((prev) => ({
                      ...prev,
                      price: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="addonBillingType">Billing Type</Label>
                <Select
                  value={addonFormData.billingType}
                  onValueChange={(value) =>
                    setAddonFormData((prev) => ({
                      ...prev,
                      billingType: value as "PER_VISIT" | "PER_MONTH",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_VISIT">Per Visit</SelectItem>
                    <SelectItem value="PER_MONTH">Per Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditAddonDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveAddon}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Add-on Dialog */}
        <Dialog
          open={createAddonDialogOpen}
          onOpenChange={setCreateAddonDialogOpen}
        >
          <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Add-on</DialogTitle>
              <DialogDescription>Add a new service add-on</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="newAddonName">Service Name *</Label>
                <Input
                  id="newAddonName"
                  value={newAddonData.name || ""}
                  onChange={(e) =>
                    setNewAddonData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="e.g., Engine Detailing"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newAddonDescription">Description</Label>
                <Input
                  id="newAddonDescription"
                  value={newAddonData.description || ""}
                  onChange={(e) =>
                    setNewAddonData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Service description"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newAddonPrice">Price (₹) *</Label>
                <Input
                  id="newAddonPrice"
                  type="number"
                  min="0"
                  value={newAddonData.price || ""}
                  onChange={(e) =>
                    setNewAddonData((prev) => ({
                      ...prev,
                      price: Number(e.target.value),
                    }))
                  }
                  placeholder="e.g., 299"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="newAddonBillingType">Billing Type</Label>
                <Select
                  value={newAddonData.billingType}
                  onValueChange={(value) =>
                    setNewAddonData((prev) => ({
                      ...prev,
                      billingType: value as "PER_VISIT" | "PER_MONTH",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PER_VISIT">Per Visit</SelectItem>
                    <SelectItem value="PER_MONTH">Per Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setCreateAddonDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAddon}>
                <Plus className="w-4 h-4 mr-2" />
                Create Add-on
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Combo Dialog */}
        <Dialog open={editComboDialogOpen} onOpenChange={setEditComboDialogOpen}>
          <DialogContent className="w-[95vw] sm:w-full sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Combo Offer</DialogTitle>
              <DialogDescription>Update combo offer details</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="comboName">Combo Name</Label>
                <Input
                  id="comboName"
                  value={comboFormData.name || ""}
                  onChange={(e) =>
                    setComboFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="comboDescription">Description</Label>
                <Input
                  id="comboDescription"
                  value={comboFormData.description || ""}
                  onChange={(e) =>
                    setComboFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="comboNormalPrice">Normal Price (₹)</Label>
                  <Input
                    id="comboNormalPrice"
                    type="number"
                    min="0"
                    value={comboFormData.normalPrice || ""}
                    onChange={(e) =>
                      setComboFormData((prev) => ({
                        ...prev,
                        normalPrice: Number(e.target.value),
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="comboComboPrice">Combo Price (₹)</Label>
                  <Input
                    id="comboComboPrice"
                    type="number"
                    min="0"
                    value={comboFormData.comboPrice || ""}
                    onChange={(e) =>
                      setComboFormData((prev) => ({
                        ...prev,
                        comboPrice: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              {comboFormData.normalPrice &&
                comboFormData.comboPrice &&
                comboFormData.normalPrice > comboFormData.comboPrice && (
                  <div className="p-3 bg-green-50 rounded-lg text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Savings:</span>
                      <span className="font-bold text-green-700">
                        ₹
                        {comboFormData.normalPrice - comboFormData.comboPrice} (
                        {(
                          ((comboFormData.normalPrice -
                            comboFormData.comboPrice) /
                            comboFormData.normalPrice) *
                          100
                        ).toFixed(1)}
                        %)
                      </span>
                    </div>
                  </div>
                )}

              <div className="grid gap-2">
                <Label htmlFor="comboValidityRule">Validity Rule</Label>
                <Input
                  id="comboValidityRule"
                  value={comboFormData.validityRule || ""}
                  onChange={(e) =>
                    setComboFormData((prev) => ({
                      ...prev,
                      validityRule: e.target.value,
                    }))
                  }
                  placeholder="e.g., Same household"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditComboDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveCombo}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default AdminPlanManagement;
