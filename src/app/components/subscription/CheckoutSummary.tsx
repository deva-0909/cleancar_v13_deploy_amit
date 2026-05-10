/**
 * Checkout Summary Component
 *
 * Final checkout screen showing complete subscription breakdown.
 * Displays plan details, duration, pricing, add-ons, and savings.
 *
 * Features:
 * - Complete price breakdown
 * - Duration and effective monthly cost display
 * - Add-on itemization
 * - Total savings calculation
 * - Payment CTA
 *
 * @component
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import {
  Check,
  Calendar,
  CreditCard,
  Tag,
  TrendingDown,
  Info,
  ChevronRight,
} from "lucide-react";
import { subscriptionPlansService } from "../../services/subscriptionPlansService";
import { logger } from "../../services/logger";
import type {
  CompletePlan,
  DurationPrice,
  Addon,
  BillingDurationType,
} from "../../types/subscriptionPlans.types";

interface CheckoutSummaryProps {
  plan: CompletePlan;
  selectedDuration: BillingDurationType;
  selectedAddons?: Addon[];
  onProceedToPayment?: () => void;
}

export function CheckoutSummary({
  plan,
  selectedDuration,
  selectedAddons = [],
  onProceedToPayment,
}: CheckoutSummaryProps) {
  const selectedPrice = plan.prices.find((p) => p.duration === selectedDuration);

  if (!selectedPrice) {
    return (
      <Card className="p-6">
        <p className="text-red-600">Error: Invalid billing duration selected</p>
      </Card>
    );
  }

  // Calculate add-on totals
  const addonMonthlyTotal = selectedAddons.reduce((sum, addon) => {
    if (addon.billingType === "PER_MONTH") {
      return sum + addon.price;
    }
    return sum;
  }, 0);

  const addonPerVisitTotal = selectedAddons.reduce((sum, addon) => {
    if (addon.billingType === "PER_VISIT") {
      return sum + addon.price;
    }
    return sum;
  }, 0);

  // Total addon cost for the billing duration
  const totalAddonCost = addonMonthlyTotal * selectedPrice.months;

  // Grand total
  const grandTotal = selectedPrice.totalAmount + totalAddonCost;

  // Effective monthly with add-ons
  const effectiveMonthlyWithAddons = Math.round(grandTotal / selectedPrice.months);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Checkout Summary
        </h2>
        <p className="text-gray-600">Review your subscription before payment</p>
      </div>

      <Card className="p-6 mb-6">
        {/* Plan Details */}
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-xl text-gray-900">
                {plan.tier.displayName}
              </h3>
              <p className="text-sm text-gray-600">
                {plan.vehicleCategory.displayName}
              </p>
            </div>
            <Badge className="bg-purple-600 text-base px-3 py-1">
              {selectedPrice.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-xs text-gray-500 mb-1">Billing Duration</div>
              <div className="font-semibold text-gray-900 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {selectedPrice.months} month{selectedPrice.months !== 1 ? "s" : ""}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Washes per Month</div>
              <div className="font-semibold text-gray-900">
                {plan.tier.washesPerMonth} washes
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Pricing Breakdown */}
        <div className="space-y-3 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Pricing Breakdown</h4>

          {/* Base Plan Price */}
          <div className="flex justify-between text-gray-700">
            <span>Base plan ({selectedPrice.months} × {subscriptionPlansService.formatPrice(plan.tier.baseMonthlyPrice)})</span>
            <span>
              {subscriptionPlansService.formatPrice(
                plan.tier.baseMonthlyPrice * selectedPrice.months
              )}
            </span>
          </div>

          {/* Duration Discount */}
          {selectedPrice.amountSaved > 0 && (
            <div className="flex justify-between text-green-700">
              <span className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                Duration discount ({selectedPrice.discountPercent}% off)
              </span>
              <span>
                -{subscriptionPlansService.formatPrice(selectedPrice.amountSaved)}
              </span>
            </div>
          )}

          {/* Subtotal for Plan */}
          <div className="flex justify-between font-semibold text-gray-900 pt-2 border-t">
            <span>Plan subtotal</span>
            <span>
              {subscriptionPlansService.formatPrice(selectedPrice.totalAmount)}
            </span>
          </div>

          {/* Add-ons */}
          {selectedAddons.length > 0 && (
            <>
              <Separator className="my-4" />
              <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Add-ons
              </h5>

              {selectedAddons.map((addon) => {
                const addonCost =
                  addon.billingType === "PER_MONTH"
                    ? addon.price * selectedPrice.months
                    : 0; // Per-visit add-ons not included in upfront cost

                return (
                  <div
                    key={addon.id}
                    className="flex justify-between text-sm text-gray-700"
                  >
                    <span className="flex-1">
                      {addon.name}
                      <span className="text-xs text-gray-500 ml-1">
                        ({addon.billingType === "PER_MONTH" ? `${subscriptionPlansService.formatPrice(addon.price)}/mo × ${selectedPrice.months}` : "per visit - billed separately"})
                      </span>
                    </span>
                    <span>
                      {addon.billingType === "PER_MONTH"
                        ? `+${subscriptionPlansService.formatPrice(addonCost)}`
                        : "On-demand"}
                    </span>
                  </div>
                );
              })}

              {addonMonthlyTotal > 0 && (
                <div className="flex justify-between text-sm font-medium text-gray-900 pt-2 border-t">
                  <span>Add-ons subtotal</span>
                  <span>
                    +{subscriptionPlansService.formatPrice(totalAddonCost)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <Separator className="my-6" />

        {/* Grand Total */}
        <div className="space-y-4">
          <div className="flex justify-between items-baseline">
            <span className="text-lg font-semibold text-gray-900">
              Total Amount
            </span>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-700">
                {subscriptionPlansService.formatPrice(grandTotal)}
              </div>
              <div className="text-xs text-gray-500">
                for {selectedPrice.months} month{selectedPrice.months !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          {/* Effective Monthly Cost */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-blue-900">
                  Effective Monthly Cost
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Total ÷ {selectedPrice.months} months
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {subscriptionPlansService.formatPrice(effectiveMonthlyWithAddons)}
                <span className="text-sm font-normal">/mo</span>
              </div>
            </div>
          </Card>

          {/* Cost Per Wash */}
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Cost per wash</div>
            <div className="text-lg font-semibold text-gray-900">
              {subscriptionPlansService.formatPrice(plan.tier.costPerWash)}
            </div>
          </div>
        </div>

        {/* Savings Badge */}
        {selectedPrice.amountSaved > 0 && (
          <Card className="mt-6 p-4 bg-green-50 border-2 border-green-300">
            <div className="flex items-center justify-center gap-2">
              <Check className="w-5 h-5 text-green-700" />
              <span className="font-semibold text-green-900">
                You're saving {subscriptionPlansService.formatPrice(selectedPrice.amountSaved)} with {selectedPrice.label} billing!
              </span>
            </div>
          </Card>
        )}
      </Card>

      {/* What's Included */}
      <Card className="p-6 mb-6">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Check className="w-5 h-5 text-green-600" />
          What's Included
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {plan.features.slice(0, 10).map((feature) => (
            <div key={feature.id} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature.featureName}</span>
            </div>
          ))}
          {plan.features.length > 10 && (
            <div className="text-sm text-gray-500 italic">
              + {plan.features.length - 10} more features
            </div>
          )}
        </div>
      </Card>

      {/* Payment Info */}
      <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-yellow-700 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Payment & Service Details</p>
            <ul className="space-y-1 text-xs">
              <li>• Service starts within 24 hours of payment confirmation</li>
              <li>• Daily doorstep service (Mon-Sat) = ~26 washes/month</li>
              <li>• All prices include GST and service charges</li>
              <li>• Auto-renewal can be disabled anytime from your account</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* CTA Buttons */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => window.history.back()}
        >
          Back to Plans
        </Button>
        <Button
          className="flex-1 text-lg py-6"
          onClick={() => {
            if (onProceedToPayment) {
              onProceedToPayment();
            }
            // In production: Navigate to payment gateway
            logger.log("Proceeding to payment:", {
              planId: plan.tier.id,
              duration: selectedDuration,
              addons: selectedAddons.map((a) => a.id),
              total: grandTotal,
            });
          }}
        >
          <CreditCard className="w-5 h-5 mr-2" />
          Proceed to Payment
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
