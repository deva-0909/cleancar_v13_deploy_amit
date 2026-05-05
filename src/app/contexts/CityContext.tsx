/**
 * City Context - Central City Selection and Scoping
 *
 * Provides city context throughout the application for:
 * - Data filtering by city
 * - Navigation scoping
 * - Role-based city locking
 * - Multi-city support
 *
 * USAGE:
 * ```tsx
 * const { city, setCity, availableCities } = useCity();
 * ```
 */

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRole } from "./RoleContext";

export type CityId = "CITY-SURAT" | "CITY-MUMBAI" | "CITY-AHMEDABAD";

export interface CityInfo {
  id: CityId;
  name: string;
  displayName: string;
}

export const CITIES: Record<CityId, CityInfo> = {
  "CITY-SURAT": {
    id: "CITY-SURAT",
    name: "surat",
    displayName: "Surat",
  },
  "CITY-MUMBAI": {
    id: "CITY-MUMBAI",
    name: "mumbai",
    displayName: "Mumbai",
  },
  "CITY-AHMEDABAD": {
    id: "CITY-AHMEDABAD",
    name: "ahmedabad",
    displayName: "Ahmedabad",
  },
};

interface CityContextValue {
  city: CityId;
  cityInfo: CityInfo;
  setCity: (city: CityId) => void;
  availableCities: CityInfo[];
  isLocked: boolean;
}

const CityContext = createContext<CityContextValue | undefined>(undefined);

interface CityProviderProps {
  children: ReactNode;
}

export function CityProvider({ children }: CityProviderProps) {
  const { currentUser, currentRole } = useRole();

  // Default to user's city, then persisted selection, then Surat
  const persistedCity = localStorage.getItem("cleancar_selected_city") as CityId | null;
  const defaultCity = (currentUser?.cityId as CityId) || persistedCity || "CITY-SURAT";
  const [city, setCityState] = useState<CityId>(defaultCity);

  // Persist city selection on change
  useEffect(() => {
    localStorage.setItem("cleancar_selected_city", city);
  }, [city]);

  // Determine if city is locked based on role
  const isLocked = currentRole === "City Manager";

  // Get available cities (all for super admin, user's city for city managers)
  const availableCities = isLocked
    ? [CITIES[defaultCity]]
    : Object.values(CITIES);

  // Sync city with user's city when it changes
  useEffect(() => {
    if (currentUser?.cityId && isLocked) {
      setCityState(currentUser.cityId as CityId);
    }
  }, [currentUser?.cityId, isLocked]);

  const setCity = (newCity: CityId) => {
    // Don't allow changing city if locked
    if (isLocked && newCity !== defaultCity) {
      console.warn(`City is locked to ${defaultCity} for role ${currentRole}`);
      return;
    }
    setCityState(newCity);
  };

  const value: CityContextValue = {
    city,
    cityInfo: CITIES[city],
    setCity,
    availableCities,
    isLocked,
  };

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>;
}

export function useCity() {
  const context = useContext(CityContext);
  if (context === undefined) {
    // PREVIEW FALLBACK: Safe defaults for Figma Make iframe, dev HMR, and standalone component previews
    // Always return fallback instead of throwing to prevent preview errors
    console.warn('useCity called outside CityProvider - using fallback defaults');
    return {
      city: "CITY-SURAT" as CityId,
      cityInfo: CITIES["CITY-SURAT"],
      setCity: (_: CityId) => {},
      availableCities: Object.values(CITIES),
      isLocked: false,
    } as CityContextValue;
  }
  return context;
}

/**
 * Utility: Attach city to URL path
 */
export function attachCityToPath(path: string, city: CityId): string {
  // Don't add city to certain paths
  const skipPaths = ["/onboarding", "/onboard", "/unauthorized"];
  if (skipPaths.some(skip => path.startsWith(skip))) {
    return path;
  }

  const cityParam = `city=${CITIES[city].name}`;

  if (path.includes("?")) {
    // Already has query params
    return path.includes("city=") ? path : `${path}&${cityParam}`;
  }

  return `${path}?${cityParam}`;
}
