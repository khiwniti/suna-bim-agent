'use client';

import { memo } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionsProps {
  suggestions: string[];
  isLoading: boolean;
  onSelect: (suggestion: string) => void;
}

/**
 * Suggestions
 *
 * AI-generated follow-up suggestions displayed after responses.
 * Users can click to auto-fill and submit a suggestion.
 */
export const Suggestions = memo(function Suggestions({
  suggestions,
  isLoading,
  onSelect,
}: SuggestionsProps) {
  if (isLoading) {
    return (
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 animate-pulse" />
          <span>Generating suggestions...</span>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="px-4 pb-3 border-t border-border/50 pt-3 bg-muted/20">
      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3" />
        <span>Suggested follow-ups</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.slice(0, 4).map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => onSelect(suggestion)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full',
              'bg-background border border-border',
              'hover:border-primary hover:bg-primary/5',
              'text-foreground transition-colors',
              'max-w-[200px] truncate'
            )}
            title={suggestion}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
});
