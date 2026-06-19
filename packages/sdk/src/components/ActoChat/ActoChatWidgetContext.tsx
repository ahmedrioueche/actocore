import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSuppressedWhenSelector } from '../../hooks/use-suppressed-when-selector';
import { useActocoreUiConfig } from '../../context/actocore-context';
import type { ActocoreLauncherPlacement } from '../../config/types';

export interface ActoChatWidgetContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  placement: ActocoreLauncherPlacement;
  suppressed: boolean;
  chatMounted: boolean;
  panelVisible: boolean;
}

const ActoChatWidgetContext = createContext<ActoChatWidgetContextValue | null>(
  null,
);

export interface ActoChatWidgetProviderProps {
  children: ReactNode;
  initialOpen?: boolean;
  hideWhenSelector?: string;
}

export function ActoChatWidgetProvider({
  children,
  initialOpen = false,
  hideWhenSelector: hideWhenSelectorProp,
}: ActoChatWidgetProviderProps) {
  const ui = useActocoreUiConfig();
  const hideWhenSelector =
    hideWhenSelectorProp ?? ui.widget?.hideWhenSelector;
  const suppressed = useSuppressedWhenSelector(hideWhenSelector);
  const placement = ui.launcher?.placement ?? 'floating';
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [chatMounted, setChatMounted] = useState(initialOpen);
  const [panelVisible, setPanelVisible] = useState(initialOpen);

  useEffect(() => {
    if (isOpen) {
      setChatMounted(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPanelVisible(false);
      return;
    }
    const frame = requestAnimationFrame(() => setPanelVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (suppressed && isOpen) {
      setIsOpen(false);
    }
  }, [suppressed, isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  const value = useMemo(
    (): ActoChatWidgetContextValue => ({
      isOpen,
      open,
      close,
      toggle,
      placement,
      suppressed,
      chatMounted,
      panelVisible,
    }),
    [
      chatMounted,
      close,
      isOpen,
      open,
      panelVisible,
      placement,
      suppressed,
      toggle,
    ],
  );

  if (suppressed) {
    return null;
  }

  return (
    <ActoChatWidgetContext.Provider value={value}>
      {children}
    </ActoChatWidgetContext.Provider>
  );
}

export function useActoChatWidget(): ActoChatWidgetContextValue {
  const ctx = useContext(ActoChatWidgetContext);
  if (!ctx) {
    throw new Error('useActoChatWidget must be used within ActoChatWidgetProvider');
  }
  return ctx;
}

export function useOptionalActoChatWidget():
  | ActoChatWidgetContextValue
  | null {
  return useContext(ActoChatWidgetContext);
}
