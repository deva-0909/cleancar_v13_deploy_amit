/**
 * FieldCheckIn.tsx
 *
 * Check-In / Check-Out widget for Sales Head and Sales Manager.
 * Embedded as a tab inside both SalesHeadApp and SalesManagerApp.
 *
 * Flow:
 *   1. User taps "Start Field Day"
 *   2. Camera opens → selfie captured
 *   3. GPS captured → session created
 *   4. GPS trail starts silently in background
 *   5. User taps "End Field Day" → selfie + final GPS → session closed
 *   6. If location revoked from phone → auto checkout + toast warning
 *   7. Reinstatement request form shown for auto-checked-out sessions
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Camera, MapPin, Clock, CheckCircle2, XCircle,
  AlertTriangle, Navigation, RefreshCw, Send,
  Footprints, Shield, Info,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import {
  fieldTrackingService,
  type FieldSession,
  type TrackingState,
} from "../../services/fieldTrackingService";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(from: string, to?: string): string {
  const ms = (to ? new Date(to) : new Date()).getTime() - new Date(from).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

// ── Selfie Capture ─────────────────────────────────────────────────────────────

function SelfieCapturer({
  onCapture, onCancel, label,
}: {
  onCapture: (base64: string) => void;
  onCancel: () => void;
  label: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then(s => {
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError("Camera access denied. Please allow camera access."));
    return () => { stream?.getTracks().forEach(t => t.stop()); };
  }, []);

  const takeSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    const base64 = c.toDataURL("image/jpeg", 0.7);
    setCaptured(base64);
    stream?.getTracks().forEach(t => t.stop());
  };

  if (error) {
    return (
      <div className="text-center p-6 space-y-3">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto" />
        <p className="text-sm text-red-700">{error}</p>
        <Button variant="outline" onClick={onCancel}>Back</Button>
      </div>
    );
  }

  if (captured) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <img src={captured} alt="selfie" className="w-40 h-40 rounded-full object-cover border-4 border-green-400 mx-auto" />
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { setCaptured(null); navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then(s => { setStream(s); if (videoRef.current) videoRef.current.srcObject = s; }); }}>
            Retake
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => onCapture(captured)}>
            <CheckCircle2 className="w-4 h-4 mr-1" /> Use This
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-center">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="relative mx-auto w-48 h-48 rounded-full overflow-hidden border-4 border-blue-400 bg-gray-900">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={takeSelfie} className="gap-2">
          <Camera className="w-4 h-4" /> Take Selfie
        </Button>
      </div>
    </div>
  );
}

// ── Trail Map Preview (static SVG path) ───────────────────────────────────────

function TrailPreview({ trail }: { trail: FieldSession["trail"] }) {
  if (trail.length < 2) {
    return <p className="text-xs text-gray-400 text-center py-4">Trail starts after first movement</p>;
  }

  // Normalise to SVG space
  const lats = trail.map(p => p.lat);
  const lngs = trail.map(p => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const W = 280, H = 140, PAD = 20;

  const tx = (lng: number) => PAD + ((lng - minLng) / (maxLng - minLng || 1)) * (W - 2 * PAD);
  const ty = (lat: number) => H - PAD - ((lat - minLat) / (maxLat - minLat || 1)) * (H - 2 * PAD);

  const d = trail.map((p, i) => `${i === 0 ? "M" : "L"}${tx(p.lng).toFixed(1)},${ty(p.lat).toFixed(1)}`).join(" ");
  const first = trail[0], last = trail[trail.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full border rounded-lg bg-gray-50">
      <path d={d} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Start */}
      <circle cx={tx(first.lng)} cy={ty(first.lat)} r="5" fill="#22c55e" />
      {/* End */}
      <circle cx={tx(last.lng)} cy={ty(last.lat)} r="5" fill="#ef4444" />
      <text x="8" y="14" fontSize="9" fill="#22c55e">Start</text>
      <text x={W - 24} y="14" fontSize="9" fill="#ef4444">Now</text>
    </svg>
  );
}

// ── Reinstatement Form ─────────────────────────────────────────────────────────

