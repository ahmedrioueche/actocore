import { ChevronDown, Filter } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Dropdown from "./Dropdown";

export interface FilterOption<T extends string = string> {
  value: T;
  label: string;
}

interface SearchFilterBarProps<T extends string = string> {
  /** Current search query value */
  searchQuery: string;
  /** Callback when search value changes */
  onSearchChange: (value: string) => void;
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** Current selected filter value */
  filterValue?: T;
  /** Callback when filter changes */
  onFilterChange?: (value: T) => void;
  /** List of filter options */
  filterOptions?: FilterOption<T>[];
  /** Optional debounce delay for search in ms */
  debounceMs?: number;
  /** Optional label shown next to filter on mobile */
  filterLabel?: string;
  /** List of multiple filter configurations */
  filters?: SearchFilterConfig<any>[];
}

export interface SearchFilterConfig<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: FilterOption<T>[];
  label?: string;
}

/**
 * A reusable search + filter bar component.
 * - Search input takes up most space
 * - Filter dropdown button on the right with filter icon
 * - Consistent across mobile and desktop
 */
export function SearchFilterBar<T extends string = string>({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search...",
  filterValue,
  onFilterChange,
  filterOptions,
  debounceMs = 500,
  filters,
}: SearchFilterBarProps<T>) {
  const [localSearchValue, setLocalSearchValue] = useState(searchQuery);
  const debounceTimerRef = useRef<number | undefined>(undefined);

  // Sync local value with prop
  useEffect(() => {
    setLocalSearchValue(searchQuery);
  }, [searchQuery]);

  // Handle clearing search
  const handleClearSearch = () => {
    onSearchChange("");
    setLocalSearchValue("");
  };

  // Debounced search handler
  const handleSearchInput = (value: string) => {
    setLocalSearchValue(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      onSearchChange(value);
    }, debounceMs);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const totalFilters = (filters?.length || 0) + (filterOptions ? 1 : 0);
  const isMultiFilterMobile = totalFilters >= 3;

  return (
    <div className="bg-surface border border-border rounded-xl md:rounded-2xl p-2.5 md:p-5 w-full">
      <div
        className={`flex ${
          isMultiFilterMobile ? "flex-col md:flex-row" : "items-center"
        } gap-2 md:gap-3`}
      >
        {/* Search Input - Flex Grow */}
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={localSearchValue}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="w-full px-3.5 md:px-4 py-2 md:py-2.5 pl-9 md:pl-11 pr-8 md:pr-10 focus:ring-1 focus:ring-primary bg-background border border-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none transition-all text-sm md:text-base"
          />
          <span className="absolute left-3 md:left-3.5 top-1/2 -translate-y-1/2 text-sm md:text-lg text-text-secondary">
            🔍
          </span>
          {localSearchValue && localSearchValue.length > 0 && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-danger w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full hover:bg-danger/10 transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns - Multi-filter support */}
        <div
          className={`flex items-center gap-1.5 md:gap-3 flex-shrink-0 ${
            isMultiFilterMobile ? "flex-wrap md:flex-nowrap" : ""
          }`}
        >
          {filters?.map((filter, index) => (
            <FilterDropdown
              key={index}
              value={filter.value}
              onChange={filter.onChange}
              options={filter.options}
              align="right"
            />
          ))}

          {/* Backward compatibility for single filter */}
          {!filters &&
            filterOptions &&
            filterValue !== undefined &&
            onFilterChange && (
              <FilterDropdown
                value={filterValue}
                onChange={onFilterChange}
                options={filterOptions}
                align="right"
              />
            )}
        </div>
      </div>
    </div>
  );
}

interface FilterDropdownProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: FilterOption<T>[];
  align?: "left" | "right";
}

function FilterDropdown<T extends string>({
  value,
  onChange,
  options,
  align = "right",
}: FilterDropdownProps<T>) {
  const selectedOption = options.find((opt) => opt.value === value);
  const isFiltered = options.length > 0 && value !== options[0]?.value;

  return (
    <Dropdown
      trigger={
        <button
          className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-2 md:py-2.5 bg-background border border-border rounded-xl text-sm transition-all hover:border-primary`}
        >
          <Filter
            className={`w-4 h-4 md:w-5 md:h-5 ${
              isFiltered ? "text-primary" : "text-text-secondary"
            }`}
          />
          <span className="hidden sm:inline capitalize font-medium text-text-primary max-w-[100px] truncate">
            {selectedOption?.label || value}
          </span>
          <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-text-secondary" />
        </button>
      }
      align={align}
      className="!w-48"
    >
      {(close) => (
        <div className="p-1">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                close();
              }}
              className={`w-full text-left rtl:text-right px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${
                value === option.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-text-secondary hover:bg-muted hover:text-text-primary"
              }`}
            >
              {option.label}
              {value === option.value && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  );
}

export default SearchFilterBar;
