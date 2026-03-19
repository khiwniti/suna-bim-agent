'use client';

/**
 * SourceCitations Component
 *
 * Display source citations with links for research/analysis results.
 * Shows sources in a compact, clickable format.
 */

import { useState } from 'react';
import Image from 'next/image';
import {
  ExternalLink,
  Link as LinkIcon,
  FileText,
  Globe,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Source {
  /** Source URL */
  url: string;
  /** Source title */
  title: string;
  /** Optional snippet/description */
  snippet?: string;
  /** Source type */
  type?: 'web' | 'document' | 'api' | 'database';
  /** Favicon URL */
  favicon?: string;
}

interface SourceCitationsProps {
  /** Array of source objects */
  sources: Source[];
  /** Maximum sources to show initially */
  maxVisible?: number;
  /** Display variant */
  variant?: 'inline' | 'list' | 'cards';
  /** Custom className */
  className?: string;
  /** Title for the section */
  title?: string;
}

const typeIcons = {
  web: Globe,
  document: FileText,
  api: LinkIcon,
  database: FileText,
};

export function SourceCitations({
  sources,
  maxVisible = 5,
  variant = 'inline',
  className,
  title = 'Sources',
}: SourceCitationsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  const visibleSources = expanded ? sources : sources.slice(0, maxVisible);
  const hasMore = sources.length > maxVisible;

  if (variant === 'inline') {
    return (
      <div className={cn('flex flex-wrap items-center gap-2 mt-3', className)}>
        <span className="text-xs text-muted-foreground">{title}:</span>
        {visibleSources.map((source, i) => (
          <SourceChip key={i} source={source} index={i + 1} />
        ))}
        {hasMore && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-primary hover:underline"
          >
            +{sources.length - maxVisible} more
          </button>
        )}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div className={cn('mt-4', className)}>
        <h4 className="text-sm font-medium mb-2">{title}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visibleSources.map((source, i) => (
            <SourceCard key={i} source={source} index={i + 1} />
          ))}
        </div>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="mt-2 w-full"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Show {sources.length - maxVisible} more sources
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  // List variant
  return (
    <div className={cn('mt-4', className)}>
      <h4 className="text-sm font-medium mb-2">{title}</h4>
      <ul className="space-y-1">
        {visibleSources.map((source, i) => (
          <SourceListItem key={i} source={source} index={i + 1} />
        ))}
      </ul>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-primary hover:underline mt-2"
        >
          {expanded ? 'Show less' : `Show ${sources.length - maxVisible} more`}
        </button>
      )}
    </div>
  );
}

/**
 * Compact chip-style source link
 */
function SourceChip({ source, index }: { source: Source; index: number }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1',
        'bg-muted/50 hover:bg-muted rounded-full',
        'text-xs text-muted-foreground hover:text-foreground',
        'transition-colors'
      )}
      title={source.title}
    >
      <span className="font-medium text-primary">[{index}]</span>
      <span className="truncate max-w-[150px]">{getDomain(source.url)}</span>
      <ExternalLink className="w-3 h-3 opacity-50" />
    </a>
  );
}

/**
 * Card-style source with more detail
 */
function SourceCard({ source, index }: { source: Source; index: number }) {
  const Icon = typeIcons[source.type || 'web'];

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-start gap-3 p-3',
        'bg-card border border-border rounded-lg',
        'hover:border-primary/50 hover:shadow-sm',
        'transition-all group'
      )}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        {source.favicon ? (
          <Image src={source.favicon} alt="" width={16} height={16} className="w-4 h-4" unoptimized />
        ) : (
          <Icon className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-xs text-primary font-medium">[{index}]</span>
          <h5 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {source.title}
          </h5>
        </div>
        <p className="text-xs text-muted-foreground truncate">{getDomain(source.url)}</p>
        {source.snippet && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{source.snippet}</p>
        )}
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

/**
 * Simple list item source
 */
function SourceListItem({ source, index }: { source: Source; index: number }) {
  return (
    <li>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center gap-2 py-1 text-sm',
          'text-muted-foreground hover:text-foreground',
          'transition-colors group'
        )}
      >
        <span className="text-primary font-medium">[{index}]</span>
        <span className="truncate">{source.title}</span>
        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>
    </li>
  );
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

export default SourceCitations;
