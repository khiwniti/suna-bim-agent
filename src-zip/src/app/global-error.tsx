"use client";

/**
 * Global Error Page
 *
 * Catches and displays unhandled errors in the application.
 * Integrates with production error logging service.
 */

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/error-logging";
import { t as translate, getStoredLocale, defaultLocale } from "@/i18n/index";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Use standalone translation function - can't use useTranslation hook in error boundary
  // as it operates outside the I18nProvider context
  const locale = getStoredLocale() ?? defaultLocale;
  const t = (key: string) => translate(locale, key);

  useEffect(() => {
    // Log the error to production logging service
    logError(error, {
      component: "GlobalErrorPage",
      action: "unhandled-error",
      metadata: {
        digest: error.digest,
        url: typeof window !== "undefined" ? window.location.href : "unknown",
      },
    });
  }, [error]);

  return (
    <html>
      <body className="bg-background">
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-bold text-foreground">
              {t("errorPage.globalError.title")}
            </h1>
            <p className="mb-6 text-muted-foreground">
              {t("errorPage.globalError.description")}
            </p>
            {error.digest && (
              <p className="mb-4 text-xs text-muted-foreground/80">
                {t("common.errorId")}: {error.digest}
              </p>
            )}
            <div className="flex justify-center gap-4">
              <Button onClick={reset} className="bg-primary hover:bg-primary/90">
                {t("common.retry")}
              </Button>
              <Button
                onClick={() => (window.location.href = "/")}
                variant="outline"
                className="border-border text-muted-foreground hover:bg-muted"
              >
                {t("common.goHome")}
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
