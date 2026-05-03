/**
 * TSM LEAD PIPELINE & CRM MONITOR
 * Lead stage tracking, SLA monitoring, and CRM compliance oversight
 *
 * Philosophy: Pipeline governance, not lead execution
 * Shows: Stage status, SLA health, assignment distribution
 * Actions: Reassign leads, approve lost leads (governance only)
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  Phone,
  RefreshCw,
} from "lucide-react";
import { teleSalesManagerService } from "../../services/teleSalesManagerService";
import type { Lead, LeadStage, LeadSource } from "../../types/teleSalesManager.types";

export function TSMLeadPipeline() {
  const [selectedStage, setSelectedStage] = useState<LeadStage | "ALL">("ALL");
  const [selectedSLA, setSelectedSLA] = useState<"MET" | "AT_RISK" | "BREACHED" | "ALL">("ALL");
  const [leads, setLeads] = useState(teleSalesManagerService.getLeadPipeline());

  const filteredLeads = leads.filter((lead) => {
    if (selectedStage !== "ALL" && lead.stage !== selectedStage) return false;
    if (selectedSLA !== "ALL" && lead.slaStatus !== selectedSLA) return false;
    return true;
  });

  const getStageBadgeColor = (stage: LeadStage) => {
    switch (stage) {
      case "NEW":
        return "bg-blue-600";
      case "ATTEMPTED":
        return "bg-purple-600";
      case "FOLLOW_UP":
        return "bg-indigo-600";
      case "CONVERTED":
        return "bg-green-600";
      case "LOST":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getSLABadgeColor = (slaStatus: string) => {
    switch (slaStatus) {
      case "MET":
        return "bg-green-600";
      case "AT_RISK":
        return "bg-amber-600";
      case "BREACHED":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getSourceBadge = (source: LeadSource) => {
    const colors: Record<LeadSource, string> = {
      WEBSITE: "bg-blue-100 text-blue-700 border-blue-300",
      REFERRAL: "bg-purple-100 text-purple-700 border-purple-300",
      MARKETING: "bg-pink-100 text-pink-700 border-pink-300",
      WALK_IN: "bg-green-100 text-green-700 border-green-300",
      OTHER: "bg-gray-100 text-gray-700 border-gray-300",
    };
    return colors[source];
  };

  const handleReassignLead = (leadId: string, toTSEId: string) => {
    const success = teleSalesManagerService.reassignLead(leadId, toTSEId, "TSM-001");
    if (success) {
      setLeads(teleSalesManagerService.getLeadPipeline());
    }
  };

  const handleApproveLost = (leadId: string, reason: string) => {
    const success = teleSalesManagerService.approveLostLead(leadId, reason, "TSM-001");
    if (success) {
      setLeads(teleSalesManagerService.getLeadPipeline());
    }
  };

  // Pipeline summary stats
  const pipelineStats = {
    total: leads.length,
    new: leads.filter((l) => l.stage === "NEW").length,
    attempted: leads.filter((l) => l.stage === "ATTEMPTED").length,
    followUp: leads.filter((l) => l.stage === "FOLLOW_UP").length,
    converted: leads.filter((l) => l.stage === "CONVERTED").length,
    lost: leads.filter((l) => l.stage === "LOST").length,
    slaBreached: leads.filter((l) => l.slaStatus === "BREACHED").length,
    slaAtRisk: leads.filter((l) => l.slaStatus === "AT_RISK").length,
    crmNonCompliant: leads.filter((l) => !l.crmCompliant).length,
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Summary Stats */}
      <div className="grid grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-xs text-gray-500 mb-1">Total Leads</div>
          <div className="text-2xl font-bold text-gray-900">
            {pipelineStats.total}
          </div>
        </Card>
        <Card className="p-4 border-2 border-blue-200 bg-blue-50">
          <div className="text-xs text-gray-600 mb-1">New</div>
          <div className="text-2xl font-bold text-blue-600">
            {pipelineStats.new}
          </div>
        </Card>
        <Card className="p-4 border-2 border-purple-200 bg-purple-50">
          <div className="text-xs text-gray-600 mb-1">Attempted</div>
          <div className="text-2xl font-bold text-purple-600">
            {pipelineStats.attempted}
          </div>
        </Card>
        <Card className="p-4 border-2 border-indigo-200 bg-indigo-50">
          <div className="text-xs text-gray-600 mb-1">Follow-up</div>
          <div className="text-2xl font-bold text-indigo-600">
            {pipelineStats.followUp}
          </div>
        </Card>
        <Card className="p-4 border-2 border-red-200 bg-red-50">
          <div className="text-xs text-gray-600 mb-1">SLA Breached</div>
          <div className="text-2xl font-bold text-red-600">
            {pipelineStats.slaBreached}
          </div>
        </Card>
        <Card className="p-4 border-2 border-amber-200 bg-amber-50">
          <div className="text-xs text-gray-600 mb-1">CRM Non-Compliant</div>
          <div className="text-2xl font-bold text-amber-600">
            {pipelineStats.crmNonCompliant}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          {/* Stage Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Stage:</span>
            <div className="flex gap-1">
              <Button
                variant={selectedStage === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage("ALL")}
              >
                All
              </Button>
              <Button
                variant={selectedStage === "NEW" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage("NEW")}
              >
                New ({pipelineStats.new})
              </Button>
              <Button
                variant={selectedStage === "ATTEMPTED" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage("ATTEMPTED")}
              >
                Attempted ({pipelineStats.attempted})
              </Button>
              <Button
                variant={selectedStage === "FOLLOW_UP" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage("FOLLOW_UP")}
              >
                Follow-up ({pipelineStats.followUp})
              </Button>
            </div>
          </div>

          {/* SLA Filter */}
          <div className="flex items-center gap-2 ml-6">
            <span className="text-xs text-gray-600">SLA:</span>
            <div className="flex gap-1">
              <Button
                variant={selectedSLA === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSLA("ALL")}
              >
                All
              </Button>
              <Button
                variant={selectedSLA === "BREACHED" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSLA("BREACHED")}
                className={selectedSLA === "BREACHED" ? "bg-red-600" : ""}
              >
                Breached ({pipelineStats.slaBreached})
              </Button>
              <Button
                variant={selectedSLA === "AT_RISK" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSLA("AT_RISK")}
                className={selectedSLA === "AT_RISK" ? "bg-amber-600" : ""}
              >
                At Risk ({pipelineStats.slaAtRisk})
              </Button>
            </div>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredLeads.length} of {pipelineStats.total} leads
          </div>
        </div>
      </Card>

      {/* Lead List */}
      <div className="space-y-3">
        {filteredLeads.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-gray-500">No leads match the selected filters</div>
          </Card>
        )}

        {filteredLeads.map((lead) => (
          <Card
            key={lead.id}
            className={`p-4 ${
              lead.slaStatus === "BREACHED"
                ? "border-2 border-red-300 bg-red-50"
                : lead.slaStatus === "AT_RISK"
                ? "border-2 border-amber-300 bg-amber-50"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Lead Info */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div>
                  <div className="font-semibold text-gray-900">
                    {lead.customerName}
                  </div>
                  <div className="text-sm text-gray-600">{lead.phone}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Lead ID: {lead.id}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={getStageBadgeColor(lead.stage)}>
                    {lead.stage.replace("_", " ")}
                  </Badge>
                  <Badge className={getSLABadgeColor(lead.slaStatus)}>
                    {lead.slaStatus === "BREACHED" && (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    )}
                    {lead.slaStatus === "AT_RISK" && (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {lead.slaStatus === "MET" && (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    SLA {lead.slaStatus}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getSourceBadge(lead.source)}
                  >
                    {lead.source}
                  </Badge>
                  {!lead.crmCompliant && (
                    <Badge className="bg-amber-600">
                      <XCircle className="w-3 h-3 mr-1" />
                      CRM Issue
                    </Badge>
                  )}
                </div>
              </div>

              {/* Lead Metrics */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Assigned To</div>
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {lead.tseName}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-500">Attempts</div>
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {lead.attemptCount}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-500">Est. Value</div>
                  <div className="text-sm font-semibold text-green-600">
                    ₹{(lead.estimatedValue / 1000).toFixed(0)}K
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-500">Created</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {new Date(lead.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {lead.slaMinutesRemaining !== undefined && (
                  <div className="text-center">
                    <div className="text-xs text-gray-500">SLA Remaining</div>
                    <div
                      className={`text-sm font-semibold ${
                        lead.slaMinutesRemaining < 0
                          ? "text-red-600"
                          : lead.slaMinutesRemaining < 60
                          ? "text-amber-600"
                          : "text-green-600"
                      }`}
                    >
                      {lead.slaMinutesRemaining < 0
                        ? `${Math.abs(lead.slaMinutesRemaining)} min overdue`
                        : `${lead.slaMinutesRemaining} min`}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {lead.stage === "LOST" && !lead.approvedBy && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const reason = lead.lostReason || "Price too high";
                      handleApproveLost(lead.id, reason);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approve Lost
                  </Button>
                )}

                {lead.attemptCount >= 10 && lead.stage !== "CONVERTED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // In real app, would show TSE selection modal
                      handleReassignLead(lead.id, "TSE-002");
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reassign
                  </Button>
                )}

                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>

            {/* Additional Info Row */}
            {(lead.lastContactedAt || lead.nextFollowUpDate || lead.lostReason) && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-6 text-xs text-gray-600">
                {lead.lastContactedAt && (
                  <div>
                    Last Contact:{" "}
                    {new Date(lead.lastContactedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
                {lead.nextFollowUpDate && (
                  <div>
                    Next Follow-up:{" "}
                    {new Date(lead.nextFollowUpDate).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
                {lead.lostReason && (
                  <div className="text-red-600">
                    Lost Reason: {lead.lostReason}
                  </div>
                )}
                {lead.approvedBy && (
                  <div className="text-green-600">
                    Approved by: {lead.approvedBy}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
