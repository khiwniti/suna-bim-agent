'use client';

/**
 * ClashReportPanel - Clash Detection Results
 *
 * Displays clash detection results with:
 * - Severity-based filtering (critical, major, minor)
 * - Element details for each clash
 * - Integration with 3D viewer for highlighting clashes
 *
 * Tambo-enabled: AI can update clash data via natural language.
 */

import { useState, useCallback } from 'react';
import { useTranslation } from '@/i18n/provider';
import { AlertTriangle } from 'lucide-react';
import { withTamboInteractable, type WithTamboInteractableProps } from '@tambo-ai/react';
import { ClashReportSchema, type ClashReportProps } from '@/lib/tambo/schemas';

/** Clash item from schema */
type ClashItem = NonNullable<ClashReportProps['clashes']>[number];

/** Severity type */
type Severity = 'critical' | 'major' | 'minor';

const SEVERITY_COLORS = {
  critical: 'bg-red-500',
  major: 'bg-amber-500',
  minor: 'bg-blue-500',
} as const;

const SEVERITY_TEXT_COLORS = {
  critical: 'text-red-500',
  major: 'text-amber-500',
  minor: 'text-blue-500',
} as const;

/** Inner component that receives Tambo props */
function ClashReportPanelInner(props: ClashReportProps & WithTamboInteractableProps) {
  const { clashes = [], summary } = props;
  const { t } = useTranslation();
  const [selectedClash, setSelectedClash] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<Severity | null>(null);

  // Handle clash click - highlight elements in 3D viewer
  const handleClashClick = useCallback((clash: ClashItem) => {
    setSelectedClash(clash.id);
    // Viewer highlighting would be handled via Tambo context or external store
  }, []);

  // Calculate summary from clashes if not provided
  const computedSummary = summary || {
    total: clashes.length,
    critical: clashes.filter((c) => c.severity === 'critical').length,
    major: clashes.filter((c) => c.severity === 'major').length,
    minor: clashes.filter((c) => c.severity === 'minor').length,
  };

  const hasData = clashes.length > 0;

  return (
    <div data-testid="clash-report-panel" className="h-full w-full flex flex-col">
      {!hasData ? (
        // Empty state
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('workspacePanel.noClashData')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('workspacePanel.runClashDetection')}
          </p>
        </div>
      ) : (
        // Clash data display
        <>
          {/* Summary header */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t('workspacePanel.clashReport')}</h3>
              <span className="text-sm text-muted-foreground">
                {computedSummary.total} {t('workspacePanel.clashesFound')}
              </span>
            </div>

            {/* Severity filter buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setFilterSeverity(null)}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors ${
                  !filterSeverity
                    ? 'bg-foreground text-background'
                    : 'bg-muted hover:bg-accent'
                }`}
              >
                {t('workspacePanel.all')} ({computedSummary.total})
              </button>
              <button
                onClick={() => setFilterSeverity('critical')}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
                  filterSeverity === 'critical'
                    ? 'bg-red-500 text-white'
                    : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {t('workspacePanel.critical')} ({computedSummary.critical})
              </button>
              <button
                onClick={() => setFilterSeverity('major')}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
                  filterSeverity === 'major'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {t('workspacePanel.major')} ({computedSummary.major})
              </button>
              <button
                onClick={() => setFilterSeverity('minor')}
                className={`px-3 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
                  filterSeverity === 'minor'
                    ? 'bg-blue-500 text-white'
                    : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                {t('workspacePanel.minor')} ({computedSummary.minor})
              </button>
            </div>
          </div>

          {/* Clash list */}
          <div className="flex-1 overflow-auto">
            {(filterSeverity
              ? clashes.filter((c) => c.severity === filterSeverity)
              : clashes
            ).map((clash) => (
              <div
                key={clash.id}
                className={`p-4 border-b border-border cursor-pointer transition-colors ${
                  selectedClash === clash.id
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : 'hover:bg-muted'
                }`}
                onClick={() => handleClashClick(clash)}
              >
                <div className="flex items-start gap-3">
                  {/* Severity indicator */}
                  <div
                    className={`w-3 h-3 rounded-full mt-1 ${SEVERITY_COLORS[clash.severity]}`}
                  />

                  <div className="flex-1 min-w-0">
                    {/* Clash type and ID */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium uppercase ${SEVERITY_TEXT_COLORS[clash.severity]}`}>
                        {clash.type}
                      </span>
                      <span className="text-xs text-muted-foreground">#{clash.id.slice(0, 8)}</span>
                      {clash.status === 'resolved' && (
                        <span className="text-xs bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">
                          {t('workspacePanel.resolved')}
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-foreground mb-1">
                      {clash.description}
                    </p>

                    {/* Elements involved */}
                    {clash.elements.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Elements: {clash.elements.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer with resolved count */}
          {clashes.some((c) => c.status === 'resolved') && (
            <div className="p-4 border-t border-border bg-green-50 dark:bg-green-900/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 dark:text-green-400">
                  ✓ {clashes.filter((c) => c.status === 'resolved').length} {t('workspacePanel.clashesResolved')}
                </span>
                <span className="text-muted-foreground">
                  {clashes.filter((c) => c.status !== 'resolved').length} {t('workspacePanel.remaining')}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Tambo-wrapped interactable component */
export const ClashReportInteractable = withTamboInteractable(ClashReportPanelInner, {
  componentName: 'ClashReport',
  description: 'Clash detection report showing conflicts between building systems',
  propsSchema: ClashReportSchema,
});

/** Default export for panel usage */
export function ClashReportPanel(props: ClashReportProps) {
  return <ClashReportInteractable {...props} />;
}
