import { SubscriptionIncentiveTracker } from "../incentives/SubscriptionIncentiveTracker";
/**
 * TSE Incentive Tracker
 * Read-only dashboard showing real-time earnings breakdown
 *
 * Shows:
 * - Fixed salary + variable commission breakdown
 * - Commission tiers (3%/5%/7%)
 * - Deal type mix impact on multipliers
 * - Renewal bonuses
 * - Eligibility status (CRM compliance, EBITDA compliance)
 *
 * @component
 */

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  DollarSign,
  Target,
  Phone,
  Percent,
  Award,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { teleSalesExecutiveService } from "../../services/teleSalesExecutiveService";
import type { TSEIncentives } from "../../types/teleSalesExecutive.types";
import {
  FIXED_SALARY,
  COMMISSION_TIERS,
  MAX_VARIABLE,
  CRM_COMPLIANCE,
  INCENTIVE_MULTIPLIERS,
  REFRESH_INTERVALS,
} from "../../constants/teleSalesExecutive.constants";

export function TSEIncentiveTrackerLegacy() {
  const [incentives, setIncentives] = useState<TSEIncentives | null>(null);

  useEffect(() => {
    const loadIncentives = () => {
      const data = teleSalesExecutiveService.getIncentiveBreakdown();
      setIncentives(data);
    };

    loadIncentives();

    // Refresh every 5 minutes
    const interval = setInterval(loadIncentives, REFRESH_INTERVALS.INCENTIVE_TRACKER);
    return () => clearInterval(interval);
  }, []);

  if (!incentives) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading incentive data...</div>
      </div>
    );
  }

  const totalCTC = incentives.fixedSalary + incentives.totalVariable;
  const variableProgress = (incentives.totalVariable / MAX_VARIABLE.COMMISSION) * 100;

  return (
    <div className="space-y-6">
      {/* Header - Total CTC */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-1">Total CTC This Month</div>
            <div className="text-4xl font-bold text-gray-900">
              ₹{totalCTC.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Fixed: ₹{incentives.fixedSalary.toLocaleString()} + Variable: ₹
              {incentives.totalVariable.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-1">Max Variable Potential</div>
            <div className="text-2xl font-bold text-gray-700">
              ₹{MAX_VARIABLE.COMMISSION.toLocaleString()}
            </div>
            <div className="w-48 h-2 bg-gray-200 rounded-full mt-2">
              <div
                className="h-2 bg-blue-600 rounded-full transition-all"
                style={{ width: `${Math.min(variableProgress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {variableProgress.toFixed(1)}% of max variable
            </div>
          </div>
        </div>
      </Card>

      {/* MTD Performance */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">MTD Performance</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <div className="text-sm text-gray-600">Revenue Generated</div>
            <div className="text-2xl font-bold text-gray-900">
              ₹{incentives.mtdPerformance.revenueGenerated.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Conversion Rate</div>
            <div className="text-2xl font-bold text-green-700">
              {incentives.mtdPerformance.conversionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Target: 15-18%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Calls Made</div>
            <div className="text-2xl font-bold text-blue-700">
              {incentives.mtdPerformance.callsMade}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Target: {incentives.mtdPerformance.callsTarget}/day
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Daily Avg</div>
            <div className="text-2xl font-bold text-purple-700">
              {Math.round(incentives.mtdPerformance.callsMade / new Date().getDate())}
            </div>
            <div className="text-xs text-gray-500 mt-1">calls/day</div>
          </div>
        </div>
      </Card>

      {/* Commission Breakdown */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Commission Breakdown</h3>
        </div>
        <div className="space-y-4">
          {/* Current Tier */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-300">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-gray-900">Current Tier</div>
              <Badge className="bg-green-600">
                {incentives.commissionBreakdown.revenueTier}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Revenue Range</div>
                <div className="font-medium text-gray-900">
                  ₹
                  {(incentives.commissionBreakdown.tierThreshold.min / 1000).toFixed(0)}K
                  -{(incentives.commissionBreakdown.tierThreshold.max / 1000).toFixed(0)}
                  K
                </div>
              </div>
              <div>
                <div className="text-gray-600">Commission Rate</div>
                <div className="font-medium text-gray-900 text-lg">
                  {incentives.commissionBreakdown.commissionRate}%
                </div>
              </div>
              <div>
                <div className="text-gray-600">Earned So Far</div>
                <div className="font-bold text-green-700 text-lg">
                  ₹{incentives.commissionBreakdown.commissionEarned.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* All Tiers */}
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Commission Tier Structure
            </div>
            {COMMISSION_TIERS.map((tier) => {
              const isCurrent = tier.tier === incentives.commissionBreakdown.revenueTier;
              return (
                <div
                  key={tier.tier}
                  className={`p-3 rounded border ${
                    isCurrent
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {isCurrent && <CheckCircle className="w-4 h-4 text-green-600" />}
                      <div>
                        <div className="font-medium text-gray-900">
                          {tier.label}
                        </div>
                        <div className="text-xs text-gray-600">
                          Revenue: ₹{(tier.min / 1000).toFixed(0)}K - ₹
                          {tier.max === Infinity ? "Unlimited" : `${(tier.max / 1000).toFixed(0)}K`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{tier.rate}%</div>
                      <div className="text-xs text-gray-600">rate</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Deal Type Mix */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Deal Type Mix</h3>
          <Badge variant="outline" className="text-xs">
            Incentive Multipliers
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Base Price Only</div>
            <div className="text-2xl font-bold text-gray-900">
              {incentives.dealTypeMix.baseDeals.count}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Multiplier: {incentives.dealTypeMix.baseDeals.multiplier}%
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Base + Add-On</div>
            <div className="text-2xl font-bold text-blue-700">
              {incentives.dealTypeMix.addOnDeals.count}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Multiplier: {incentives.dealTypeMix.addOnDeals.multiplier}%
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
              Bundle MID <span className="text-yellow-500">⭐</span>
            </div>
            <div className="text-2xl font-bold text-green-700">
              {incentives.dealTypeMix.bundleMIDDeals.count}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Multiplier: {incentives.dealTypeMix.bundleMIDDeals.multiplier}%
            </div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
              Bundle LOW <span className="text-red-500">⚠️</span>
            </div>
            <div className="text-2xl font-bold text-orange-700">
              {incentives.dealTypeMix.bundleLOWDeals.count}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Multiplier: {incentives.dealTypeMix.bundleLOWDeals.multiplier}%
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded text-sm text-blue-800">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          <strong>Tip:</strong> Push Bundle MID (100% multiplier) for best earnings. Avoid
          Bundle LOW (60% multiplier).
        </div>
      </Card>

      {/* Renewal Bonus */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Renewal Bonuses</h3>
          <Badge variant="outline" className="text-xs">
            No Cap
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <div className="text-sm text-gray-600">Renewals Confirmed</div>
            <div className="text-3xl font-bold text-purple-700">
              {incentives.renewalBonus.count}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Bonus Per Renewal</div>
            <div className="text-3xl font-bold text-gray-900">
              ₹{incentives.renewalBonus.bonusPerRenewal}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Total Renewal Bonus</div>
            <div className="text-3xl font-bold text-green-700">
              ₹{incentives.renewalBonus.totalBonus.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Eligibility Status */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Incentive Eligibility</h3>
        </div>
        <div className="space-y-3">
          {/* CRM Compliance */}
          <div
            className={`p-4 rounded-lg border ${
              incentives.eligibilityStatus.crmCompliance >= CRM_COMPLIANCE.REQUIRED
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {incentives.eligibilityStatus.crmCompliance >= CRM_COMPLIANCE.REQUIRED ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="font-semibold text-gray-900">CRM Compliance</div>
                  <div className="text-sm text-gray-600">
                    Required: {CRM_COMPLIANCE.REQUIRED}% | Current:{" "}
                    {incentives.eligibilityStatus.crmCompliance}%
                  </div>
                </div>
              </div>
              <Badge
                className={
                  incentives.eligibilityStatus.crmCompliance >= CRM_COMPLIANCE.REQUIRED
                    ? "bg-green-600"
                    : "bg-red-600"
                }
              >
                {incentives.eligibilityStatus.crmCompliance >= CRM_COMPLIANCE.REQUIRED
                  ? "COMPLIANT"
                  : "NON-COMPLIANT"}
              </Badge>
            </div>
            {incentives.eligibilityStatus.crmCompliance < CRM_COMPLIANCE.REQUIRED && (
              <div className="mt-2 text-sm text-red-700">
                ⚠️ <strong>20% penalty applied</strong> - Update all CRM fields to restore full
                variable payout
              </div>
            )}
          </div>

          {/* EBITDA Compliance */}
          <div
            className={`p-4 rounded-lg border ${
              incentives.eligibilityStatus.ebitdaCompliant
                ? "bg-green-50 border-green-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {incentives.eligibilityStatus.ebitdaCompliant ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <div className="font-semibold text-gray-900">EBITDA Compliance</div>
                  <div className="text-sm text-gray-600">
                    All deals must maintain ≥ 30% EBITDA floor
                  </div>
                </div>
              </div>
              <Badge
                className={
                  incentives.eligibilityStatus.ebitdaCompliant ? "bg-green-600" : "bg-red-600"
                }
              >
                {incentives.eligibilityStatus.ebitdaCompliant ? "COMPLIANT" : "VIOLATIONS"}
              </Badge>
            </div>
          </div>

          {/* Penalty Summary */}
          {incentives.eligibilityStatus.penaltyApplied && (
            <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="font-semibold text-red-900">Penalty Applied</div>
              </div>
              <div className="text-sm text-red-800">
                {incentives.eligibilityStatus.penaltyReason}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600 mb-2">Total Variable This Month</div>
            <div className="text-3xl font-bold text-gray-900">
              ₹{incentives.totalVariable.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Commission: ₹{incentives.commissionBreakdown.commissionEarned.toLocaleString()} +
              Renewals: ₹{incentives.renewalBonus.totalBonus.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-2">Remaining to Max Variable</div>
            <div className="text-2xl font-bold text-purple-700">
              ₹
              {(incentives.maxVariablePotential - incentives.totalVariable).toLocaleString()}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              (Max: ₹{incentives.maxVariablePotential.toLocaleString()})
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function TSEIncentiveTracker({ tseId, tseName }: { tseId?: string; tseName?: string }) {
  const id = tseId || "EDB-TSE-SUR1";
  return (
    <SubscriptionIncentiveTracker
      employeeId={id}
      role="TSE"
      employeeName={tseName || id}
    />
  );
}
