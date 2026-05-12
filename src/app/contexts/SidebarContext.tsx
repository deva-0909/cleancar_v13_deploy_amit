import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  userToggled: boolean;
  setUserToggled: (toggled: boolean) => void;
  openGroups: Set<string>;
  toggleGroup: (label: string) => void;
  openGroup: (label: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);
SidebarContext.displayName = "SidebarContext";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("sidebarCollapsed") === "true"; }
    catch { return false; }
  });
  const [userToggled, setUserToggled] = useState(false);
  // All nav groups start OPEN by default for better discoverability
  // After first visit, user's manual open/close choices are persisted
  const ALL_GROUPS = ["Analytics","CRM","TSE App","CCE App","Operations",
    "Team & Settings","HR & People","Payroll","Finance","Accounts",
    "GST Compliance","Inventory","Admin"];

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("sidebarOpenGroups");
      // If no stored preference, open all groups by default
      if (!stored) return new Set<string>(ALL_GROUPS);
      const parsed = JSON.parse(stored);
      // If stored but empty (user closed everything), still show Dashboard-relevant ones
      return parsed.length > 0 ? new Set(parsed) : new Set<string>(ALL_GROUPS);
    } catch { return new Set<string>(ALL_GROUPS); }
  });

  const toggleSidebar = () => { setCollapsed(p => !p); setUserToggled(true); };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const openGroup = (label: string) => {
    setOpenGroups(prev => {
      if (prev.has(label)) return prev;
      const next = new Set(prev);
      next.add(label);
      return next;
    });
  };

  useEffect(() => {
    try { localStorage.setItem("sidebarCollapsed", String(collapsed)); } catch {}
  }, [collapsed]);

  useEffect(() => {
    try { localStorage.setItem("sidebarOpenGroups", JSON.stringify([...openGroups])); } catch {}
  }, [openGroups]);

  const value: SidebarContextType = {
    collapsed, setCollapsed, toggleSidebar,
    userToggled, setUserToggled,
    openGroups, toggleGroup, openGroup,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    if (import.meta.hot || !import.meta.env?.PROD) {
      return {
        collapsed: false, setCollapsed: () => {}, toggleSidebar: () => {},
        userToggled: false, setUserToggled: () => {},
        openGroups: new Set<string>(), toggleGroup: () => {}, openGroup: () => {},
      } as SidebarContextType;
    }
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}
