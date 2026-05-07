/**
 * Global Filter Bar - Top navigation filters for ERP system
 *
 * Provides consistent city, date range, and business unit filtering across all modules
 * Filters persist across navigation and can be accessed by any component
 *
 * @component
 */

import { useState, createContext, useContext, ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Calendar, MapPin, Building2, RefreshCw, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { useCity, type CityId } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";

// ============================================================================
// CONTEXT FOR GLOBAL FILTERS
// ============================================================================

interface GlobalFilters {
  city: string;
  startDate: string;
  endDate: string;
  businessUnit: string;
}

interface GlobalFiltersContextType {
  filters: GlobalFilters;
  setFilters: (filters: GlobalFilters) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const GlobalFiltersContext = createContext<GlobalFiltersContextType | undefined>(undefined);

export function useGlobalFilters() {
  const context = useContext(GlobalFiltersContext);
  if (!context) {
    // Always return safe defaults — never throw
    // This handles both preview/HMR and production edge cases
    return {
      filters: {
        city: "ALL",
        startDate: "2026-01-01",
        endDate: "2026-04-30",
        businessUnit: "ALL",
      } as GlobalFilters,
      setFilters: (_f: GlobalFilters) => {},
      resetFilters: () => {},
      hasActiveFilters: false,
    };
  }
  return context;
}

// ============================================================================
// GLOBAL FILTERS PROVIDER
// ============================================================================

interface GlobalFiltersProviderProps {
  children: ReactNode;
}

export function GlobalFiltersProvider({ children }: GlobalFiltersProviderProps) {
  // Dynamic defaults: last 90 days ending today
  function getDefaultFilters(): GlobalFilters {
    const today = new Date();
    const end = today.toISOString().split("T")[0];
    const start90 = new Date(today);
    start90.setDate(today.getDate() - 90);
    const start = start90.toISOString().split("T")[0];
    return { city: "ALL", startDate: start, endDate: end, businessUnit: "ALL" };
  }

  const [filters, setFilters] = useState<GlobalFilters>(getDefaultFilters);

  const resetFilters = () => {
    setFilters(getDefaultFilters());
  };

  // Validate and set filters — prevent inverted date ranges
  const setFiltersValidated = (newFilters: GlobalFilters) => {
    if (newFilters.startDate && newFilters.endDate &&
        newFilters.startDate > newFilters.endDate) {
      // Inverted range: swap the dates automatically
      setFilters({ ...newFilters, startDate: newFilters.endDate, endDate: newFilters.startDate });
    } else {
      setFilters(newFilters);
    }
  };

  const hasActiveFilters =
    filters.city !== "ALL" ||
    filters.businessUnit !== "ALL";

  return (
    <GlobalFiltersContext.Provider
      value={{ filters, setFilters: setFiltersValidated, resetFilters, hasActiveFilters }}
    >
      {children}
    </GlobalFiltersContext.Provider>
  );
}

// ============================================================================
// GLOBAL FILTER BAR COMPONENT
// ============================================================================

interface GlobalFilterBarProps {
  showBusinessUnit?: boolean;
}

export function GlobalFilterBar({ showBusinessUnit = true }: GlobalFilterBarProps) {
  const { filters, setFilters, resetFilters, hasActiveFilters } = useGlobalFilters();
  const { city, cityInfo, setCity, availableCities, isLocked } = useCity();
  const { currentRole } = useRole();
  const showUnitFilter = currentRole ? ["Super Admin","Admin","City Manager","Cluster Manager",
    "Sr Operations Manager","Operations Manager","HR","Accounts","Marketing Agency"].includes(currentRole) : false;

  const handleFilterChange = (key: keyof GlobalFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const activeFilterCount = [
    filters.businessUnit !== "ALL",
  ].filter(Boolean).length;

  // Detect inverted date range for visual warning
  const isDateInverted = filters.startDate && filters.endDate &&
    filters.startDate > filters.endDate;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
        {/* City Selector - Integrated with CityContext */}
        <div className="flex items-center gap-1 sm:gap-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <Label className="text-sm text-gray-600 min-w-fit">City:</Label>
          <Select
            value={city}
            onValueChange={(value) => setCity(value as CityId)}
            disabled={isLocked}
          >
            <SelectTrigger className="w-40">
              <SelectValue>{cityInfo.displayName}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableCities.map((cityOption) => (
                <SelectItem key={cityOption.id} value={cityOption.id}>
                  {cityOption.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLocked && (
            <Badge variant="outline" className="text-xs">
              Locked
            </Badge>
          )}
        </div>

        {/* Date Range */}
        <div className="hidden md:flex items-center gap-1 sm:gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <Label className="text-sm text-gray-600 min-w-fit">From:</Label>
          <Input
            type="date"
            value={filters.startDate}
            max={filters.endDate || undefined}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            className={`w-40 ${isDateInverted ? "border-red-400 bg-red-50" : ""}`}
          />
        </div>

        <div className="hidden md:flex items-center gap-1 sm:gap-2">
          <Label className="text-sm text-gray-600 min-w-fit">To:</Label>
          <Input
            type="date"
            value={filters.endDate}
            min={filters.startDate || undefined}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            className={`w-40 ${isDateInverted ? "border-red-400 bg-red-50" : ""}`}
          />
        </div>

        {/* Inverted date warning */}
        {isDateInverted && (
          <div className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 border border-red-200 rounded px-2 py-1">
            ⚠️ "From" date is after "To" — no results will show. Dates will be swapped on next change.
          </div>
        )}

        {/* Business Unit Filter */}
        {showUnitFilter && showBusinessUnit && (
          <div className="flex items-center gap-1 sm:gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <Label className="text-sm text-gray-600 min-w-fit">Unit:</Label>
            <Select
              value={filters.businessUnit}
              onValueChange={(value) => handleFilterChange("businessUnit", value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Units</SelectItem>
                <SelectItem value="OPERATIONS">Operations</SelectItem>
                <SelectItem value="SALES">Sales</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Active Filter Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1 sm:gap-2 ml-auto">
            <Badge variant="secondary" className="flex items-center gap-1">
              <span className="text-xs">{activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active</span>
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        )}

        {!hasActiveFilters && (
          <div className="ml-auto text-xs text-gray-500">
            Apply filters to refine results across all modules
          </div>
        )}
      </div>
    </div>
  );
}
