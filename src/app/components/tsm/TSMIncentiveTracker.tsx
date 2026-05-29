/**
 * TSM INCENTIVE & PAYROLL TRACKER
 * Team and individual commission forecasting
 *
 * Philosophy: Transparent performance-based rewards
 * Shows: Base incentive, conversion bonus, renewal bonus, quality bonus
 * Purpose: Incentive forecasting and team motivation
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  DollarSign,
  TrendingUp,
  Award,
  Users,
  Target,
  CheckCircle2,
  RefreshCw,
  Star,
} from "lucide-react";
import { teleSalesManagerService } from "../../services/teleSalesManagerService";
import {
  TSM_SALARY,
  TEAM_REVENUE_BONUS,
  CONVERSION_BONUS,
  RENEWAL_BONUS,
  TSM_VARIABLE,
  INCENTIVE_ELIGIBILITY,
} from "../../constants/teleSalesManager.constants";

export function TSMIncentiveTracker() {
  const incentiveData = teleSalesManagerService.getTeamIncentiveMetrics();

  // Calculate TSM's personal incentive based on team performance
  const calculateTSMIncentive = () => {
    let revenueBonus = 0;
    const teamRevenueLakhs = incentiveData.totalTeamRevenue / 100000;

    // Team Revenue Bonus calculation
    if (incentiveData.totalTeamRevenue >= TEAM_REVENUE_BONUS.TIER_3.threshold) {
      revenueBonus = TEAM_REVENUE_BONUS.TIER_3.bonus;
    } else if (incentiveData.totalTeamRevenue >= TEAM_REVENUE_BONUS.TIER_2.threshold) {
      revenueBonus = TEAM_REVENUE_BONUS.TIER_2.bonus;
    } else if (incentiveData.totalTeamRevenue >= TEAM_REVENUE_BONUS.TIER_1.threshold) {
      revenueBonus = TEAM_REVENUE_BONUS.TIER_1.bonus;
    }

      // G1 FIX: 4-tier slabs per Incentive Structure v5 (was binary threshold)
    const conversionBonusEarned = (() => {
      const pct = (incentiveData.teamConversionRate / CONVERSION_BONUS.THRESHOLD) * 100;
      if (pct > 150) return 20000;
      if (pct > 125) return 15000;
      if (pct > 100) return 10000;
      return 5000;
    })();
    const renewalBonusEarned = (() => {
      const r = incentiveData.teamRenewalRate;
      if (r > 95) return 10000;
      if (r > 85) return 8500;
      if (r > 75) return 7000;
      if (r >= 70) return 3000;
      return 0;
    })();

    // Total variable
    const totalVariable = revenueBonus + conversionBonusEarned + renewalBonusEarned;

    // Apply CRM compliance penalty if applicable
    // G2 FIX: derive from actual team incentive data (was hardcoded 100%)
    const crmComplianceRate = Math.round(
      incentiveData.tseBreakdowns.reduce((s, t) => {
        // Use qualityBonus as proxy: ₹5K = 100%, ₹2.5K = 95–99%, ₹0 = <95%
        const score = t.qualityBonus >= 5000 ? 100 : t.qualityBonus >= 2500 ? 97 : 90;
        return s + score;
      }, 0) / Math.max(1, incentiveData.tseBreakdowns.length)
    );
    const penaltyApplied = crmComplianceRate < INCENTIVE_ELIGIBILITY.CRM_COMPLIANCE_MIN;
    const finalVariable = penaltyApplied
      ? totalVariable * (1 - INCENTIVE_ELIGIBILITY.CRM_PENALTY_PERCENT / 100)
      : totalVariable;

    return {
      fixedSalary: TSM_SALARY.TYPICAL,
      revenueBonus,
      conversionBonus: conversionBonusEarned,
      renewalBonus: renewalBonusEarned,
      totalVariable,
      penaltyApplied,
      finalVariable,
      totalCTC: TSM_SALARY.TYPICAL + finalVariable,
      maxPotential: TSM_SALARY.TYPICAL + TSM_VARIABLE.MAX_MONTHLY,
      achievementPercent: (finalVariable / TSM_VARIABLE.MAX_MONTHLY) * 100,
    };
  };

  const tsmIncentive = calculateTSMIncentive();

  // Calculate team stats
  const teamStats = {
    totalTSEs: incentiveData.tseBreakdowns.length,
    topPerformer: incentiveData.tseBreakdowns.reduce((top, tse) =>
      tse.totalProjected > top.totalProjected ? tse : top
    ),
    avgIncentive:
      incentiveData.tseBreakdowns.reduce((sum, tse) => sum + tse.totalProjected, 0) /
      incentiveData.tseBreakdowns.length,
  };

  return (
    <div className="space-y-6">
      {/* TSM Personal Incentive Tracker */}
      <Card className="p-6 border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-purple-200 flex items-center justify-center">
            <Award className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your Incentive Forecast (TSM)</h2>
            <p className="text-sm text-gray-600">Based on team performance this month</p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-4">
          {/* Fixed Salary */}
          <Card className="p-4 bg-white">
            <div className="text-xs text-gray-600 mb-1">Fixed Salary</div>
            <div className="text-2xl font-bold text-gray-900">
              ₹{(tsmIncentive.fixedSalary / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-gray-500 mt-1">Base monthly</div>
          </Card>

          {/* Team Revenue Bonus */}
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              Revenue Bonus
            </div>
            <div className="text-2xl font-bold text-green-600">
              ₹{(tsmIncentive.revenueBonus / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Team: ₹{(incentiveData.totalTeamRevenue / 100000).toFixed(1)}L
            </div>
          </Card>

          {/* Conversion Bonus */}
          <Card className="p-4 bg-indigo-50 border-indigo-200">
            <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <Target className="w-3 h-3" />
              Conversion Bonus
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              ₹{(tsmIncentive.conversionBonus / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {incentiveData.teamConversionRate > CONVERSION_BONUS.THRESHOLD ? "✓" : "✗"}{" "}
              Target: {CONVERSION_BONUS.THRESHOLD}%
            </div>
          </Card>

          {/* Renewal Bonus */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Renewal Bonus
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ₹{(tsmIncentive.renewalBonus / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {incentiveData.teamRenewalRate > RENEWAL_BONUS.THRESHOLD ? "✓" : "✗"}{" "}
              Target: {RENEWAL_BONUS.THRESHOLD}%
            </div>
          </Card>

          {/* Total CTC */}
          <Card className="p-4 bg-purple-100 border-2 border-purple-300">
            <div className="text-xs text-purple-900 font-semibold mb-1">Total CTC</div>
            <div className="text-2xl font-bold text-purple-600">
              ₹{(tsmIncentive.totalCTC / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {tsmIncentive.achievementPercent.toFixed(0)}% of max
            </div>
          </Card>
        </div>

        {/* Achievement Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span>Variable Achievement</span>
<span>Variable: ₹{(tsmIncentive.finalVariable / 1000).toFixed(0)}K / ₹{(TSM_VARIABLE.MAX_MONTHLY / 1000).toFixed(0)}K max · Fixed: ₹{(tsmIncentive.fixedSalary/1000).toFixed(0)}K always earned</span>
          </div>
          <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-end px-3"
              style={{ width: `${Math.min(tsmIncentive.achievementPercent, 100)}%` }}
            >
              <span className="text-white text-sm font-bold">
                {tsmIncentive.achievementPercent.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Eligibility Status */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">Eligibility Status:</span>
          </div>
          <div className="flex gap-4">
            <Badge className={tsmIncentive.penaltyApplied ? "bg-amber-600" : "bg-green-600"}>
              CRM Compliance: {tsmIncentive.penaltyApplied ? "Penalty Applied" : "100% ✓"}
            </Badge>
            <Badge className="bg-green-600">
              EBITDA Compliance ✓
            </Badge>
          </div>
        </div>
      </Card>

      {/* Team Summary Header */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-6 border-2 border-green-200 bg-green-50">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <div className="text-xs text-gray-600">Team Revenue (MTD)</div>
          </div>
          <div className="text-3xl font-bold text-green-600">
            ₹{(incentiveData.totalTeamRevenue / 100000).toFixed(1)}L
          </div>
          <div className="text-xs text-gray-600 mt-2">Total generated this month</div>
        </Card>

        <Card className="p-6 border-2 border-purple-200 bg-purple-50">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-purple-600" />
            <div className="text-xs text-gray-600">Total Bonus Forecast</div>
          </div>
          <div className="text-3xl font-bold text-purple-600">
            ₹{(incentiveData.totalBonusForecast / 1000).toFixed(0)}K
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Projected payouts this month
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-indigo-600" />
            <div className="text-xs text-gray-600">Team Conversion Rate</div>
          </div>
          <div className="text-3xl font-bold text-indigo-600">
            {incentiveData.teamConversionRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-2">
            Across {teamStats.totalTSEs} team members
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <RefreshCw className="w-6 h-6 text-blue-600" />
            <div className="text-xs text-gray-600">Team Renewal Rate</div>
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {incentiveData.teamRenewalRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-2">Customer retention success</div>
        </Card>
      </div>

      {/* Top Performer Highlight */}
      <Card className="p-6 border-2 border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="w-16 h-16 rounded-full bg-amber-200 flex items-center justify-center">
              <Star className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">🏆 Top Performer This Month</div>
              <div className="text-2xl font-bold text-gray-900">
                {teamStats.topPerformer.tseName}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Leading with ₹{(teamStats.topPerformer.totalProjected / 1000).toFixed(0)}K
                projected incentive
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-xs text-gray-500 mb-1">Revenue</div>
              <div className="text-xl font-bold text-green-600">
                ₹{(teamStats.topPerformer.revenueGenerated / 100000).toFixed(1)}L
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Conversions</div>
              <div className="text-xl font-bold text-indigo-600">
                {teamStats.topPerformer.conversionsCount}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Renewals</div>
              <div className="text-xl font-bold text-blue-600">
                {teamStats.topPerformer.renewalsCount}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Individual TSE Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Individual Incentive Breakdown
        </h2>
        <div className="space-y-4">
          {incentiveData.tseBreakdowns.map((tse, index) => (
            <Card
              key={tse.tseId}
              className={`p-6 ${
                tse.tseId === teamStats.topPerformer.tseId
                  ? "border-2 border-amber-300 bg-amber-50"
                  : ""
              }`}
            >
              <div className="space-y-4">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {tse.tseName}
                        {tse.tseId === teamStats.topPerformer.tseId && (
                          <Badge className="bg-amber-600">
                            <Star className="w-3 h-3 mr-1" />
                            Top Performer
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {tse.tseId} • {tse.month}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Revenue Generated</div>
                      <div className="text-lg font-bold text-green-600">
                        ₹{(tse.revenueGenerated / 100000).toFixed(2)}L
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Conversions</div>
                      <div className="text-lg font-bold text-indigo-600">
                        {tse.conversionsCount}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Renewals</div>
                      <div className="text-lg font-bold text-blue-600">
                        {tse.renewalsCount}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Incentive Breakdown Grid */}
                <div className="grid grid-cols-5 gap-4">
                  {/* Base Incentive */}
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-600">Base Incentive</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      ₹{(tse.baseIncentive / 1000).toFixed(1)}K
                    </div>
                  </div>

                  {/* Conversion Bonus */}
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-indigo-600" />
                      <span className="text-xs text-gray-600">Conversion Bonus</span>
                    </div>
                    <div className="text-lg font-bold text-indigo-600">
                      ₹{(tse.conversionBonus / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tse.conversionsCount} deals
                    </div>
                  </div>

                  {/* Renewal Bonus */}
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-gray-600">Renewal Bonus</span>
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      ₹{(tse.renewalBonus / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {tse.renewalsCount} renewals
                    </div>
                  </div>

                  {/* Quality Bonus */}
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-gray-600">Quality Bonus</span>
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      ₹{(tse.qualityBonus / 1000).toFixed(1)}K
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      CRM + SLA compliance
                    </div>
                  </div>

                  {/* Total Projected */}
                  <div className="p-3 bg-purple-50 rounded-lg border-2 border-purple-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-purple-900 font-semibold">
                        Total Projected
                      </span>
                    </div>
                    <div className="text-xl font-bold text-purple-600">
                      ₹{(tse.totalProjected / 1000).toFixed(1)}K
                    </div>
                  </div>
                </div>

                {/* Incentive Breakdown Visualization */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    Incentive Composition
                  </div>
                  <div className="flex h-6 rounded-full overflow-hidden">
                    <div
                      className="bg-gray-600 flex items-center justify-center text-white text-xs"
                      style={{
                        width: `${
                          (tse.baseIncentive / tse.totalProjected) * 100
                        }%`,
                      }}
                    >
                      {((tse.baseIncentive / tse.totalProjected) * 100).toFixed(0)}%
                    </div>
                    <div
                      className="bg-indigo-600 flex items-center justify-center text-white text-xs"
                      style={{
                        width: `${
                          (tse.conversionBonus / tse.totalProjected) * 100
                        }%`,
                      }}
                    >
                      {((tse.conversionBonus / tse.totalProjected) * 100).toFixed(
                        0
                      )}
                      %
                    </div>
                    <div
                      className="bg-blue-600 flex items-center justify-center text-white text-xs"
                      style={{
                        width: `${
                          (tse.renewalBonus / tse.totalProjected) * 100
                        }%`,
                      }}
                    >
                      {((tse.renewalBonus / tse.totalProjected) * 100).toFixed(0)}%
                    </div>
                    <div
                      className="bg-green-600 flex items-center justify-center text-white text-xs"
                      style={{
                        width: `${
                          (tse.qualityBonus / tse.totalProjected) * 100
                        }%`,
                      }}
                    >
                      {((tse.qualityBonus / tse.totalProjected) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>Base</span>
                    <span>Conversion</span>
                    <span>Renewal</span>
                    <span>Quality</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Team Incentive Summary */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Team Incentive Summary
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <div className="text-xs text-gray-500 mb-1">Average Incentive</div>
            <div className="text-2xl font-bold text-gray-900">
              ₹{(teamStats.avgIncentive / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-600 mt-1">Per TSE this month</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Top Performer Bonus</div>
            <div className="text-2xl font-bold text-amber-600">
              ₹{(teamStats.topPerformer.totalProjected / 1000).toFixed(1)}K
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {teamStats.topPerformer.tseName}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Total Payroll Impact</div>
            <div className="text-2xl font-bold text-purple-600">
              ₹{(incentiveData.totalBonusForecast / 1000).toFixed(0)}K
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {(
                (incentiveData.totalBonusForecast /
                  incentiveData.totalTeamRevenue) *
                100
              ).toFixed(1)}
              % of revenue
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Incentive Range</div>
            <div className="text-2xl font-bold text-indigo-600">
              ₹
              {(
                Math.min(...incentiveData.tseBreakdowns.map((t) => t.totalProjected)) /
                1000
              ).toFixed(0)}
              K - ₹
              {(
                Math.max(...incentiveData.tseBreakdowns.map((t) => t.totalProjected)) /
                1000
              ).toFixed(0)}
              K
            </div>
            <div className="text-xs text-gray-600 mt-1">Across team</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
