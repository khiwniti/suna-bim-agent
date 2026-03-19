'use client';

/**
 * Auth Layout
 *
 * Shared layout for authentication pages (login, signup, forgot-password, etc.)
 * Provides consistent theming and structure across all auth flows.
 *
 * ★ Insight ─────────────────────────────────────
 * This layout centralizes the auth page structure that was previously
 * duplicated. The Logo in the header provides brand consistency and
 * easy navigation back to the landing page.
 * ─────────────────────────────────────────────────
 */

import { Logo } from '@/components/ui/Logo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header with logo for brand consistency and navigation */}
      <header className="absolute top-0 left-0 p-6 z-10">
        <Logo href="/" size="sm" />
      </header>

      {/* Main content - centered auth forms */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer with copyright */}
      <footer className="p-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} CarbonBIM. All rights reserved.</p>
      </footer>
    </div>
  );
}
