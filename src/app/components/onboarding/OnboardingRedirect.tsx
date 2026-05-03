/**
 * Onboarding Redirect
 * Redirects /onboard/:empId to /onboarding/:empId
 */

import { Navigate, useParams } from "react-router";

export function OnboardingRedirect() {
  const { empId } = useParams<{ empId: string }>();
  return <Navigate to={`/onboarding/${empId}`} replace />;
}
