import { useState } from "react";
import { useNavigate } from "react-router";
import { Building2, Eye, EyeOff, Phone, Lock, AlertTriangle, ArrowRight } from "lucide-react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { authService } from "../services/authService";

type LoginView = "login" | "forgot_otp_request" | "forgot_otp_verify" | "forgot_reset";

export function LoginPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<LoginView>("login");

  // Login form
  const [loginMobile, setLoginMobile] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password
  const [forgotMobile, setForgotMobile] = useState("");
  const [forgotOTP, setForgotOTP] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotInfo, setForgotInfo] = useState("");

  const handleLogin = async () => {
    if (!loginMobile || !loginPassword) {
      setLoginError("Please enter your mobile number and password.");
      return;
    }
    setIsLoading(true);
    setLoginError("");
    try {
      const result = authService.login({ loginMobile, password: loginPassword });

      if (result.success) {
        // Store session
        localStorage.setItem("cc360_session", JSON.stringify({
          employeeId: result.employeeId,
          employeeName: result.employeeName,
          role: result.role,
          cityId: result.cityId,
          loginTime: new Date().toISOString(),
        }));
        toast.success(`Welcome back, ${result.employeeName}!`);
        navigate("/");
      } else {
        switch (result.error) {
          case "PENDING_ONBOARDING":
            setLoginError("Your account is pending onboarding. Please complete the onboarding form sent to you by HR.");
            break;
          case "PENDING_PASSWORD_SET":
            setLoginError("Please complete your onboarding and set your password before logging in.");
            break;
          case "ACCOUNT_LOCKED":
            const unlockTime = result.lockedUntil ? new Date(result.lockedUntil).toLocaleTimeString() : "";
            setLoginError(`Account locked after too many attempts. Try again after ${unlockTime}.`);
            break;
          default:
            setLoginError(`Incorrect mobile number or password. ${
              result.remainingAttempts !== undefined
                ? `${result.remainingAttempts} attempts remaining before lockout.`
                : ""
            }`);
        }
      }
    } catch (err) {
      setLoginError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOTP = () => {
    if (!forgotMobile || forgotMobile.length !== 10) {
      setForgotError("Please enter your 10-digit registered mobile number.");
      return;
    }
    // Find employee by mobile
    const { employeeDatabaseService } = require("../services/employeeDatabaseService");
    const employee = employeeDatabaseService.getAll().find(
      (e: any) => e.loginMobile === forgotMobile || e.mobile === forgotMobile
    );
    if (!employee) {
      setForgotError("Mobile number not found. Please contact HR.");
      return;
    }
    const result = authService.initiatePasswordReset(employee.id, "self_service");
    if (result.success) {
      setForgotInfo(`OTP sent to ${result.maskedMobile}. Valid for 15 minutes.`);
      // In demo mode, show OTP in console. In production: WhatsApp API.
      console.log("[Demo] OTP:", result.otp);
      setForgotError("");
      setView("forgot_otp_verify");
    }
  };

  const handleResetPassword = () => {
    const result = authService.resetPasswordWithOTP(
      forgotMobile, forgotOTP, newPassword, confirmPassword
    );
    if (result.success) {
      toast.success("Password reset successfully! Please log in with your new password.");
      setView("login");
      setForgotMobile(""); setForgotOTP(""); setNewPassword(""); setConfirmPassword("");
    } else {
      setForgotError(result.error || "Reset failed. Please contact HR.");
    }
  };

  // ── RENDER ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900
                    flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center
                          mx-auto mb-4 shadow-lg">
            <Building2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CleanCar 360°</h1>
          <p className="text-blue-300 text-sm mt-1">Enterprise Resource Planning</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-7">

          {/* ── LOGIN VIEW ── */}
          {view === "login" && (
            <>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Sign In</h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Mobile Number</Label>
                  <div className="relative mt-1.5">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      type="tel" maxLength={10}
                      placeholder="10-digit mobile number"
                      value={loginMobile}
                      onChange={e => { setLoginMobile(e.target.value); setLoginError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                      className="pl-10 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Your password"
                      value={loginPassword}
                      onChange={e => { setLoginPassword(e.target.value); setLoginError(""); }}
                      onKeyDown={e => e.key === "Enter" && handleLogin()}
                      className="pl-10 pr-10 font-mono"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{loginError}</p>
                  </div>
                )}

                <Button onClick={handleLogin} disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 min-h-[48px] text-base font-semibold">
                  {isLoading ? "Signing in..." : "Sign In"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <button onClick={() => { setView("forgot_otp_request"); setLoginError(""); }}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 text-center mt-2">
                  Forgot password?
                </button>

                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-gray-500 text-center">
                    New employee? Complete the onboarding link sent by HR.
                    <br />Contact HR if you haven't received your link.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ── FORGOT — ENTER MOBILE ── */}
          {view === "forgot_otp_request" && (
            <>
              <button onClick={() => setView("login")} className="text-sm text-blue-600 mb-4 flex items-center gap-1">
                ← Back to Login
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Forgot Password</h2>
              <p className="text-sm text-gray-600 mb-5">
                Enter your registered mobile number. An OTP will be sent to you.
              </p>
              <div className="space-y-4">
                <div>
                  <Label>Mobile Number</Label>
                  <Input type="tel" maxLength={10} placeholder="10-digit mobile number"
                    value={forgotMobile} onChange={e => { setForgotMobile(e.target.value); setForgotError(""); }}
                    className="mt-1.5 font-mono" />
                </div>
                {forgotError && <p className="text-sm text-red-600">{forgotError}</p>}
                <Button onClick={handleRequestOTP} className="w-full bg-blue-600 hover:bg-blue-700 min-h-[44px]">
                  Send OTP
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  If your mobile is not registered, contact HR to retrieve your login ID.
                </p>
              </div>
            </>
          )}

          {/* ── FORGOT — ENTER OTP + NEW PASSWORD ── */}
          {(view === "forgot_otp_verify") && (
            <>
              <button onClick={() => setView("forgot_otp_request")} className="text-sm text-blue-600 mb-4">
                ← Back
              </button>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Password</h2>
              {forgotInfo && <p className="text-sm text-green-700 bg-green-50 rounded p-2 mb-4">{forgotInfo}</p>}
              <div className="space-y-4">
                <div>
                  <Label>OTP (6 digits)</Label>
                  <Input type="tel" maxLength={6} placeholder="Enter OTP from WhatsApp"
                    value={forgotOTP} onChange={e => { setForgotOTP(e.target.value); setForgotError(""); }}
                    className="mt-1.5 font-mono text-center text-xl tracking-widest" />
                </div>
                <div>
                  <Label>New Password</Label>
                  <div className="relative mt-1.5">
                    <Input type={showNew ? "text" : "password"} placeholder="Min 8 chars with a number"
                      value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className="pr-10 font-mono" />
                    <button type="button" onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-2.5 text-gray-400">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="Re-enter new password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="mt-1.5 font-mono" />
                </div>
                {forgotError && <p className="text-sm text-red-600">{forgotError}</p>}
                <Button onClick={handleResetPassword}
                  disabled={!forgotOTP || !newPassword || newPassword !== confirmPassword}
                  className="w-full bg-green-600 hover:bg-green-700 min-h-[44px]">
                  Reset Password
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Demo credentials panel */}
        <details className="mt-6 rounded-xl border border-blue-800/40 bg-blue-950/40 text-xs text-blue-200 overflow-hidden">
          <summary className="cursor-pointer px-4 py-2.5 font-semibold text-blue-300 select-none">
            🔑 Demo login credentials
          </summary>
          <div className="px-4 pb-3 pt-1 space-y-1 font-mono">
            <p className="text-blue-400 mb-2">Password for all accounts: <span className="text-white font-bold">Demo@1234</span></p>
            {[
              ["9000000001", "Super Admin"],
              ["9000000002", "Admin"],
              ["9000000003", "City Manager"],
              ["9000000004", "Cluster Manager"],
              ["9000000005", "Sr Operations Manager"],
              ["9000000006", "Operations Manager"],
              ["9000000007", "Manager"],
              ["9000000008", "Supervisor"],
              ["9000000009", "Car Washer"],
              ["9000000010", "TSM"],
              ["9000000011", "TSE"],
              ["9000000012", "CCE"],
              ["9000000013", "Store Manager"],
              ["9000000014", "Procurement Manager"],
              ["9000000015", "Accounts"],
              ["9000000016", "HR"],
            ].map(([mobile, role]) => (
              <div key={mobile} className="flex justify-between gap-4 py-0.5 border-b border-blue-800/30">
                <span className="text-blue-300">{mobile}</span>
                <span className="text-blue-100">{role}</span>
              </div>
            ))}
          </div>
        </details>

        <p className="text-center text-blue-400 text-xs mt-4">
          © 2026 CleanCar 360° · Shine. Trust. Speed.
        </p>
      </div>
    </div>
  );
}
