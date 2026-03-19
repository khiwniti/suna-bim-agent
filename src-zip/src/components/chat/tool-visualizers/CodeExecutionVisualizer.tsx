'use client';

/**
 * CodeExecutionVisualizer Component
 *
 * Displays code execution with syntax highlighting, output tabs,
 * and exit code indicators. Wraps content in BaseToolCard.
 */

import { useState, useMemo, useId } from 'react';
import { Code2, Terminal, Loader2, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import { BaseToolCard } from './BaseToolCard';
import { CodeBlock } from '@/components/ui/CodeBlock';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { ToolCallVisualization } from '@/lib/generative-ui/types';

export interface CodeExecutionOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface CodeExecutionProps {
  /** Programming language for syntax highlighting */
  language: string;
  /** Code to display */
  code: string;
  /** Execution output (stdout, stderr, exitCode) */
  output?: CodeExecutionOutput;
  /** Execution status */
  status: 'running' | 'success' | 'error';
  /** Callback when copy button is clicked */
  onCopy?: () => void;
  /** Callback to run code in sandbox */
  onRunInSandbox?: () => void;
}

/**
 * CodeExecutionVisualizer - Display code execution with output
 */
export function CodeExecutionVisualizer({
  language,
  code,
  output,
  status,
  onCopy,
}: CodeExecutionProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const uniqueId = useId();

  // Create ToolCallVisualization object for BaseToolCard
  // useMemo to ensure stable reference and avoid calling Date during each render
  const toolCall: ToolCallVisualization = useMemo(() => ({
    id: `code-exec-${uniqueId}`,
    name: 'code_execution',
    status: status === 'running' ? 'running' : status === 'success' ? 'success' : 'error',
    startedAt: new Date(),
  }), [uniqueId, status]);

  // Map status to BaseToolCard status
  const cardStatus = status === 'running' ? 'running' : status === 'success' ? 'success' : 'error';

  const handleCopy = () => {
    // Use clipboard API if available, otherwise fall back
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <BaseToolCard
      toolCall={toolCall}
      status={cardStatus}
      icon={<Code2 className="w-4 h-4" />}
      headerActions={
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-xs"
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      }
    >
      <div className="space-y-3">
        {/* Running indicator */}
        {status === 'running' && (
          <div
            data-testid="running-indicator"
            className="flex items-center gap-2 text-sm text-primary"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Executing code...</span>
          </div>
        )}

        {/* Code block with syntax highlighting */}
        <CodeBlock language={language}>{code}</CodeBlock>

        {/* Output section with tabs */}
        {output && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Output
              </span>
              <Badge
                data-testid="exit-code-badge"
                variant={output.exitCode === 0 ? 'success' : 'danger'}
                className={cn(
                  'font-mono text-xs',
                  output.exitCode === 0
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-500/15 text-red-700 dark:text-red-400'
                )}
              >
                Exit: {output.exitCode}
              </Badge>
            </div>

            <Tabs defaultValue="stdout" className="w-full">
              <TabsList className="h-8">
                <TabsTrigger value="stdout" className="text-xs px-3 py-1">
                  stdout
                </TabsTrigger>
                <TabsTrigger value="stderr" className="text-xs px-3 py-1">
                  stderr
                </TabsTrigger>
              </TabsList>

              <TabsContent value="stdout" className="mt-2" forceMount>
                <div
                  data-testid="stdout-content"
                  className="rounded-md bg-muted/50 p-3 font-mono text-sm whitespace-pre-wrap overflow-x-auto data-[state=inactive]:hidden"
                >
                  {output.stdout || <span className="text-muted-foreground italic">{t('toolVisualizer.noOutput')}</span>}
                </div>
              </TabsContent>

              <TabsContent value="stderr" className="mt-2" forceMount>
                <div
                  data-testid="stderr-content"
                  className={cn(
                    'rounded-md bg-muted/50 p-3 font-mono text-sm whitespace-pre-wrap overflow-x-auto data-[state=inactive]:hidden',
                    output.stderr && 'text-red-600 dark:text-red-400'
                  )}
                >
                  {output.stderr || (
                    <span className="text-muted-foreground italic">{t('toolVisualizer.noErrors')}</span>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </BaseToolCard>
  );
}

export default CodeExecutionVisualizer;
