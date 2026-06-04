import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/context/ThemeContext";
import useScreen from "@/hooks/useScreen";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode | ((closeDropdown: () => void) => React.ReactNode);
  align?: "left" | "right";
  className?: string;
  onOpen?: () => void;
  /** On mobile (≤768px), open as a centered modal with backdrop instead of anchored dropdown */
  mobileAsModal?: boolean;
}

export default function Dropdown({
  trigger,
  children,
  align = "right",
  className = "",
  onOpen,
  mobileAsModal = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();
  const { isMobile } = useScreen();
  const useModalLayout = mobileAsModal && isMobile;

  const closeDropdown = () => setIsOpen(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (useModalLayout) {
        const portal = document.getElementById("dropdown-portal-root");
        const backdrop = document.getElementById("dropdown-modal-backdrop");
        const target = event.target as Node;
        if (portal?.contains(target)) return;
        if (backdrop?.contains(target)) {
          closeDropdown();
        }
        return;
      }

      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        const portal = document.getElementById("dropdown-portal-root");
        if (portal && portal.contains(event.target as Node)) {
          return;
        }
        closeDropdown();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, useModalLayout]);

  useEffect(() => {
    if (useModalLayout) return;

    const handleScroll = () => {
      if (isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, useModalLayout]);

  useEffect(() => {
    if (!isOpen || !useModalLayout) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDropdown();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, useModalLayout]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isOpen;
    setIsOpen(newState);
    if (newState && onOpen) {
      onOpen();
    }
  };

  const renderMenu = (closeDropdown: () => void) => (
    <div className="py-2">
      {typeof children === "function" ? children(closeDropdown) : children}
    </div>
  );

  const getPortalContent = () => {
    if (!isOpen) return null;

    if (useModalLayout) {
      return createPortal(
        <div
          id="dropdown-modal-backdrop"
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={closeDropdown}
        >
          <div
            id="dropdown-portal-root"
            role="dialog"
            aria-modal="true"
            className={`relative z-[9999] w-full max-w-sm max-h-[min(85vh,520px)] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl animate-in zoom-in-95 duration-200 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="overflow-y-auto max-h-[min(85vh,520px)] hide-scrollbar">
              {renderMenu(closeDropdown)}
            </div>
          </div>
        </div>,
        document.body,
      );
    }

    if (!dropdownRef.current) return null;

    const rect = dropdownRef.current.getBoundingClientRect();
    const top = rect.bottom + window.scrollY + 2;
    const isRtl = document.documentElement.dir === "rtl";
    const effectiveAlign = isRtl
      ? align === "left"
        ? "right"
        : "left"
      : align;

    // Dropdown width is w-72 (288px)
    const dropdownWidth = 288;
    const padding = 10;

    let left: number | "auto" = "auto";
    let right: number | "auto" = "auto";

    if (effectiveAlign === "left") {
      const potentialLeft = rect.left;
      if (potentialLeft + dropdownWidth > window.innerWidth - padding) {
        // Aligns to right if overflows right
        right = window.innerWidth - rect.right;
      } else {
        left = rect.left;
      }
    } else {
      const potentialRight = window.innerWidth - rect.right;
      if (potentialRight + dropdownWidth > window.innerWidth - padding) {
        // Aligns to left if overflows left
        left = rect.left;
      } else {
        right = window.innerWidth - rect.right;
      }
    }

    // Add scroll offsets for portal absolute positioning
    if (left !== "auto") left += window.scrollX;
    if (right !== "auto") right -= window.scrollX;

    return createPortal(
      <div
        id="dropdown-portal-root"
        className={`absolute w-72 rounded-xl border border-border bg-background shadow-2xl z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${className}`}
        style={{
          top: `${top}px`,
          left: left === "auto" ? "auto" : `${left}px`,
          right: right === "auto" ? "auto" : `${right}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {renderMenu(closeDropdown)}
      </div>,
      document.body,
    );
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <div onClick={toggle} className="cursor-pointer">
        {trigger}
      </div>
      {getPortalContent()}
    </div>
  );
}

// Dropdown.Item subcomponent
interface DropdownItemProps {
  icon?: React.ReactNode;
  label: string;
  description?: string | React.ReactNode; // Now accepts both string and JSX
  rightContent?: React.ReactNode; // New prop for content on the right
  onClick?: () => void;
  variant?: "default" | "danger";
  className?: string; // New prop for custom styling
}

export function DropdownItem({
  icon,
  label,
  description,
  rightContent,
  onClick,
  variant = "default",
  className = "",
}: DropdownItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-3 flex items-${
        description ? "start" : "center"
      } gap-3 transition-colors ${
        variant === "danger"
          ? "hover:bg-danger/10 text-danger"
          : "hover:bg-border/50 text-text-primary"
      } ${className}`}
    >
      {icon && (
        <span className={`text-lg ${description ? "mt-0.5" : ""}`}>{icon}</span>
      )}
      <div className="flex-1 text-start">
        <div className="font-medium text-sm">{label}</div>
        {description && (
          <div className="text-xs text-text-secondary mt-0.5">
            {description}
          </div>
        )}
      </div>
      {rightContent && (
        <div className="flex items-center ms-2">{rightContent}</div>
      )}
    </button>
  );
}

// Dropdown.Divider subcomponent
export function DropdownDivider() {
  return <div className="my-2 border-t border-border" />;
}

// Dropdown.Header subcomponent
interface DropdownHeaderProps {
  children: React.ReactNode;
  className?: string; // New prop for custom styling
}

export function DropdownHeader({
  children,
  className = "",
}: DropdownHeaderProps) {
  return (
    <div
      className={`px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider ${className}`}
    >
      {children}
    </div>
  );
}
