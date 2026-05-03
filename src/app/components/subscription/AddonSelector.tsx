/**
 * Add-on Selector Component
 *
 * Customer-facing UI for selecting add-on services with subscription plans.
 * Dynamically renders available add-ons based on selected plan tier.
 *
 * Features:
 * - Plan-aware recommendations (shows best-paired add-ons first)
 * - Toggle selection with price calculation
 * - Per-visit vs Per-month billing display
 * - Total add-on cost calculation
 * - Only shows operationally confirmed add-ons
 *
 * @component
 */

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Check, Info, Sparkles } from "lucide-react";
import { subscriptionPlansService } from "../../services/subscriptionPlansService";
import type { Addon, PlanTierName } from "../../types/subscriptionPlans.types";

interface AddonSelectorProps {
  selectedPlanTier?: PlanTierName;
  onAddonsChange?: (selectedAddonIds: string[], totalCost: number) => void;
}

export function AddonSelector({
  selectedPlanTier,
  onAddonsChange,
}: AddonSelectorProps) {
  const [allAddons, setAllAddons] = useState<Addon[]>([]);
  const [recommendedAddons, setRecommendedAddons] = useState<Addon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  useEffect(() => {
    // Load all active add-ons
    const loadedAddons = subscriptionPlansService.getAddons(false); // Active only
    setAllAddons(loadedAddons);

    // Get recommended add-ons for current plan
    if (selectedPlanTier) {
      const recommended =
        subscriptionPlansService.getRecommendedAddons(selectedPlanTier);
      setRecommendedAddons(recommended);
    }
  }, [selectedPlanTier]);

  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) => {
      const newSelection = prev.includes(addonId)
        ? prev.filter((id) => id !== addonId)
        : [...prev, addonId];

      // Calculate total cost
      const totalCost = newSelection.reduce((sum, id) => {
        const addon = allAddons.find((a) => a.id === id);
        return sum + (addon?.price || 0);
      }, 0);

      // Notify parent
      if (onAddonsChange) {
        onAddonsChange(newSelection, totalCost);
      }

      return newSelection;
    });
  };

  const totalAddonCost = selectedAddonIds.reduce((sum, id) => {
    const addon = allAddons.find((a) => a.id === id);
    return sum + (addon?.price || 0);
  }, 0);

  const recommendedIds = new Set(recommendedAddons.map((a) => a.id));

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Enhance Your Plan with Add-ons
        </h3>
        <p className="text-sm text-gray-600">
          Optional services you can add to your subscription
        </p>
      </div>

      {/* Recommended Add-ons (if available) */}
      {recommendedAddons.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <h4 className="font-medium text-purple-900">
              Recommended for Your Plan
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedAddons.map((addon) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                isSelected={selectedAddonIds.includes(addon.id)}
                onToggle={() => handleToggleAddon(addon.id)}
                isRecommended={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Other Add-ons */}
      {allAddons.filter((a) => !recommendedIds.has(a.id)).length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Other Add-ons</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allAddons
              .filter((a) => !recommendedIds.has(a.id))
              .map((addon) => (
                <AddonCard
                  key={addon.id}
                  addon={addon}
                  isSelected={selectedAddonIds.includes(addon.id)}
                  onToggle={() => handleToggleAddon(addon.id)}
                  isRecommended={false}
                />
              ))}
          </div>
        </div>
      )}

      {/* Total Add-on Cost Summary */}
      {selectedAddonIds.length > 0 && (
        <Card className="mt-6 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900">
                Total Add-on Cost
              </div>
              <div className="text-sm text-blue-700">
                {selectedAddonIds.length} add-on
                {selectedAddonIds.length !== 1 ? "s" : ""} selected
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              +{subscriptionPlansService.formatPrice(totalAddonCost)}
            </div>
          </div>
        </Card>
      )}

      {/* Info Banner */}
      <Card className="mt-6 p-4 bg-gray-50 border-gray-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-gray-600 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Add-on Billing</p>
            <ul className="space-y-1 text-xs">
              <li>• Per-visit add-ons are charged each time they're performed</li>
              <li>• Per-month add-ons are a fixed monthly charge</li>
              <li>• You can add or remove add-ons anytime after subscribing</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ============================================
// ADDON CARD SUB-COMPONENT
// ============================================

interface AddonCardProps {
  addon: Addon;
  isSelected: boolean;
  onToggle: () => void;
  isRecommended: boolean;
}

function AddonCard({
  addon,
  isSelected,
  onToggle,
  isRecommended,
}: AddonCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${
        isSelected
          ? "border-2 border-purple-500 bg-purple-50"
          : isRecommended
          ? "border-2 border-purple-200 bg-white hover:border-purple-300"
          : "border border-gray-200 bg-white hover:border-gray-300"
      }`}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-label={`${isSelected ? "Deselect" : "Select"} ${addon.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5">
          <Checkbox checked={isSelected} onCheckedChange={onToggle} />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h5 className="font-semibold text-gray-900">{addon.name}</h5>
              {isRecommended && (
                <Badge className="mt-1 bg-purple-600 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Recommended
                </Badge>
              )}
            </div>
            <div className="text-right">
              <div className="font-bold text-purple-700">
                {subscriptionPlansService.formatPrice(addon.price)}
              </div>
              <div className="text-xs text-gray-600">
                {addon.billingType === "PER_VISIT" ? "per visit" : "per month"}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">{addon.description}</p>
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-purple-200">
          <div className="flex items-center gap-2 text-sm text-purple-700">
            <Check className="w-4 h-4" />
            <span className="font-medium">Added to your plan</span>
          </div>
        </div>
      )}
    </Card>
  );
}
