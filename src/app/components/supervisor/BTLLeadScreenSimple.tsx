/**
 * SIMPLIFIED BTL Lead Screen - DIAGNOSTIC VERSION
 * Minimal version to test rendering
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Plus, TrendingUp, Navigation, Phone, MapPin } from "lucide-react";
import { systemStateService } from "../../services/systemStateService";
import type { VehicleType, InterestLevel } from "../../services/btlLeadService";
import { logger } from "../../services/logger";

export interface BTLLeadScreenSimpleProps {
  leads: any[];
  metrics: any;
  onSubmitLead: (
    name: string,
    mobile: string,
    vehicleType: any,
    location: { lat: number; lng: number; address: string },
    interestLevel: any,
    gpsLocation: { lat: number; lng: number }
  ) => void;
  onViewPipeline: (leadId: string) => void;
}

export function BTLLeadScreenSimple({ leads, metrics, onSubmitLead, onViewPipeline }: BTLLeadScreenSimpleProps) {
  const [showCaptureForm, setShowCaptureForm] = useState(false);
  logger.log("🎯 BTLLeadScreenSimple RENDERED with", leads.length, "leads");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* MEGA VISIBLE DEBUG BANNER */}
      <div className="bg-yellow-400 border-4 border-black p-6 m-4">
        <h1 className="text-3xl font-black text-center text-black mb-2">
          ✅ BTL LEAD SCREEN IS RENDERING!
        </h1>
        <div className="bg-white p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-600">Leads Count: {leads.length}</p>
          <p className="text-xl font-bold text-blue-600">Metrics Total: {metrics?.totalLeads || 0}</p>
        </div>
      </div>

      {/* HEADER */}
      <div className="bg-indigo-600 text-white p-4">
        <h1 className="text-xl font-bold">BTL Lead Generation</h1>
        <p className="text-sm">Simplified Version for Testing</p>

        {/* Capture Button */}
        <Button
          className="w-full mt-3 h-12 bg-white text-indigo-700 hover:bg-indigo-50 font-bold"
          onClick={() => setShowCaptureForm(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Capture New Lead
        </Button>
      </div>

      {/* METRICS CARDS */}
      <div className="p-4 space-y-3">
        <Card className="bg-green-50 border-2 border-green-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-700">{metrics?.totalLeads || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-2 border-blue-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Converted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{metrics?.converted || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-2 border-amber-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-700">{metrics?.pending || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* LEADS LIST */}
      <div className="p-4 space-y-3">
        <h2 className="text-xl font-bold">All Leads ({leads.length})</h2>
        
        {leads.length === 0 ? (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardContent className="p-6 text-center">
              <p className="text-xl font-bold text-red-700">❌ NO LEADS FOUND</p>
              <p className="text-sm text-red-600 mt-2">The leads array is empty</p>
            </CardContent>
          </Card>
        ) : (
          leads.map((lead, index) => (
            <Card key={lead.id || index} className="border-2 border-gray-300">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-lg font-bold">{lead.name}</p>
                    <p className="text-sm text-gray-600">{lead.mobile}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700">
                    {lead.status}
                  </Badge>
                </div>

                {/* Assignment Info */}
                {lead.assignedToTSEName && (
                  <div className="mb-2 p-2 bg-indigo-50 border border-indigo-200 rounded">
                    <p className="text-xs text-indigo-700">
                      📞 Assigned to: <span className="font-bold">{lead.assignedToTSEName}</span>
                    </p>
                    {lead.assignedDate && (
                      <p className="text-xs text-indigo-600">
                        Since: {new Date(lead.assignedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                <div className="text-sm text-gray-600 space-y-1">
                  <p>Vehicle: {lead.vehicleType}</p>
                  <p>Interest: {lead.interestLevel}</p>
                  <p>Location: {lead.location?.address || 'N/A'}</p>
                  {lead.lastActivityDate && (
                    <p className="text-xs text-gray-500">
                      Last activity: {new Date(lead.lastActivityDate).toLocaleDateString()} by {lead.lastActivityBy || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-9 mt-3"
                  onClick={() => onViewPipeline(lead.id)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Pipeline
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Capture Form Modal */}
      {showCaptureForm && (
        <LeadCaptureForm
          onSubmit={(name, mobile, vehicleType, location, interestLevel, gps) => {
            onSubmitLead(name, mobile, vehicleType, location, interestLevel, gps);
            setShowCaptureForm(false);
          }}
          onCancel={() => setShowCaptureForm(false)}
        />
      )}
    </div>
  );
}

// ========== LEAD CAPTURE FORM ==========

interface LeadCaptureFormProps {
  onSubmit: (
    name: string,
    mobile: string,
    vehicleType: VehicleType,
    location: { lat: number; lng: number; address: string },
    interestLevel: InterestLevel,
    gpsLocation: { lat: number; lng: number }
  ) => void;
  onCancel: () => void;
}

function LeadCaptureForm({ onSubmit, onCancel }: LeadCaptureFormProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType | undefined>();
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | undefined>();
  const [interestLevel, setInterestLevel] = useState<InterestLevel | undefined>();
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateCheck, setDuplicateCheck] = useState<{
    isDuplicate: boolean;
    leadId?: string;
    submittedDate?: Date;
  } | null>(null);

  // Check for duplicate when mobile changes
  const handleMobileChange = (value: string) => {
    setMobile(value);
    if (value.length === 10) {
      const result = systemStateService.checkDuplicateLead(value);
      setDuplicateCheck(result);
    } else {
      setDuplicateCheck(null);
    }
  };

  // Simulate GPS capture
  const captureGPS = () => {
    setGpsEnabled(true);
    setLocation({
      lat: 21.1702,
      lng: 72.8311,
      address: "Captured Location (GPS)",
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name || name.trim().length < 2) {
      newErrors.name = "Name is required (minimum 2 characters)";
    }

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      newErrors.mobile = "Valid 10-digit mobile number required";
    }

    if (!vehicleType) {
      newErrors.vehicleType = "Vehicle type is required";
    }

    if (!location) {
      newErrors.location = "Location is required (GPS pin)";
    }

    if (!interestLevel) {
      newErrors.interestLevel = "Interest level is required";
    }

    if (!gpsEnabled) {
      newErrors.gps = "GPS capture is mandatory";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit(
      name,
      mobile,
      vehicleType!,
      location!,
      interestLevel!,
      { lat: 21.1702, lng: 72.8311 }
    );
  };

  const allFieldsFilled = name && mobile && vehicleType && location && interestLevel && gpsEnabled;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-md my-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Capture BTL Lead</CardTitle>
          <p className="text-xs text-gray-600">All fields are mandatory</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Name */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              className={`w-full h-10 px-3 border rounded-lg ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Mobile */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Mobile <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              className={`w-full h-10 px-3 border rounded-lg ${
                errors.mobile ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="10-digit mobile number"
              value={mobile}
              onChange={(e) => handleMobileChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
            {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>}
            {duplicateCheck?.isDuplicate && (
              <p className="text-xs text-red-600 mt-1">
                Duplicate lead found! Lead ID: {duplicateCheck.leadId}, Submitted on: {duplicateCheck.submittedDate?.toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Vehicle Type <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["4W_SEDAN", "4W_SUV", "2W_BIKE", "2W_SCOOTER"] as VehicleType[]).map((type) => (
                <button
                  key={type}
                  className={`h-10 rounded-lg border-2 text-sm font-semibold ${
                    vehicleType === type
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                  onClick={() => setVehicleType(type)}
                >
                  {type.replace("_", " ")}
                </button>
              ))}
            </div>
            {errors.vehicleType && <p className="text-xs text-red-600 mt-1">{errors.vehicleType}</p>}
          </div>

          {/* Location (GPS Pin) */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Location <span className="text-red-600">*</span>
            </label>
            <Button
              variant="outline"
              className={`w-full h-12 ${
                location ? "border-green-500 bg-green-50 text-green-700" : ""
              }`}
              onClick={captureGPS}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {location ? `✓ ${location.address}` : "Capture GPS Location"}
            </Button>
            {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
            {errors.gps && <p className="text-xs text-red-600 mt-1">{errors.gps}</p>}
          </div>

          {/* Interest Level */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Interest Level <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["HOT", "WARM", "COLD"] as InterestLevel[]).map((level) => (
                <button
                  key={level}
                  className={`h-10 rounded-lg border-2 text-sm font-semibold ${
                    interestLevel === level
                      ? level === "HOT"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : level === "WARM"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                  onClick={() => setInterestLevel(level)}
                >
                  {level}
                </button>
              ))}
            </div>
            {errors.interestLevel && <p className="text-xs text-red-600 mt-1">{errors.interestLevel}</p>}
          </div>

          {/* Submit */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSubmit}
              disabled={!allFieldsFilled}
            >
              Submit Lead
            </Button>
          </div>

          {!allFieldsFilled && (
            <p className="text-xs text-center text-red-600">
              ⚠️ All fields must be filled
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
