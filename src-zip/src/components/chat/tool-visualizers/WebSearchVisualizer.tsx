'use client';

/**
 * WebSearchVisualizer Component
 *
 * Displays web search results with citations, search query display,
 * and result cards with Perplexity-style inline citations.
 */

import { useMemo, useId } from 'react';
import Image from 'next/image';
import { Search, Globe, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BaseToolCard } from './BaseToolCard';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';
import { useTranslation } from '@/i18n/provider';

export interface WebSearchResult {
  /** Result URL */
  url: string;
  /** Result title */
  title: string;
  /** Snippet/description text */
  snippet: string;
  /** Optional favicon URL */
  favicon?: string;
}

export interface WebSearchProps {
  /** Search query string */
  query: string;
  /** Array of search results */
  results: WebSearchResult[];
  /** Search status */
  status: 'searching' | 'complete';
}

/**
 * Extract domain from URL
 */
function getDomain(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Shimmer placeholder for loading state
 */
function ShimmerPlaceholder({ className }: { className?: string }) {
  return (
    <div
      data-testid="shimmer-placeholder"
      className={cn(
        'animate-pulse bg-gradient-to-r from-muted/50 via-muted to-muted/50',
        'rounded-lg',
        className
      )}
    />
  );
}

/**
 * Individual search result card
 */
function SearchResultCard({
  result,
  index,
}: {
  result: WebSearchResult;
  index: number;
}) {
  const domain = getDomain(result.url);

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-start gap-3 p-3',
        'bg-card/50 border border-border/50 rounded-lg',
        'hover:border-primary/50 hover:bg-card/80 hover:shadow-sm',
        'transition-all group'
      )}
    >
      {/* Favicon / Fallback icon */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        {result.favicon ? (
          <Image
            src={result.favicon}
            alt=""
            width={16}
            height={16}
            className="w-4 h-4"
            unoptimized
          />
        ) : (
          <Globe
            data-testid="fallback-icon"
            className="w-4 h-4 text-muted-foreground"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-primary font-semibold">[{index}]</span>
          <h5 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {result.title}
          </h5>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{domain}</p>
        <p className="text-xs text-muted-foreground/80 mt-1 line-clamp-2">
          {result.snippet}
        </p>
      </div>

      {/* External link indicator */}
      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
    </a>
  );
}

/**
 * WebSearchVisualizer - Display web search results with citations
 */
export function WebSearchVisualizer({
  query,
  results,
  status,
}: WebSearchProps) {
  const { t } = useTranslation();
  const uniqueId = useId();

  // Create ToolCallVisualization object for BaseToolCard
  const toolCall: ToolCallVisualization = useMemo(
    () => ({
      id: `web-search-${uniqueId}`,
      name: 'web_search',
      status: status === 'searching' ? 'running' : 'success',
      startedAt: new Date(),
    }),
    [uniqueId, status]
  );

  const cardStatus = status === 'searching' ? 'running' : 'success';

  return (
    <BaseToolCard
      toolCall={toolCall}
      status={cardStatus}
      icon={<Search className="w-4 h-4" />}
    >
      <div className="space-y-4">
        {/* Search query display */}
        <div className="flex items-center gap-2 text-sm">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium text-foreground truncate">{query}</span>
        </div>

        {/* Searching indicator */}
        {status === 'searching' && (
          <div
            data-testid="searching-indicator"
            className="flex items-center gap-2 text-sm text-primary"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('webSearch.searchingTheWeb')}</span>
          </div>
        )}

        {/* Shimmer placeholders during search */}
        {status === 'searching' && (
          <div className="space-y-2">
            <ShimmerPlaceholder className="h-20 w-full" />
            <ShimmerPlaceholder className="h-20 w-full" />
            <ShimmerPlaceholder className="h-20 w-full" />
          </div>
        )}

        {/* Results section */}
        {status === 'complete' && (
          <>
            {/* Result count */}
            <div className="text-xs text-muted-foreground">
              {results.length > 0
                ? t('webSearch.resultsFound', { count: results.length })
                : t('webSearch.noResultsFound')}
            </div>

            {/* Result cards */}
            {results.length > 0 ? (
              <div className="space-y-2">
                {results.map((result, index) => (
                  <SearchResultCard
                    key={result.url}
                    result={result}
                    index={index + 1}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic py-4 text-center">
                {t('webSearch.noResultsForQuery')}
              </div>
            )}
          </>
        )}
      </div>
    </BaseToolCard>
  );
}

export default WebSearchVisualizer;
