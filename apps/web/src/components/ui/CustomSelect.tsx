import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

export type CustomSelectOption<T extends string = string> = {
  value: T;
  label: string;
  flag?: string;
  name?: string;
};

export type CustomSelectProps<T extends string = string> = {
  title?: string;
  options: CustomSelectOption<T>[];
  selectedOption: T;
  label?: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  bgColor?: string;
  error?: string;
  placeholder?: string;
  searchable?: boolean;
  showIcon?: boolean;
  size?: 'default' | 'compact';
  searchPlaceholder?: string;
  emptyMessage?: string;
  ariaLabel?: string;
};

export default function CustomSelect<T extends string>({
  title,
  options,
  selectedOption,
  label,
  onChange,
  disabled = false,
  className,
  triggerClassName,
  bgColor,
  error,
  placeholder,
  searchable = false,
  showIcon = true,
  size = 'default',
  searchPlaceholder = 'Search…',
  emptyMessage = 'No results found',
  ariaLabel,
}: CustomSelectProps<T>) {
  const listboxId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current?.contains(event.target as Node)) {
        return;
      }
      const list = document.getElementById(listboxId);
      if (list?.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [listboxId]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      return;
    }
    if (searchable) {
      searchInputRef.current?.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen || disabled) {
        return;
      }

      const list = document.getElementById(listboxId);
      const items = Array.from(list?.querySelectorAll('[role="option"]') ?? []);
      const focusedElement = document.activeElement;
      const isSearchFocused = focusedElement === searchInputRef.current;

      if (event.key === 'Escape') {
        setIsOpen(false);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        const currentIndex = items.indexOf(focusedElement as HTMLElement);
        if (isSearchFocused && items.length > 0) {
          (items[0] as HTMLElement).focus();
        } else {
          const nextIndex = (currentIndex + 1) % items.length;
          (items[nextIndex] as HTMLElement | undefined)?.focus();
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = items.indexOf(focusedElement as HTMLElement);
        if (currentIndex <= 0 && searchable) {
          searchInputRef.current?.focus();
        } else {
          const prevIndex = (currentIndex - 1 + items.length) % items.length;
          (items[prevIndex] as HTMLElement | undefined)?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disabled, isOpen, listboxId, searchable]);

  useEffect(() => {
    const handleScroll = (event: Event) => {
      if (!isOpen) {
        return;
      }
      if (listRef.current?.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
    }

    return () => window.removeEventListener('scroll', handleScroll, true);
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

  const selectedOptionData = options.find((option) => option.value === selectedOption);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const renderDropdown = () => {
    if (!isOpen || !selectRef.current) {
      return null;
    }

    const rect = selectRef.current.getBoundingClientRect();

    return createPortal(
      <ul
        id={listboxId}
        ref={listRef}
        role="listbox"
        className={cn(
          'fixed z-[9999] max-h-60 overflow-auto rounded-xl border border-border bg-surface shadow-2xl',
          className,
        )}
        style={{
          top: `${rect.bottom + 4}px`,
          left: `${rect.left}px`,
          width: `${rect.width}px`,
        }}
        onScroll={handleListScroll}
        onClick={(event) => event.stopPropagation()}
      >
        {searchable ? (
          <li className="sticky top-0 z-20 border-b border-border bg-surface p-2">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none"
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            />
          </li>
        ) : null}
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === selectedOption}
              tabIndex={0}
              className={cn(
                'cursor-pointer px-4 py-2 outline-none transition-colors',
                option.value === selectedOption
                  ? 'bg-primary font-semibold text-primary-contrast'
                  : 'text-text-primary hover:bg-primary hover:text-primary-contrast focus-visible:bg-primary focus-visible:text-primary-contrast',
              )}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  onChange(option.value);
                  setIsOpen(false);
                }
              }}
            >
              <div className="flex items-center gap-2">
                {option.flag ? (
                  <span className="flex h-4 w-5 shrink-0 items-center justify-center overflow-hidden text-base leading-none">
                    {option.flag.includes('/') || option.flag.includes('.') ? (
                      <img
                        src={option.flag}
                        alt=""
                        className="h-full w-full rounded-sm object-cover"
                      />
                    ) : (
                      option.flag
                    )}
                  </span>
                ) : null}
                <span>{option.label}</span>
                {option.name ? (
                  <span className="ml-auto text-xs opacity-70">{option.name}</span>
                ) : null}
              </div>
            </li>
          ))
        ) : (
          <li className="px-4 py-2 text-center text-sm text-text-secondary">
            {emptyMessage}
          </li>
        )}
      </ul>,
      document.body,
    );
  };

  return (
    <div className="relative space-y-2" ref={selectRef}>
      {title ? (
        <span className="block text-sm font-medium text-text-primary">{title}</span>
      ) : null}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel ?? title}
        aria-disabled={disabled}
        className={cn(
          'rounded-xl border bg-surface text-text-primary shadow-sm transition-all duration-200',
          size === 'compact' ? 'px-3 py-2 text-sm' : 'px-4 py-3',
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary/50',
          error
            ? 'border-danger'
            : isOpen
              ? 'border-primary ring-1 ring-primary/20'
              : 'border-border',
          bgColor,
          triggerClassName,
        )}
        onClick={() => !disabled && setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (!disabled && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            setIsOpen((open) => !open);
          }
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 truncate">
            {selectedOptionData?.flag ? (
              <span className="flex h-4 w-5 shrink-0 items-center justify-center overflow-hidden text-base leading-none">
                {selectedOptionData.flag.includes('/') ||
                selectedOptionData.flag.includes('.') ? (
                  <img
                    src={selectedOptionData.flag}
                    alt=""
                    className="h-full w-full rounded-sm object-cover"
                  />
                ) : (
                  selectedOptionData.flag
                )}
              </span>
            ) : null}
            <span className="truncate">
              {selectedOptionData?.label ||
                label ||
                selectedOption || (
                  <span className="text-text-secondary">
                    {placeholder ?? 'Select…'}
                  </span>
                )}
            </span>
          </div>
          {showIcon ? (
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-text-secondary transition-transform duration-200',
                isOpen && 'rotate-180',
              )}
              aria-hidden
            />
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {renderDropdown()}
    </div>
  );
}
