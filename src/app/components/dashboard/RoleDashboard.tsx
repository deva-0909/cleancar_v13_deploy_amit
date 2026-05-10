// Dynamic dashboard component that renders based on role
import { useRole } from "../../contexts/RoleContext";
import { ExecutiveDashboard } from "./ExecutiveDashboard";
import { WasherDashboard } from "./WasherDashboard";
import { SupervisorDashboard } from "./SupervisorDashboard";
import { SalesDashboard } from "./SalesDashboard";
import { CustomerCareDashboard } from "./CustomerCareDashboard";
import { FinanceDashboard } from "./FinanceDashboard";
import { InventoryDashboard } from "./InventoryDashboard";
import { HRDashboard } from "./HRDashboard";
import { OperationsDashboard } from "./OperationsDashboard";
import { CityDashboard } from "./CityDashboard";
import { ProcurementDashboard } from "./ProcurementDashboard";

export function RoleDashboard() {
  const { roleConfig } = useRole();

  // Safety check for roleConfig
  if (!roleConfig || !roleConfig.dashboardType) {
    return <ExecutiveDashboard />;
  }

  switch (roleConfig.dashboardType) {
    case "executive":
      return <ExecutiveDashboard />;
    case "washer":
      return <WasherDashboard />;
    case "supervisor":
      return <SupervisorDashboard />;
    case "sales":
      return <SalesDashboard />;
    case "customer-care":
      return <CustomerCareDashboard />;
    case "finance":
      return <FinanceDashboard />;
    case "inventory":
      return <InventoryDashboard />;
    case "hr":
      return <HRDashboard />;
    case "operations":
      return <OperationsDashboard />;
    case "city":
      return <CityDashboard />;
    case "procurement":
      return <ProcurementDashboard />;
    case "city-manager":
      return <CityDashboard />;
    case "accounts":
      return <FinanceDashboard />;
    case "admin":
    case "super-admin":
      return <ExecutiveDashboard />;
    default:
      return <ExecutiveDashboard />;
  }
}