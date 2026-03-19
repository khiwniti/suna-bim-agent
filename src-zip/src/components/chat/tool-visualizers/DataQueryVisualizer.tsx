'use client';

/**
 * DataQueryVisualizer Component
 *
 * Displays database/API query results with query type badges,
 * syntax highlighting, results table, and execution metrics.
 * Wraps content in BaseToolCard.
 */

import { useMemo, useId } from 'react';
import { Database, Code2, Share2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BaseToolCard } from './BaseToolCard';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Badge } from '@/components/ui/badge';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';

export interface DataQueryResult {
  data: Record<string, unknown>[];
  rowCount: number;
  executionTimeMs: number;
}

export interface DataQueryProps {
  /** Type of query being executed */
  queryType: 'sql' | 'api' | 'graphql';
  /** The query string or JSON */
  query: string;
  /** Query execution result */
  result?: DataQueryResult;
  /** Execution status */
  status: 'executing' | 'success' | 'error';
}

/** Maximum number of rows to display in the table */
const MAX_DISPLAY_ROWS = 10;

/**
 * Get the appropriate icon for each query type
 */
function getQueryTypeIcon(queryType: 'sql' | 'api' | 'graphql') {
  switch (queryType) {
    case 'sql':
      return <Database className="w-3 h-3" />;
    case 'api':
      return <Share2 className="w-3 h-3" />;
    case 'graphql':
      return <Code2 className="w-3 h-3" />;
  }
}

/**
 * Get the display label for each query type
 */
function getQueryTypeLabel(queryType: 'sql' | 'api' | 'graphql') {
  switch (queryType) {
    case 'sql':
      return 'SQL';
    case 'api':
      return 'API';
    case 'graphql':
      return 'GraphQL';
  }
}

/**
 * Get the syntax highlighting language for each query type
 */
function getSyntaxLanguage(queryType: 'sql' | 'api' | 'graphql') {
  switch (queryType) {
    case 'sql':
      return 'sql';
    case 'api':
      return 'json';
    case 'graphql':
      return 'graphql';
  }
}

/**
 * DataQueryVisualizer - Display database/API query results
 */
export function DataQueryVisualizer({
  queryType,
  query,
  result,
  status,
}: DataQueryProps) {
  const uniqueId = useId();

  // Create ToolCallVisualization object for BaseToolCard
  const toolCall: ToolCallVisualization = useMemo(
    () => ({
      id: `data-query-${uniqueId}`,
      name: 'data_query',
      status: status === 'executing' ? 'running' : status === 'success' ? 'success' : 'error',
      startedAt: new Date(),
    }),
    [uniqueId, status]
  );

  // Map status to BaseToolCard status
  const cardStatus = status === 'executing' ? 'running' : status === 'success' ? 'success' : 'error';

  // Extract column headers from result data
  const columns = useMemo(() => {
    if (!result?.data?.length) return [];
    return Object.keys(result.data[0]);
  }, [result]);

  // Limit displayed rows
  const displayedRows = useMemo(() => {
    if (!result?.data) return [];
    return result.data.slice(0, MAX_DISPLAY_ROWS);
  }, [result]);

  const hiddenRowCount = (result?.data?.length ?? 0) - MAX_DISPLAY_ROWS;

  return (
    <BaseToolCard
      toolCall={toolCall}
      status={cardStatus}
      icon={<Database className="w-4 h-4" />}
    >
      <div className="space-y-3">
        {/* Query type badge */}
        <div className="flex items-center gap-2">
          <Badge
            data-testid="query-type-badge"
            variant="info"
            className="flex items-center gap-1"
          >
            {getQueryTypeIcon(queryType)}
            {getQueryTypeLabel(queryType)}
          </Badge>
        </div>

        {/* Executing indicator */}
        {status === 'executing' && (
          <div
            data-testid="executing-indicator"
            className="flex items-center gap-2 text-sm text-primary"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Executing query...</span>
          </div>
        )}

        {/* Query with syntax highlighting */}
        <CodeBlock language={getSyntaxLanguage(queryType)}>{query}</CodeBlock>

        {/* Results section */}
        {result && (
          <div className="mt-4 space-y-2">
            {/* Results table */}
            {result.data.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      {columns.map((column) => (
                        <th
                          key={column}
                          scope="col"
                          className="px-3 py-2 text-left font-medium text-foreground"
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={cn(
                          'border-b border-border last:border-0',
                          rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/30'
                        )}
                      >
                        {columns.map((column) => (
                          <td
                            key={column}
                            className="px-3 py-2 text-muted-foreground font-mono text-xs"
                          >
                            {formatCellValue(row[column])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* More rows indicator */}
                {hiddenRowCount > 0 && (
                  <div
                    data-testid="more-rows-indicator"
                    className="px-3 py-2 text-center text-sm text-muted-foreground bg-muted/30 border-t border-border"
                  >
                    +{hiddenRowCount} more rows
                  </div>
                )}
              </div>
            ) : (
              <div
                data-testid="empty-results"
                className="rounded-md bg-muted/50 p-4 text-center text-sm text-muted-foreground"
              >
                No results returned
              </div>
            )}

            {/* Footer with row count and execution time */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{result.rowCount} rows</span>
              <span className="font-mono">{result.executionTimeMs} ms</span>
            </div>
          </div>
        )}
      </div>
    </BaseToolCard>
  );
}

/**
 * Format cell value for display
 */
function formatCellValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return '';
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

export default DataQueryVisualizer;
