/**
 * AppProvider - Root provider that wraps ALL global contexts
 * This is the SINGLE point where all shared state is initialized
 *
 * PHASE 4: Modular domain-based architecture
 * - Replaced monolithic HRDataContext with domain contexts
 * - Each domain owns its data (Employee, Payroll, Incentive, Attendance, Org)
 *
 * PHASE 5: Business rules configuration layer added
 *
 * USAGE: Wrap your entire app with this provider in main.tsx or App.tsx
 */

import { ReactNode } from "react";
import { RoleProvider } from "./RoleContext";
import { CityProvider } from "./CityContext";
import { CustomRoleProvider } from "./CustomRoleContext";
import { CustomerProvider } from "./CustomerContext";
import { CustomerSubscriptionProvider } from "./CustomerSubscriptionContext";
import { PlanDefinitionProvider } from "./PlanDefinitionContext";
import { JobProvider } from "./JobContext";
import { SyncInitializer } from "../components/SyncInitializer";
import { MigrationInitializer } from "../components/MigrationInitializer";

// PHASE 4: Domain-specific contexts
import { OrgProvider } from "./OrgContext";
import { EmployeeProvider } from "./EmployeeContext";
import { AttendanceProvider } from "./AttendanceContext";
import { ShiftProvider } from "./ShiftContext"; // MC-10: Shift Management
import { PayrollProvider } from "./PayrollContext";
import { IncentiveProvider } from "./IncentiveContext";
import { HRDataProvider } from "./HRDataContext"; // Legacy: Still used by UserManagement

// Business rules configuration
import { BusinessRulesProvider } from "./BusinessRulesContext";

import { InventoryProvider } from "./InventoryContext";
import { FinanceProvider } from "./FinanceContext";
import { EventSystemProvider } from "./EventSystem";
import { WasherProvider } from "./WasherContext";
import { SupervisorProvider } from "./SupervisorContext";
import { DemoProvider } from "./DemoContext";
import { ApprovalProvider } from "./ApprovalContext";
import { SidebarProvider } from "./SidebarContext";

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <BusinessRulesProvider>
      <OrgProvider>
        <HRDataProvider>
          <CityProvider>
            <EmployeeProvider>
              <AttendanceProvider>
                <ShiftProvider>
                  <PayrollProvider>
                    <IncentiveProvider>
                      <RoleProvider>
                        <CustomRoleProvider>
                          <PlanDefinitionProvider>
                            <DemoProvider>
                              <EventSystemProvider>
                                <CustomerProvider>
                                  <CustomerSubscriptionProvider>
                                    <JobProvider>
                                      <InventoryProvider>
                                        <FinanceProvider>
                                          <ApprovalProvider>
                                            <WasherProvider>
                                              <SupervisorProvider>
                                                <SidebarProvider>
                                                  <MigrationInitializer />
                                                  <SyncInitializer />
                                                  {children}
                                                </SidebarProvider>
                                              </SupervisorProvider>
                                            </WasherProvider>
                                          </ApprovalProvider>
                                        </FinanceProvider>
                                      </InventoryProvider>
                                    </JobProvider>
                                  </CustomerSubscriptionProvider>
                                </CustomerProvider>
                              </EventSystemProvider>
                            </DemoProvider>
                          </PlanDefinitionProvider>
                        </CustomRoleProvider>
                      </RoleProvider>
                    </IncentiveProvider>
                  </PayrollProvider>
                </ShiftProvider>
              </AttendanceProvider>
            </EmployeeProvider>
          </CityProvider>
        </HRDataProvider>
      </OrgProvider>
    </BusinessRulesProvider>
  );
}

// Re-export all hooks for convenience
export { useBusinessRules } from "./BusinessRulesContext";
export { useEmployeeData } from "../hooks/useEmployeeData";
export { useEmployee } from "./EmployeeContext";
export { useOrg } from "./OrgContext";
export { useAttendance } from "./AttendanceContext";
export { useShift } from "./ShiftContext";
export { usePayroll } from "./PayrollContext";
export { useIncentive } from "./IncentiveContext";
export { useHRData } from "./HRDataContext";
export { useBusinessFlows } from "../hooks/useBusinessFlows";
export { useRole } from "./RoleContext";
export { useCity } from "./CityContext";
export { useCustomRoles } from "./CustomRoleContext";
export { usePlanDefinitions } from "./PlanDefinitionContext";
export { useDemos } from "./DemoContext";
export { useCustomers } from "./CustomerContext";
export { useCustomerSubscriptions } from "./CustomerSubscriptionContext";
export { useJobs } from "./JobContext";
export { useInventory } from "./InventoryContext";
export { useFinance } from "./FinanceContext";
export { useEvents, useEventListener } from "./EventSystem";
export { useWasher } from "./WasherContext";
export { useSupervisor } from "./SupervisorContext";
export { useApprovals } from "./ApprovalContext";
export { useSidebar } from "./SidebarContext";

// Re-export all types
export type {
  BusinessRules,
  ClusterManagerRules,
  OperationsManagerRules,
  CustomerCareRules
} from "./BusinessRulesContext";
export type { Employee, EmployeeStatus } from "./EmployeeContext";
export type { EmployeeRole } from "./OrgContext";
export type { AttendanceRecord } from "./AttendanceContext";
export type { PayrollRun, SalaryStructure } from "./PayrollContext";
export type { IncentivePlan, EmployeeIncentive } from "./IncentiveContext";
export type { EnrichedEmployee } from "../hooks/useEmployeeData";
export type { Customer } from "./CustomerContext";
export type { CustomerSubscription } from "./CustomerSubscriptionContext";
export type { Job } from "./JobContext";
export type { InventoryItem, StockTransaction } from "./InventoryContext";
export type { MRRData, Payable, Revenue, LedgerEntry } from "./FinanceContext";
export type { SystemEvent, SystemEventType } from "./EventSystem";
