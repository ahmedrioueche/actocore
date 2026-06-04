// @ts-nocheck
import { useEffect, useRef, useState } from "react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs = 500,
  className = "",
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<any>(undefined);

  // Sync local value with prop when it changes externally
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle clearing search
  const handleClear = () => {
    onChange("");
    setLocalValue("");
  };

  // Debounced search handler
  const handleInput = (newValue: string) => {
    setLocalValue(newValue);

    // Clear existing timer
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced update
    // @ts-ignore
    debounceTimerRef.current = window.setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={(e) => handleInput(e.target.value)}
        className="w-full px-3 md:px-4 py-2 md:py-2.5 pl-9 md:pl-11 pr-8 md:pr-10 focus:ring-1 focus:ring-primary bg-background border border-border rounded-xl text-text-primary placeholder-text-secondary focus:outline-none focus:border-border focus:ring-0 transition-all text-sm md:text-base"
      />
      <span className="absolute left-3 md:left-3.5 top-1/2 -translate-y-1/2 text-sm md:text-lg">
        🔍
      </span>
      {localValue && (
        <button
          onClick={handleClear}
          // @ts-ignore
          className="absolute right-2.5 md:right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-danger w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full hover:bg-danger/10 transition-colors text-xs md:text-base"
        >
          ✕
        </button>
      )}
    </div>
  );
}
