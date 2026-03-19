'use client';

/**
 * CodeBlock Component
 *
 * Enhanced code block with syntax highlighting, copy button,
 * and language label. Used in markdown rendering.
 */

import { Copy, Check, Terminal, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClipboard } from '@/hooks/useClipboard';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  /** Code content */
  children: string;
  /** Programming language */
  language?: string;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Custom className */
  className?: string;
  /** Whether code is inline (single line) */
  inline?: boolean;
}

// Language display names
const languageNames: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  py: 'Python',
  python: 'Python',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  json: 'JSON',
  yaml: 'YAML',
  yml: 'YAML',
  css: 'CSS',
  scss: 'SCSS',
  html: 'HTML',
  xml: 'XML',
  sql: 'SQL',
  md: 'Markdown',
  markdown: 'Markdown',
  rust: 'Rust',
  go: 'Go',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  csharp: 'C#',
  cs: 'C#',
  ruby: 'Ruby',
  rb: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  dockerfile: 'Dockerfile',
  docker: 'Docker',
  graphql: 'GraphQL',
  prisma: 'Prisma',
};

export function CodeBlock({
  children,
  language,
  showLineNumbers = false,
  className,
  inline = false,
}: CodeBlockProps) {
  const { copy, copied } = useClipboard();
  const code = typeof children === 'string' ? children : String(children);
  const lines = code.split('\n');
  const displayLanguage = language ? languageNames[language.toLowerCase()] || language : null;

  // Inline code
  if (inline) {
    return (
      <code
        className={cn(
          'px-1.5 py-0.5 rounded-md bg-muted font-mono text-sm',
          'text-foreground',
          className
        )}
      >
        {children}
      </code>
    );
  }

  return (
    <div className={cn('relative group rounded-lg overflow-hidden', className)}>
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/80 border-b border-border">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {language ? (
            <FileCode className="w-4 h-4" />
          ) : (
            <Terminal className="w-4 h-4" />
          )}
          <span>{displayLanguage || 'Code'}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => copy(code)}
          className={cn(
            'h-7 px-2 text-xs',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            copied && 'text-green-500'
          )}
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
      </div>

      {/* Code content */}
      <div className="overflow-x-auto bg-muted/50">
        <pre className="p-4 text-sm font-mono leading-relaxed">
          {showLineNumbers ? (
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="pr-4 text-right text-muted-foreground select-none w-8">
                      {i + 1}
                    </td>
                    <td className="whitespace-pre-wrap break-all">
                      {line || ' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <code className="whitespace-pre-wrap break-all">{code}</code>
          )}
        </pre>
      </div>
    </div>
  );
}

/**
 * Inline code component for use in markdown
 */
export function InlineCode({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <code
      className={cn(
        'px-1.5 py-0.5 rounded-md bg-muted font-mono text-sm',
        'text-foreground',
        className
      )}
    >
      {children}
    </code>
  );
}

export default CodeBlock;
