import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface CustomSelectProps<T> {
  title?: string;
  options: {
    value: T;
    label: string;
    flag?: string;
    name?: string;
  }[];
  selectedOption: T;
  label?: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  bgColor?: string;
  error?: string;
  marginTop?: string;
  placeholder?: string;
  searchable?: boolean;
  showIcon?: boolean;
}

const CustomSelect = <T extends string>({
  title,
  options,
  selectedOption,
  label,
  onChange,
  disabled,
  className,
  bgColor,
  error,
  placeholder,
  searchable = false,
  showIcon = true,
}: CustomSelectProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollPositionRef = useRef<number>(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target as Node)
      ) {
        // If clicking inside the portal, don't close
        const portal = document.getElementById("select-portal-root");
        if (portal && portal.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    } else if (searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || disabled) return;

      const focusedElement = document.activeElement;
      const isSearchFocused = focusedElement === searchInputRef.current;

      // When using Portal, we might need a different way to find items
      const portal = document.getElementById("select-portal-root");
      const items = Array.from(portal?.querySelectorAll("li") || []);

      if (event.key === "Escape") {
        setIsOpen(false);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        const currentIndex = items.indexOf(focusedElement as HTMLLIElement);
        if (isSearchFocused && items.length > 0) {
          items[0].focus();
        } else {
          const nextIndex = (currentIndex + 1) % items.length;
          items[nextIndex]?.focus();
        }
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const currentIndex = items.indexOf(focusedElement as HTMLLIElement);
        if (currentIndex <= 0 && isSearchFocused) {
          const prevIndex = items.length - 1;
          items[prevIndex]?.focus();
        } else if (currentIndex === 0 && searchable) {
          searchInputRef.current?.focus();
        } else {
          const prevIndex = (currentIndex - 1 + items.length) % items.length;
          items[prevIndex]?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, disabled, searchable]);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      if (isOpen) {
        // Only close if the scroll happened outside our dropdown
        if (listRef.current && listRef.current.contains(event.target as Node)) {
          return;
        }
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  const handleListScroll = () => {
    if (listRef.current) {
      scrollPositionRef.current = listRef.current.scrollTop;
    }
  };

  useEffect(() => {
    if (isOpen && listRef.current) {
      listRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [isOpen]);

  const selectedOptionData = options.find((o) => o.value === selectedOption);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const renderDropdown = () => {
    if (!isOpen || !selectRef.current) return null;

    const rect = selectRef.current.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 4;
    const left = rect.left + window.scrollX;
    const width = rect.width;

    return createPortal(
      <ul
        id="select-portal-root"
        ref={listRef}
        role="listbox"
        className={`fixed z-[9999] mt-0 rounded-md shadow-2xl bg-background max-h-60 overflow-auto border border-border animate-in fade-in zoom-in-95 duration-200 ${className ?? ""}`}
        style={{
          top: `${rect.bottom + 4}px`,
          left: `${rect.left}px`,
          width: `${width}px`,
        }}
        onScroll={handleListScroll}
        onClick={(e) => e.stopPropagation()}
      >
        {searchable && (
          <div className="sticky top-0 p-2 bg-background border-b border-border z-20">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="w-full px-3 py-1.5 text-sm bg-surface rounded-md border border-border focus:outline-none focus:border-primary text-text-primary placeholder:text-text-secondary"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
        )}
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === selectedOption}
              tabIndex={0}
              className={`px-4 py-2 text-text-primary hover:bg-primary/30 hover:cursor-pointer focus:bg-primary/30 focus:outline-none transition-colors ${
                option.value === selectedOption ? "bg-primary/10 font-bold" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
            >
              <div className="flex items-center gap-2">
                {option.flag && (
                  <div className="w-5 h-4 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {option.flag.includes("/") || option.flag.includes(".") ? (
                      <img
                        src={option.flag}
                        alt=""
                        className="w-full h-full object-cover rounded-sm"
                      />
                    ) : (
                      <span className="text-base leading-none">
                        {option.flag}
                      </span>
                    )}
                  </div>
                )}
                <span>{option.label}</span>
                {option.name && (
                  <span className="text-xs text-text-secondary ml-auto">
                    {option.name}
                  </span>
                )}
              </div>
            </li>
          ))
        ) : (
          <li className="px-4 py-2 text-sm text-text-secondary text-center">
            No results found
          </li>
        )}
      </ul>,
      document.body,
    );
  };

  return (
    <div className="relative space-y-2" ref={selectRef}>
      {title && (
        <label className="block text-sm font-medium text-text-primary">
          {title}
        </label>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={title}
        aria-disabled={disabled}
        className={`
          p-3 px-4 rounded-lg 
          border 
          bg-surface
          focus:border-2
          focus:border-primary
          text-text-primary
          shadow-sm
          ${disabled ? "" : "cursor-pointer hover:bg-surface/60"}
          ${bgColor ?? ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          ${error ? "border-danger" : isOpen ? "border-primary ring-1 ring-primary/20" : "border-border"}
          transition-all duration-200
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            setIsOpen(!isOpen);
          }
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            {selectedOptionData?.flag && (
              <div className="w-5 h-4 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {selectedOptionData.flag.includes("/") ||
                selectedOptionData.flag.includes(".") ? (
                  <img
                    src={selectedOptionData.flag}
                    alt=""
                    className="w-full h-full object-cover rounded-sm border border-white/10"
                  />
                ) : (
                  <span className="text-base leading-none">
                    {selectedOptionData.flag}
                  </span>
                )}
              </div>
            )}
            <span className="truncate">
              {selectedOptionData?.label || label || selectedOption || (
                <span className="text-text-secondary">
                  {placeholder || "Select..."}
                </span>
              )}
            </span>
          </div>
          {showIcon && (
            <svg
              className={`w-4 h-4 text-text-secondary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          )}
        </div>
      </div>

      {renderDropdown()}
    </div>
  );
};

export default CustomSelect;
