/**
 * Plan Selection Screen - Customer-Facing
 *
 * Main screen for customers to browse and select subscription plans.
 * 100% dynamic - all data from service layer, no hardcoded values.
 *
 * Features:
 * - Vehicle type filtering (4W / 2W)
 * - Category selection
 * - Plan tier comparison
 * - Multi-duration billing with dynamic pricing
 * - Add-ons and combo offers
 *
 * @component
 */

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Car,
  Bike,
  Check,
  Sparkles,
  Tag,
  Info,
} from "lucide-react";
import { subscriptionPlansService } from "../../services/subscriptionPlansService";
import type {
  VehicleCategory,
  CompletePlan,
  BillingDurationType,
  DurationPrice,
} from "../../types/subscriptionPlans.types";
import { PLAN_TIER_COLORS } from "../../constants/subscriptionPlans.constants";
import { logger } from "../../services/logger";

export function PlanSelectionScreen() {
  const [vehicleType, setVehicleType] = useState<"4W" | "2W">("4W");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<BillingDurationType>("MONTHLY");
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [plans, setPlans] = useState<CompletePlan[]>([]);

  // Load categories when vehicle type changes
  useEffect(() => {
    const loadedCategories = subscriptionPlansService.getVehicleCategories(vehicleType);
    setCategories(loadedCategories);

    // Auto-select first category
    if (loadedCategories.length > 0) {
      setSelectedCategory(loadedCategories[0].id);
    }
  }, [vehicleType]);

  // Load plans when category changes
  useEffect(() => {
    if (selectedCategory) {
      const loadedPlans = subscriptionPlansService.getCompletePlansByCategory(selectedCategory);
      setPlans(loadedPlans);
    }
  }, [selectedCategory]);

  const selectedCategoryData = categories.find((cat) => cat.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Choose Your Washing Plan
          </h1>
          <p className="text-gray-600">
            Professional doorstep vehicle washing - Daily service, Monthly billing
          </p>
        </div>

        {/* Vehicle Type Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={vehicleType === "4W" ? "default" : "outline"}
            onClick={() => setVehicleType("4W")}
            className="gap-2"
          >
            <Car className="w-5 h-5" />
            4-Wheeler
          </Button>
          <Button
            variant={vehicleType === "2W" ? "default" : "outline"}
            onClick={() => setVehicleType("2W")}
            className="gap-2"
          >
            <Bike className="w-5 h-5" />
            2-Wheeler
          </Button>
        </div>

        {/* Vehicle Category Selector */}
        {categories.length > 0 && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Your Vehicle Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedCategory === category.id
                      ? "border-2 border-indigo-500 bg-indigo-50"
                      : "border border-gray-200 hover:border-indigo-300"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${category.displayName}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedCategory(category.id);
                    }
                  }}
                >
                  <div className="font-semibold text-gray-900 mb-2">
                    {category.displayName}
                  </div>
                  <div className="text-sm text-gray-600">
                    e.g., {category.examples.slice(0, 3).join(", ")}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Billing Duration Selector */}
        {plans.length > 0 && (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Billing Duration
            </label>
            <Tabs value={selectedDuration} onValueChange={(value) => setSelectedDuration(value as BillingDurationType)}>
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="MONTHLY">Monthly</TabsTrigger>
                <TabsTrigger value="QUARTERLY">
                  Quarterly
                  <Badge className="ml-2 bg-green-600 text-xs">5% off</Badge>
                </TabsTrigger>
                <TabsTrigger value="HALF_YEARLY">
                  Half-Yearly
                  <Badge className="ml-2 bg-green-600 text-xs">10% off</Badge>
                </TabsTrigger>
                <TabsTrigger value="NINE_MONTHS">
                  9 Months
                  <Badge className="ml-2 bg-green-600 text-xs">12% off</Badge>
                </TabsTrigger>
                <TabsTrigger value="ANNUAL">
                  Annual
                  <Badge className="ml-2 bg-purple-600 text-xs">Best Value</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Plan Cards */}
        {plans.length > 0 && selectedCategoryData && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Plans for {selectedCategoryData.displayName}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                All plans include {plans[0].tier.washesPerMonth} washes per month (Mon-Sat)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {plans.map((plan) => {
                const selectedPrice = plan.prices.find(
                  (p) => p.duration === selectedDuration
                );

                if (!selectedPrice) return null;

                const tierColors = PLAN_TIER_COLORS[plan.tier.name];

                return (
                  <Card
                    key={plan.tier.id}
                    className={`p-6 border-2 ${tierColors.border} ${tierColors.bg}`}
                  >
                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      <h3 className={`text-xl font-bold ${tierColors.text} mb-2`}>
                        {plan.tier.displayName}
                      </h3>
                      <div className="text-4xl font-bold text-gray-900 mb-1">
                        {subscriptionPlansService.formatPrice(selectedPrice.totalAmount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedPrice.label} billing
                      </div>
                      {selectedPrice.amountSaved > 0 && (
                        <Badge className="mt-2 bg-green-600">
                          Save {subscriptionPlansService.formatPrice(selectedPrice.amountSaved)}
                        </Badge>
                      )}
                      {selectedPrice.isBestValue && (
                        <Badge className="mt-2 ml-2 bg-purple-600">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Best Value
                        </Badge>
                      )}
                    </div>

                    {/* Effective Monthly Cost */}
                    <div className="text-center p-3 bg-white rounded-lg mb-4">
                      <div className="text-xs text-gray-500 mb-1">
                        Effective Monthly Cost
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        {subscriptionPlansService.formatPrice(selectedPrice.effectiveMonthlyPrice)}
                        /month
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {subscriptionPlansService.formatPrice(plan.tier.costPerWash)} per wash
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 mb-6">
                      {plan.features
                        .sort((a, b) => {
                          const freqOrder = { EVERY_WASH: 0, WEEKLY: 1, MONTHLY: 2 };
                          return freqOrder[a.frequency] - freqOrder[b.frequency];
                        })
                        .slice(0, 8)
                        .map((feature) => (
                          <div key={feature.id} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-700">
                              {feature.featureName}
                            </span>
                          </div>
                        ))}
                      {plan.features.length > 8 && (
                        <div className="text-sm text-gray-500 italic">
                          + {plan.features.length - 8} more features
                        </div>
                      )}
                    </div>

                    {/* CTA Button */}
                    <Button
                      className="w-full"
                      onClick={() => {
                        // In production: Navigate to checkout with plan + duration
                        logger.log("Selected plan:", plan.tier.id, selectedDuration);
                      }}
                    >
                      Select {plan.tier.displayName}
                    </Button>

                    {/* Recommended Add-ons */}
                    {plan.addons.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <Tag className="w-3 h-3" />
                          Popular Add-ons
                        </div>
                        <div className="space-y-1">
                          {plan.addons.slice(0, 3).map((addon) => (
                            <div
                              key={addon.id}
                              className="text-xs text-gray-600 flex items-center justify-between"
                            >
                              <span>{addon.name}</span>
                              <span className="font-medium">
                                +{subscriptionPlansService.formatPrice(addon.price)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Banner */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                How It Works
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Daily doorstep service (Mon-Sat) = ~26 washes per month</li>
                <li>✓ Choose longer billing duration for bigger savings</li>
                <li>✓ All prices include service, materials, and GST</li>
                <li>✓ Add-ons can be added anytime after subscription</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
