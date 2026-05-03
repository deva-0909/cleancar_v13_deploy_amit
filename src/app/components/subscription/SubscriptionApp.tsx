/**
 * Subscription App - Main Orchestrator
 *
 * Complete subscription management application demonstrating:
 * - Customer plan selection flow
 * - Admin plan management interface
 * - Add-on and combo offer selection
 * - Checkout summary
 *
 * This component showcases the complete subscription system implementation
 * as specified in the subscription plan requirements.
 *
 * @component
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { PlanSelectionScreen } from "./PlanSelectionScreen";
import AdminPlanManagement from "./AdminPlanManagement";
import { AddonSelector } from "./AddonSelector";
import { ComboOfferCards } from "./ComboOfferCards";
import { User, Shield, Settings } from "lucide-react";
import type { UserRole } from "../../types/subscriptionPlans.types";

export function SubscriptionApp() {
  const [activeView, setActiveView] = useState<"customer" | "admin">("customer");
  const [userRole, setUserRole] = useState<UserRole>("ADMIN");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Subscription Management System
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                100% Dynamic • Multi-Duration Billing • Admin-Editable Pricing
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Badge variant="outline" className="text-xs">
                Vehicle Washing Plans
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Demo Mode
              </Badge>
            </div>
          </div>

          {/* View Switcher */}
          <Tabs
            value={activeView}
            onValueChange={(v) => setActiveView(v as "customer" | "admin")}
            className="mt-4"
          >
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="customer" className="gap-2">
                <User className="w-4 h-4" />
                Customer View
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2">
                <Shield className="w-4 h-4" />
                Admin Panel
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        {activeView === "customer" ? (
          <CustomerView />
        ) : (
          <AdminView userRole={userRole} onRoleChange={setUserRole} />
        )}
      </div>
    </div>
  );
}

// ============================================
// CUSTOMER VIEW
// ============================================

function CustomerView() {
  const [currentStep, setCurrentStep] = useState<"plans" | "addons" | "combos">("plans");

  return (
    <div>
      {/* Step Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex items-center justify-center gap-4">
          <StepIndicator
            step={1}
            label="Select Plan"
            isActive={currentStep === "plans"}
            isCompleted={currentStep !== "plans"}
            onClick={() => setCurrentStep("plans")}
          />
          <div className="w-12 h-0.5 bg-gray-300" />
          <StepIndicator
            step={2}
            label="Add-ons"
            isActive={currentStep === "addons"}
            isCompleted={false}
            onClick={() => setCurrentStep("addons")}
          />
          <div className="w-12 h-0.5 bg-gray-300" />
          <StepIndicator
            step={3}
            label="Combo Offers"
            isActive={currentStep === "combos"}
            isCompleted={false}
            onClick={() => setCurrentStep("combos")}
          />
        </div>
      </div>

      {/* Content */}
      {currentStep === "plans" && <PlanSelectionScreen />}
      {currentStep === "addons" && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AddonSelector selectedPlanTier="SHAMPOO_WASH" />
        </div>
      )}
      {currentStep === "combos" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ComboOfferCards />
        </div>
      )}
    </div>
  );
}

// ============================================
// ADMIN VIEW
// ============================================

interface AdminViewProps {
  userRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

function AdminView({ userRole, onRoleChange }: AdminViewProps) {
  return (
    <div>
      {/* Role Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Settings className="w-5 h-5 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            Simulate Role:
          </span>
          <div className="flex gap-2">
            {(["SUPER_ADMIN", "ADMIN", "MANAGER", "VIEWER"] as UserRole[]).map(
              (role) => (
                <Badge
                  key={role}
                  variant={userRole === role ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => onRoleChange(role)}
                >
                  {role.replace("_", " ")}
                </Badge>
              )
            )}
          </div>
        </div>
      </div>

      {/* Admin Interface */}
      <AdminPlanManagement userRole={userRole} />
    </div>
  );
}

// ============================================
// STEP INDICATOR
// ============================================

interface StepIndicatorProps {
  step: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}

function StepIndicator({
  step,
  label,
  isActive,
  isCompleted,
  onClick,
}: StepIndicatorProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 ${
        isActive || isCompleted ? "cursor-pointer" : "cursor-default opacity-50"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
          isActive
            ? "bg-purple-600 text-white"
            : isCompleted
            ? "bg-green-600 text-white"
            : "bg-gray-200 text-gray-600"
        }`}
      >
        {step}
      </div>
      <span
        className={`text-sm font-medium ${
          isActive ? "text-purple-700" : "text-gray-600"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
