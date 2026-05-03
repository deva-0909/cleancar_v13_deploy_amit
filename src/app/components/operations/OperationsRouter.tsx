/**
 * OPERATIONS ROUTER
 * Role-aware routing for Operations module
 *
 * Routes users to appropriate operations view based on their role:
 * - City Manager → City Command Center (cluster oversight)
 * - Cluster Manager → Cluster Control Tower (OM oversight)
 * - Operations Manager → Team Operations (team execution)
 * - Sr Operations Manager → Team Operations
 */

import { useRole } from "../../contexts/RoleContext";
import { CityManagerApp } from "../city/CityManagerApp";
import { ClusterManagerApp } from "../cm/ClusterManagerApp";
import { OperationsManagerApp } from "../om/OperationsManagerApp";
import { Navigate } from "react-router";

export function OperationsRouter() {
  const { currentRole } = useRole();

  // Route based on role
  switch (currentRole) {
    case "City Manager":
      return <CityManagerApp />;

    case "Cluster Manager":
      return <ClusterManagerApp />;

    case "Operations Manager":
    case "Sr Operations Manager":
      return <OperationsManagerApp />;

    case "Supervisor":
      // Supervisors have their own dedicated app
      return <Navigate to="/supervisor-app" replace />;

    case "Super Admin":
    case "Admin":
      // Admins default to City Manager view for overview
      return <CityManagerApp />;

    default:
      // Other roles shouldn't have access to operations
      return <Navigate to="/" replace />;
  }
}
