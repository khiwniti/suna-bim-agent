'use client';

/**
 * Logo Component
 *
 * Reusable logo component for consistent branding across the application.
 * Supports multiple sizes, optional text display, and link wrapping.
 *
 * ★ Insight ─────────────────────────────────────
 * This component centralizes the logo SVG that was previously duplicated
 * in auth pages, dashboard layout, and landing page. Using CSS variables
 * ensures the logo adapts to the current theme (light/dark).
 * ─────────────────────────────────────────────────
 */

import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface LogoProps {
  /** Size variant of the logo */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to show the text "CarbonBIM" next to the icon */
  showText?: boolean;
  /** If provided, wraps the logo in a Link component */
  href?: string;
  /** Additional CSS classes */
  className?: string;
  /** Custom text to display (defaults to "CarbonBIM") */
  text?: string;
  /** Whether to use monochrome styling */
  monochrome?: boolean;
}

const SIZE_MAP = {
  xs: {
    container: 'h-6 w-6',
    icon: 'h-3.5 w-3.5',
    text: 'text-sm',
    gap: 'gap-1.5',
  },
  sm: {
    container: 'h-8 w-8',
    icon: 'h-4 w-4',
    text: 'text-base',
    gap: 'gap-2',
  },
  md: {
    container: 'h-10 w-10',
    icon: 'h-5 w-5',
    text: 'text-lg',
    gap: 'gap-2',
  },
  lg: {
    container: 'h-12 w-12',
    icon: 'h-6 w-6',
    text: 'text-xl',
    gap: 'gap-3',
  },
  xl: {
    container: 'h-14 w-14',
    icon: 'h-7 w-7',
    text: 'text-2xl',
    gap: 'gap-3',
  },
};

/**
 * Building icon SVG used as the logo mark
 */
function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

export function Logo({
  size = 'md',
  showText = true,
  href,
  className,
  text = 'CarbonBIM',
  monochrome = false,
}: LogoProps) {
  const sizes = SIZE_MAP[size];

  const logoContent = (
    <div
      className={cn(
        'flex items-center',
        sizes.gap,
        className
      )}
    >
      {/* Icon container with gradient background */}
      <div
        className={cn(
          'flex items-center justify-center rounded-lg transition-all duration-200',
          sizes.container,
          monochrome
            ? 'bg-foreground/10'
            : 'bg-gradient-to-br from-primary to-accent shadow-sm'
        )}
      >
        <BuildingIcon
          className={cn(
            sizes.icon,
            monochrome ? 'text-foreground' : 'text-primary-foreground'
          )}
        />
      </div>

      {/* Text */}
      {showText && (
        <span
          className={cn(
            'font-semibold tracking-tight',
            sizes.text,
            monochrome ? 'text-foreground' : 'text-foreground'
          )}
        >
          {text}
        </span>
      )}
    </div>
  );

  // Wrap in Link if href is provided
  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
      >
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}

/**
 * Compact logo for use in tight spaces (icon only with optional tooltip)
 */
export function LogoIcon({
  size = 'sm',
  href,
  className,
  monochrome = false,
}: Omit<LogoProps, 'showText' | 'text'>) {
  return (
    <Logo
      size={size}
      showText={false}
      href={href}
      className={className}
      monochrome={monochrome}
    />
  );
}

export default Logo;
