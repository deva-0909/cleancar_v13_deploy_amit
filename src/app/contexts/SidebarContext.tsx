import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useRef} from "react";

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
  const _dbGroupsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  <boolean>(() => {
    try { return localStorage.getItem("sidebarCollapsed") === "true"; }
    catch { return false; }
  });
  const [userToggled, setUserToggled] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("sidebarOpenGroups");
  const _dbCollapsedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const _dbGroupsTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
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
    if (_dbCollapsedTimer.current) clearTimeout(_dbCollapsedTimer.current);
    _dbCollapsedTimer.current = setTimeout(() => {
      try { localStorage.setItem("sidebarCollapsed", String(collapsed)); } catch {}
    }, 300);
  }, [collapsed]);

  useEffect(() => {
    if (_dbGroupsTimer.current) clearTimeout(_dbGroupsTimer.current);
    _dbGroupsTimer.current = setTimeout(() => {
      try { localStorage.setItem("sidebarOpenGroups", JSON.stringify([...openGroups])); } catch {}
    }, 300);
  }, [openGroups]);

  const contextValue = useMemo((): SidebarContextType => ({
    collapsed, setCollapsed, toggleSidebar,
    userToggled, setUserToggled,
    openGroups, toggleGroup, openGroup,
  }), [collapsed, userToggled, openGroups]);

    return <SidebarContext.Provider value={contextValue}>{children}</SidebarContext.Provider>;
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
    console.warn("[useSidebar] outside SidebarProvider - fallback"); return context as any;
  }
  return context;
}