function ReinstateForm({ session, onDone }: { session: FieldSession; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    if (!reason.trim()) { toast.error("Please provide a reason"); return; }
    setSubmitting(true);
    const result = fieldTrackingService.submitReinstateRequest(session.id, reason);
    if (result.ok) {
      toast.success("Reinstatement request submitted", {
        description: "Your manager will review within 24 hours.",
      });
      onDone();
    } else {
      toast.error(result.error);
    }
    setSubmitting(false);
  };

  return (
    <Card className="p-5 border-2 border-orange-200 bg-orange-50 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-orange-900">Attendance Auto-Checked-Out</p>
          <p className="text-sm text-orange-700 mt-0.5">
            Your field attendance was automatically closed at {formatTime(session.checkOutTime!)} because
            location access was revoked on your device. Submit a reinstatement request to restore your attendance.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Reason for location turning off *</Label>
        <Textarea
          rows={3}
          placeholder="e.g. Phone battery saver mode activated automatically, or accidentally denied location in settings..."
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="bg-white"
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={submit} disabled={submitting} className="gap-2 bg-orange-600 hover:bg-orange-700">
          {submitting
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</>
            : <><Send className="w-4 h-4" /> Submit Request</>
          }
        </Button>
        <Button variant="ghost" onClick={onDone}>Skip for now</Button>
      </div>
    </Card>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function FieldCheckIn() {
  const { currentUser, currentRole } = useRole();
  const [state, setState] = useState<TrackingState>(() => fieldTrackingService.getState());
  const [uiStep, setUiStep] = useState<"idle" | "selfie-in" | "selfie-out" | "reinstate">("idle");
  const [elapsed, setElapsed] = useState("");
  const [showTrail, setShowTrail] = useState(false);

  // Subscribe to service state changes
  useEffect(() => {
    return fieldTrackingService.subscribe(s => {
      setState(s);
      // Show reinstate form automatically on auto-checkout
      if (!s.isCheckedIn && s.session?.checkOutReason === "location_revoked") {
        if (!s.session.reinstateRequest) setUiStep("reinstate");
        toast.error("Location access revoked — attendance auto-closed", {
          description: "Please submit a reinstatement request.",
          duration: 8000,
        });
      }
    });
  }, []);

  // Live timer
  useEffect(() => {
    if (!state.isCheckedIn || !state.session) return;
    const interval = setInterval(() => {
      setElapsed(formatDuration(state.session!.checkInTime));
    }, 10000);
    setElapsed(formatDuration(state.session.checkInTime));
    return () => clearInterval(interval);
  }, [state.isCheckedIn, state.session]);

  const handleCheckIn = async (selfieBase64: string) => {
    setUiStep("idle");
    const result = await fieldTrackingService.checkIn({
      employeeId: currentUser.employeeId || "EMP-SH-001",
      employeeName: currentUser.name || currentRole,
      role: currentRole as "Sales Head" | "Sales Manager",
      selfieBase64,
    });
    if (result.ok) {
      toast.success("Field day started!", {
        description: "Your location is now being tracked.",
      });
    } else {
      toast.error(result.error || "Check-in failed");
    }
  };

  const handleCheckOut = async (selfieBase64: string) => {
    setUiStep("idle");
    const result = await fieldTrackingService.checkOut(selfieBase64);
    if (result.ok) {
      toast.success("Field day ended", {
        description: `Total: ${state.session ? formatDuration(state.session.checkInTime) : ""} · ${state.session?.totalDistanceKm ?? 0} km`,
      });
    }
  };

  const session = state.session;

  // ── Selfie screens ──
  if (uiStep === "selfie-in") {
    return (
      <Card className="p-6">
        <SelfieCapturer
          label="Take your check-in selfie"
          onCapture={handleCheckIn}
          onCancel={() => setUiStep("idle")}
        />
      </Card>
    );
  }

  if (uiStep === "selfie-out") {
    return (
      <Card className="p-6">
        <SelfieCapturer
          label="Take your check-out selfie"
          onCapture={handleCheckOut}
          onCancel={() => setUiStep("idle")}
        />
      </Card>
    );
  }

  // ── Reinstate screen ──
  if (uiStep === "reinstate" && session?.checkOutReason === "location_revoked" && !session.reinstateRequest) {
    return <ReinstateForm session={session} onDone={() => setUiStep("idle")} />;
  }

  // ── Checked IN state ──
  if (state.isCheckedIn && session) {
    return (
      <div className="space-y-4">
        {/* Status banner */}
        <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-400">
                {session.checkInSelfieBase64
                  ? <img src={session.checkInSelfieBase64} alt="selfie" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-green-200 flex items-center justify-center"><Camera className="w-5 h-5 text-green-700" /></div>
                }
              </div>
              <div>
                <p className="font-semibold text-green-900">Field Day Active</p>
                <p className="text-sm text-green-700">
                  Checked in {formatTime(session.checkInTime)} · {elapsed} elapsed
                </p>
              </div>
            </div>
            <Badge className="bg-green-600 animate-pulse">Live Tracking</Badge>
          </div>

          {/* Trail stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { icon: <Footprints className="w-4 h-4" />, label: "Distance",  val: `${session.totalDistanceKm} km` },
              { icon: <Navigation className="w-4 h-4" />,  label: "GPS Points", val: session.trail.length },
              { icon: <MapPin className="w-4 h-4" />,      label: "Accuracy",  val: `~${session.trail[session.trail.length-1]?.accuracy ?? "—"}m` },
            ].map(m => (
              <div key={m.label} className="bg-white rounded-lg p-3 text-center border">
                <div className="flex justify-center text-green-600 mb-1">{m.icon}</div>
                <p className="text-xs text-gray-500">{m.label}</p>
                <p className="font-bold text-gray-900">{m.val}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Location trail toggle */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" /> Location Trail
            </p>
            <Button size="sm" variant="ghost" onClick={() => setShowTrail(s => !s)}>
              {showTrail ? "Hide" : "Show"} Trail
            </Button>
          </div>
          {showTrail && <TrailPreview trail={session.trail} />}
          {showTrail && session.trail.length > 0 && (
            <p className="text-xs text-gray-400 mt-2 text-center">
              Last point: {formatCoords(session.trail[session.trail.length-1].lat, session.trail[session.trail.length-1].lng)}
              · {formatTime(session.trail[session.trail.length-1].ts)}
            </p>
          )}
        </Card>

        {/* Info box */}
        <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            If you turn off location access on your phone, attendance will be auto-closed and you'll
            need to submit a reinstatement request. Network issues won't trigger auto-checkout.
          </span>
        </div>

        {/* Check-out button */}
        <Button
          onClick={() => setUiStep("selfie-out")}
          variant="outline"
          className="w-full border-2 border-red-300 text-red-700 hover:bg-red-50 gap-2 py-6 text-base font-semibold"
        >
          <XCircle className="w-5 h-5" /> End Field Day
        </Button>

        {/* Error state */}
        {state.lastError && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />{state.lastError}
          </div>
        )}
      </div>
    );
  }

  // ── Checked OUT state ──
  if (!state.isCheckedIn && session) {
    const durationStr = formatDuration(session.checkInTime, session.checkOutTime ?? undefined);
    return (
      <div className="space-y-4">
        {/* Summary card */}
        <Card className="p-5 border-2 border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-8 h-8 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900">Field Day Complete</p>
              <p className="text-sm text-gray-500">{session.date}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Duration",  val: durationStr },
              { label: "Distance",  val: `${session.totalDistanceKm} km` },
              { label: "GPS Points",val: session.trail.length },
            ].map(m => (
              <div key={m.label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500">{m.label}</p>
                <p className="font-bold">{m.val}</p>
              </div>
            ))}
          </div>

          {session.checkOutReason === "location_revoked" && (
            <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Auto-checked out — location access was revoked
              {session.reinstateRequest
                ? ` · Reinstatement: ${session.reinstateRequest.status}`
                : <Button size="sm" variant="ghost" className="ml-auto text-xs h-auto py-0.5" onClick={() => setUiStep("reinstate")}>Submit Request</Button>
              }
            </div>
          )}

          <Button
            variant="ghost" size="sm"
            className="w-full mt-3 text-xs"
            onClick={() => setShowTrail(s => !s)}
          >
            {showTrail ? "Hide" : "View"} Trail
          </Button>
          {showTrail && <TrailPreview trail={session.trail} />}
        </Card>

        {/* Start new day */}
        <Button
          className="w-full bg-green-600 hover:bg-green-700 gap-2 py-6 text-base font-semibold"
          onClick={() => setUiStep("selfie-in")}
        >
          <Camera className="w-5 h-5" /> Start Field Day
        </Button>
      </div>
    );
  }

  // ── Not yet checked in ──
  return (
    <div className="space-y-5">
      <Card className="p-6 text-center space-y-4 border-2 border-dashed border-gray-300">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <MapPin className="w-8 h-8 text-gray-400" />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">Not Checked In</p>
          <p className="text-sm text-gray-500 mt-1">
            Start your field day to begin location tracking and attendance.
          </p>
        </div>
        <Button
          className="w-full bg-green-600 hover:bg-green-700 gap-2 py-5 text-base font-semibold"
          onClick={() => setUiStep("selfie-in")}
        >
          <Camera className="w-5 h-5" /> Start Field Day
        </Button>
      </Card>

      <Card className="p-4 space-y-2">
        <p className="text-sm font-medium flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" /> How it works
        </p>
        {[
          "Take a selfie to check in — GPS is captured automatically",
          "Your location is tracked in the background while you're in the field",
          "Tap End Field Day and take a check-out selfie when done",
          "Turning off phone location auto-closes attendance — a reinstatement request is needed",
          "Network issues don't trigger auto-checkout — only location revocation does",
        ].map((t, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 text-xs">{i + 1}</span>
            {t}
          </div>
        ))}
      </Card>
    </div>
  );
}
