'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'icon-sm' | 'icon-lg';
  isLoading?: boolean;
  glow?: boolean;
  shine?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', isLoading, disabled, glow, shine, children, ...props }, ref) => {
    const baseStyles = `
      relative inline-flex items-center justify-center gap-2
      font-medium rounded-xl
      transition-all duration-300 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
      disabled:pointer-events-none disabled:opacity-50
      active:scale-[0.97]
      overflow-hidden
    `;

    const variants = {
      default: `
        bg-foreground text-background
        hover:bg-foreground/90
        shadow-sm hover:shadow-md
      `,
      primary: `
        bg-gradient-to-r from-primary to-primary/90
        text-primary-foreground
        hover:from-primary/90 hover:to-primary
        shadow-md shadow-primary/25
        hover:shadow-lg hover:shadow-primary/30
        hover:-translate-y-0.5
      `,
      secondary: `
        bg-secondary text-secondary-foreground
        hover:bg-secondary/80
        border border-border/50
        hover:border-primary/30
      `,
      outline: `
        border-2 border-input bg-transparent
        hover:bg-accent/50 hover:text-accent-foreground
        hover:border-primary/50
      `,
      ghost: `
        hover:bg-accent/50 hover:text-accent-foreground
        hover:backdrop-blur-sm
      `,
      destructive: `
        bg-gradient-to-r from-destructive to-red-600
        text-destructive-foreground
        hover:from-destructive/90 hover:to-red-600/90
        shadow-md shadow-destructive/25
        hover:shadow-lg hover:shadow-destructive/30
      `,
      gradient: `
        bg-gradient-to-r from-primary via-accent to-purple-500
        text-white font-semibold
        shadow-lg shadow-primary/30
        hover:shadow-xl hover:shadow-primary/40
        hover:-translate-y-0.5
        animate-gradient bg-[length:200%_200%]
      `,
    };

    const sizes = {
      xs: 'h-7 px-2.5 text-xs rounded-lg',
      sm: 'h-8 px-3 text-sm rounded-lg',
      md: 'h-10 px-5 text-sm',
      lg: 'h-12 px-6 text-base',
      xl: 'h-14 px-8 text-lg font-semibold',
      icon: 'h-10 w-10',
      'icon-sm': 'h-8 w-8 rounded-lg',
      'icon-lg': 'h-12 w-12',
    };

    const glowStyles = glow ? `
      before:absolute before:inset-[-2px]
      before:bg-gradient-to-r before:from-primary before:via-accent before:to-purple-500
      before:rounded-[inherit] before:opacity-0
      before:transition-opacity before:duration-300
      before:blur-lg before:-z-10
      hover:before:opacity-60
    ` : '';

    const shineStyles = shine ? `
      after:absolute after:top-0 after:left-[-100%]
      after:w-full after:h-full
      after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent
      after:transition-[left] after:duration-500
      hover:after:left-[100%]
    ` : '';

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], glowStyles, shineStyles, className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
