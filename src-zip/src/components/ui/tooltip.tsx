/**
 * Tooltip Component
 *
 * Accessible tooltip with Radix UI primitives and animation.
 * Follows shadcn/ui patterns for consistency.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================
// Context
// ============================================

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltip() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within TooltipProvider');
  }
  return context;
}

// ============================================
// TooltipProvider
// ============================================

export interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
  skipDelayDuration?: number;
}

export function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

// ============================================
// Tooltip
// ============================================

export interface TooltipProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
}

export function Tooltip({
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  delayDuration = 300,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const timeoutRef = React.useRef<number | null>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (newOpen) {
        timeoutRef.current = window.setTimeout(() => {
          if (!isControlled) {
            setUncontrolledOpen(true);
          }
          onOpenChange?.(true);
        }, delayDuration);
      } else {
        if (!isControlled) {
          setUncontrolledOpen(false);
        }
        onOpenChange?.(false);
      }
    },
    [isControlled, onOpenChange, delayDuration]
  );

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  );
}

// ============================================
// TooltipTrigger
// ============================================

export interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export const TooltipTrigger = React.forwardRef<HTMLButtonElement, TooltipTriggerProps>(
  function TooltipTrigger({ children, asChild = false }, forwardedRef) {
    const { setOpen, triggerRef } = useTooltip();

    const handleMouseEnter = () => setOpen(true);
    const handleMouseLeave = () => setOpen(false);
    const handleFocus = () => setOpen(true);
    const handleBlur = () => setOpen(false);

    // If asChild, clone the child element with handlers
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
        onFocus: handleFocus,
        onBlur: handleBlur,
        ref: (node: HTMLElement | null) => {
          triggerRef.current = node;
          if (forwardedRef) {
            if (typeof forwardedRef === 'function') {
              forwardedRef(node as HTMLButtonElement | null);
            } else {
              forwardedRef.current = node as HTMLButtonElement | null;
            }
          }
        },
      } as React.HTMLAttributes<HTMLElement>);
    }

    return (
      <button
        type="button"
        ref={(node) => {
          triggerRef.current = node;
          if (forwardedRef) {
            if (typeof forwardedRef === 'function') {
              forwardedRef(node);
            } else {
              forwardedRef.current = node;
            }
          }
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="inline-flex"
      >
        {children}
      </button>
    );
  }
);

// ============================================
// TooltipContent
// ============================================

export interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
}

export const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  function TooltipContent(
    { className, children, side = 'top', sideOffset = 4, ...props },
    ref
  ) {
    const { open, triggerRef } = useTooltip();
    const [position, setPosition] = React.useState({ top: 0, left: 0 });
    const contentRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
      if (open && triggerRef.current && contentRef.current) {
        const triggerRect = triggerRef.current.getBoundingClientRect();
        const contentRect = contentRef.current.getBoundingClientRect();

        let top = 0;
        let left = 0;

        switch (side) {
          case 'top':
            top = triggerRect.top - contentRect.height - sideOffset;
            left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
            break;
          case 'bottom':
            top = triggerRect.bottom + sideOffset;
            left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
            break;
          case 'left':
            top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
            left = triggerRect.left - contentRect.width - sideOffset;
            break;
          case 'right':
            top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
            left = triggerRect.right + sideOffset;
            break;
        }

        // Keep within viewport
        const padding = 8;
        left = Math.max(padding, Math.min(left, window.innerWidth - contentRect.width - padding));
        top = Math.max(padding, Math.min(top, window.innerHeight - contentRect.height - padding));

        setPosition({ top, left });
      }
    }, [open, side, sideOffset, triggerRef]);

    if (!open) return null;

    return (
      <div
        ref={(node) => {
          contentRef.current = node;
          if (ref) {
            if (typeof ref === 'function') {
              ref(node);
            } else {
              ref.current = node;
            }
          }
        }}
        role="tooltip"
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          zIndex: 50,
        }}
        className={cn(
          'z-50 overflow-hidden rounded-md',
          'bg-foreground text-background',
          'px-3 py-1.5 text-xs shadow-md',
          'animate-in fade-in-0 zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2',
          'data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2',
          'data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        data-side={side}
        {...props}
      >
        {children}
      </div>
    );
  }
);
