/**
 * MODULE 5: Supervisor Incentive Tracker
 * Read-only performance visibility (system-calculated)
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";
import type { IncentiveDashboard } from "../../services/supervisorIncentiveService";

export interface IncentiveTrackerScreenProps {
  dashboard: IncentiveDashboard;
}

export function IncentiveTrackerScreen({ dashboard }: IncentiveTrackerScreenProps) {
  const [showLeadDetails, setShowLeadDetails] = useState(false);

  const { earnings, qualityMultiplier, kpiScore, alerts, leadDetails, monthYear, calculatedAt } =
    dashboard;

  const qualityColor = {
    green: "bg-green-100 text-green-700 border-green-300",
    gray: "bg-gray-100 text-gray-700 border-gray-300",
    red: "bg-red-100 text-red-700 border-red-300",
  }[qualityMultiplier.color];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Incentive Tracker</h1>
          <p className="text-sm text-emerald-100">{monthYear}</p>
        </div>

        {/* Earnings Summary */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3">
          <div className="text-center">
            <p className="text-sm text-emerald-100">Total Incentive Earned</p>
            <p className="text-4xl font-bold">₹{earnings.totalMonth.toLocaleString("en-IN")}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-green-500/20 rounded-lg p-2 text-center">
              <p className="text-emerald-100">70% Earned</p>
              <p className="text-xl font-bold">
                ₹{earnings.earned70Percent.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-emerald-100">Conversion</p>
            </div>
            <div className="bg-blue-500/20 rounded-lg p-2 text-center">
              <p className="text-emerald-100">30% Pending</p>
              <p className="text-xl font-bold">
                ₹{earnings.pending30Percent.toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-emerald-100">Retention (90d)</p>
            </div>
          </div>

          {earnings.forfeited > 0 && (
            <div className="bg-red-500/20 border border-red-400 rounded-lg p-2 text-center">
              <p className="text-sm">Forfeited: ₹{earnings.forfeited.toLocaleString("en-IN")}</p>
              <p className="text-xs">Customer churned before 90 days</p>
            </div>
          )}
        </div>

        {/* Quality Multiplier */}
        <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-100">Quality Multiplier</p>
              <p className="text-lg font-bold">{qualityMultiplier.label}</p>
              <p className="text-xs text-emerald-100">
                Retention: {(qualityMultiplier.retentionRate * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-3xl font-bold">{qualityMultiplier.multiplier}x</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <Card
                key={index}
                className={`border-2 ${
                  alert.severity === "CRITICAL"
                    ? "border-red-300 bg-red-50"
                    : "border-amber-300 bg-amber-50"
                } animate-pulse`}
              >
                <CardContent className="p-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm font-semibold text-red-700">{alert.message}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Incentive Split Visual */}
        <Card className="border-2 border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Incentive Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 70% Bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Conversion Earnings (70%)
                </span>
                <span className="text-sm font-bold text-green-600">
                  ₹{earnings.earned70Percent.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-10 bg-green-500 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">
                Paid on Subscription + First Payment
              </div>
            </div>

            {/* 30% Bar */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Retention Earnings (30%)
                </span>
                <span className="text-sm font-bold text-blue-600">
                  ₹{earnings.pending30Percent.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">
                Locked Until 90 Days
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Score Breakdown */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">KPI Score Breakdown</CardTitle>
            <p className="text-xs text-gray-600">
              Current: {kpiScore.total.toFixed(0)}/100 (Threshold: {kpiScore.threshold})
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Conversion */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Conversion (40%)</span>
                <span className="text-sm font-bold">
                  {kpiScore.conversion.toFixed(1)}/40
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500"
                  style={{ width: `${(kpiScore.conversion / 40) * 100}%` }}
                />
              </div>
            </div>

            {/* Retention */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Retention (30%)</span>
                <span className="text-sm font-bold">
                  {kpiScore.retention.toFixed(1)}/30
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${(kpiScore.retention / 30) * 100}%` }}
                />
              </div>
            </div>

            {/* Audit */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Audit (20%)</span>
                <span className="text-sm font-bold">{kpiScore.audit.toFixed(1)}/20</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(kpiScore.audit / 20) * 100}%` }}
                />
              </div>
            </div>

            {/* Complaints */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700">Complaints (10%)</span>
                <span className="text-sm font-bold">
                  {kpiScore.complaints.toFixed(1)}/10
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${(kpiScore.complaints / 10) * 100}%` }}
                />
              </div>
            </div>

            {/* Total Score */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900">Total Score</span>
                <Badge
                  variant="outline"
                  className={`text-lg ${
                    kpiScore.total >= kpiScore.threshold
                      ? "bg-green-100 text-green-700 border-green-300"
                      : "bg-red-100 text-red-700 border-red-300"
                  }`}
                >
                  {kpiScore.total.toFixed(0)}/100
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lead-Level Details (Expandable) */}
        <Card className="border-2 border-gray-200">
          <CardHeader className="pb-3">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => setShowLeadDetails(!showLeadDetails)}
            >
              <span className="font-bold">Lead-Level Details ({leadDetails.length})</span>
              {showLeadDetails ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
          </CardHeader>
          {showLeadDetails && (
            <CardContent className="space-y-2">
              {leadDetails.map((lead) => {
                const statusConfig = {
                  CONVERTED: {
                    label: "Converted",
                    color: "bg-green-100 text-green-700 border-green-300",
                    icon: CheckCircle,
                  },
                  PENDING: {
                    label: "Pending",
                    color: "bg-gray-100 text-gray-700 border-gray-300",
                    icon: TrendingUp,
                  },
                  EXPIRED: {
                    label: "Expired",
                    color: "bg-orange-100 text-orange-700 border-orange-300",
                    icon: XCircle,
                  },
                  CHURNED: {
                    label: "Churned",
                    color: "bg-red-100 text-red-700 border-red-300",
                    icon: XCircle,
                  },
                };

                const config = statusConfig[lead.status];
                const StatusIcon = config.icon;

                return (
                  <Card key={lead.leadId} className="border border-gray-300">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">
                            {lead.customerName}
                          </p>
                          <p className="text-xs text-gray-600">{lead.leadId}</p>
                        </div>
                        <Badge variant="outline" className={config.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>

                      {lead.conversionDate && (
                        <p className="text-xs text-gray-600 mb-2">
                          Converted: {lead.conversionDate.toLocaleDateString()}
                        </p>
                      )}

                      {/* Retention Status */}
                      {lead.status === "CONVERTED" && (
                        <div className="mb-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              lead.retentionStatus === "ACTIVE"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : lead.retentionStatus === "CHURNED"
                                ? "bg-red-100 text-red-700 border-red-300"
                                : "bg-gray-100 text-gray-700 border-gray-300"
                            }`}
                          >
                            Retention: {lead.retentionStatus}
                          </Badge>
                        </div>
                      )}

                      {/* Incentive Status */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div
                          className={`p-2 rounded ${
                            lead.incentive70Paid ? "bg-green-100" : "bg-gray-100"
                          }`}
                        >
                          <p className="font-semibold text-gray-700">
                            {lead.incentive70Paid ? "✓" : "⏳"} 70%
                          </p>
                          <p className="text-gray-600">₹{lead.amount70.toFixed(0)}</p>
                        </div>
                        <div
                          className={`p-2 rounded ${
                            lead.incentive30Status === "PAID"
                              ? "bg-green-100"
                              : lead.incentive30Status === "FORFEITED"
                              ? "bg-red-100"
                              : "bg-gray-100"
                          }`}
                        >
                          <p className="font-semibold text-gray-700">
                            {lead.incentive30Status === "PAID"
                              ? "✓"
                              : lead.incentive30Status === "FORFEITED"
                              ? "✗"
                              : "⏳"}{" "}
                            30%
                          </p>
                          <p className="text-gray-600">₹{lead.amount30.toFixed(0)}</p>
                        </div>
                      </div>

                      {lead.incentive30Status === "FORFEITED" && (
                        <p className="text-xs text-red-600 mt-2">Customer churned</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          )}
        </Card>

        {/* System Notice */}
        <Card className="border-2 border-yellow-300 bg-yellow-50">
          <CardContent className="p-3 flex items-center gap-2">
            <Lock className="h-5 w-5 text-yellow-700 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-yellow-900">
                System Calculated — No Manual Changes Allowed
              </p>
              <p className="text-xs text-yellow-700">
                Last updated: {calculatedAt.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
