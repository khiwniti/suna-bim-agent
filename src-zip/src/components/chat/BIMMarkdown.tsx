'use client';

/**
 * BIMMarkdown - Professional markdown renderer for BIM AI responses
 *
 * Features:
 * - Beautiful typography with BIM-specific styling
 * - Tables with zebra striping and hover effects
 * - Code blocks with syntax highlighting colors
 * - Cards for structured data display
 * - Icons for BIM-related terms (materials, elements, etc.)
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';
import {
  Box,
  Layers,
  Ruler,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
  ChevronRight,
  Building2,
  Leaf,
  Zap,
  Package,
} from 'lucide-react';
import type { Components } from 'react-markdown';

interface BIMMarkdownProps {
  content: string;
  className?: string;
}

// Icon mapping for BIM terms
const BIM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  material: Package,
  element: Box,
  wall: Layers,
  floor: Layers,
  roof: Layers,
  window: Box,
  door: Box,
  volume: Box,
  area: Ruler,
  carbon: Leaf,
  energy: Zap,
  building: Building2,
};

// Get icon for section title
function getSectionIcon(text: string): React.ComponentType<{ className?: string }> | null {
  const lowerText = text.toLowerCase();
  for (const [keyword, icon] of Object.entries(BIM_ICONS)) {
    if (lowerText.includes(keyword)) {
      return icon;
    }
  }
  return null;
}

// Custom components for react-markdown
const markdownComponents: Components = {
  // Headers with icons and gradient underlines
  h1: ({ children, ...props }) => {
    const text = String(children);
    const Icon = getSectionIcon(text) || Building2;
    return (
      <h1
        className="flex items-center gap-3 text-xl font-bold text-foreground mb-4 mt-6 first:mt-0 pb-2 border-b border-border/50"
        {...props}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <span>{children}</span>
      </h1>
    );
  },

  h2: ({ children, ...props }) => {
    const text = String(children);
    const Icon = getSectionIcon(text) || Info;
    return (
      <h2
        className="flex items-center gap-2.5 text-lg font-semibold text-foreground mb-3 mt-5 first:mt-0"
        {...props}
      >
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <span>{children}</span>
      </h2>
    );
  },

  h3: ({ children, ...props }) => {
    const text = String(children);
    const Icon = getSectionIcon(text);
    return (
      <h3
        className="flex items-center gap-2 text-base font-semibold text-foreground mb-2 mt-4 first:mt-0"
        {...props}
      >
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <span>{children}</span>
      </h3>
    );
  },

  h4: ({ children, ...props }) => (
    <h4 className="text-sm font-semibold text-foreground mb-2 mt-3 first:mt-0" {...props}>
      {children}
    </h4>
  ),

  // Paragraphs with better spacing
  p: ({ children, ...props }) => (
    <p className="text-sm text-foreground/90 leading-relaxed mb-3 last:mb-0" {...props}>
      {children}
    </p>
  ),

  // Lists with custom bullets
  ul: ({ children, ...props }) => (
    <ul className="space-y-1.5 mb-3 ml-1" {...props}>
      {children}
    </ul>
  ),

  ol: ({ children, ...props }) => (
    <ol className="space-y-1.5 mb-3 ml-1 list-decimal list-inside" {...props}>
      {children}
    </ol>
  ),

  li: ({ children, ...props }) => (
    <li className="flex items-start gap-2 text-sm text-foreground/90" {...props}>
      <ChevronRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),

  // Tables with professional styling
  table: ({ children, ...props }) => (
    <div className="my-4 overflow-hidden rounded-lg border border-border/50 bg-card/30">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" {...props}>
          {children}
        </table>
      </div>
    </div>
  ),

  thead: ({ children, ...props }) => (
    <thead className="bg-muted/50 border-b border-border/50" {...props}>
      {children}
    </thead>
  ),

  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-border/30" {...props}>
      {children}
    </tbody>
  ),

  tr: ({ children, ...props }) => (
    <tr className="hover:bg-muted/30 transition-colors" {...props}>
      {children}
    </tr>
  ),

  th: ({ children, ...props }) => (
    <th
      className="px-3 py-2.5 text-left text-xs font-semibold text-foreground uppercase tracking-wider"
      {...props}
    >
      {children}
    </th>
  ),

  td: ({ children, ...props }) => (
    <td className="px-3 py-2.5 text-sm text-foreground/80 whitespace-nowrap" {...props}>
      {children}
    </td>
  ),

  // Code blocks with syntax-like coloring
  code: ({ children, className, ...props }) => {
    const isInline = !className;

    if (isInline) {
      return (
        <code
          className="px-1.5 py-0.5 rounded-md bg-muted text-primary text-xs font-mono"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <code
        className={cn(
          'block p-3 rounded-lg bg-muted/50 border border-border/50',
          'text-xs font-mono text-foreground/80 overflow-x-auto',
          className
        )}
        {...props}
      >
        {children}
      </code>
    );
  },

  pre: ({ children, ...props }) => (
    <pre className="my-3 rounded-lg overflow-hidden" {...props}>
      {children}
    </pre>
  ),

  // Blockquotes as callout cards
  blockquote: ({ children, ...props }) => (
    <blockquote
      className={cn(
        'my-3 p-3 rounded-lg border-l-4',
        'bg-primary/5 border-primary/50',
        'text-sm text-foreground/80'
      )}
      {...props}
    >
      <div className="flex items-start gap-2">
        <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 [&>p]:mb-0">{children}</div>
      </div>
    </blockquote>
  ),

  // Strong/bold with primary color
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-foreground" {...props}>
      {children}
    </strong>
  ),

  // Emphasis/italic
  em: ({ children, ...props }) => (
    <em className="italic text-foreground/70" {...props}>
      {children}
    </em>
  ),

  // Horizontal rules
  hr: ({ ...props }) => (
    <hr className="my-4 border-t border-border/50" {...props} />
  ),

  // Links
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
};

// Detect special sections and wrap them in cards
function preprocessContent(content: string): string {
  // Add visual separators for certain patterns
  let processed = content;

  // Fix malformed LaTeX from AI responses
  // Convert \textm³ to proper \text{m³} syntax
  processed = processed.replace(/\\text([^{])/g, '\\text{$1}');

  // Fix incomplete \text{} blocks - ensure they're closed
  processed = processed.replace(/\\text\{([^}]*?)(\s*[,\.\)\]])/g, '\\text{$1}$2');

  // Convert [formula] blocks to $formula$ for inline math
  processed = processed.replace(/\[\s*\\([^[\]]+)\s*\]/g, '$\\$1$');

  // Clean up common unit patterns for better rendering
  processed = processed.replace(/(\d+)\s*m²/g, '$1 m²');
  processed = processed.replace(/(\d+)\s*m³/g, '$1 m³');
  processed = processed.replace(/(\d+)\s*kgCO2e/g, '$1 kgCO₂e');
  processed = processed.replace(/(\d+)\s*kWh/g, '$1 kWh');
  processed = processed.replace(/CO2e/g, 'CO₂e');
  processed = processed.replace(/CO2/g, 'CO₂');

  // Highlight warnings/alerts
  processed = processed.replace(
    /^(Warning|⚠️|Alert|Caution):/gim,
    '> ⚠️ **$1:**'
  );

  // Highlight success messages
  processed = processed.replace(
    /^(Success|✅|Complete|Done):/gim,
    '> ✅ **$1:**'
  );

  // Highlight recommendations
  processed = processed.replace(
    /^(Recommendation|Tip|💡|Suggestion):/gim,
    '> 💡 **$1:**'
  );

  return processed;
}

export function BIMMarkdown({ content, className }: BIMMarkdownProps) {
  const processedContent = preprocessContent(content);

  return (
    <div className={cn('bim-markdown prose-sm max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={markdownComponents}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

// Specialized card components for structured BIM data
interface DataCardProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info';
}

export function DataCard({ title, icon: Icon, children, variant = 'default' }: DataCardProps) {
  const variants = {
    default: 'bg-card/50 border-border/50',
    success: 'bg-emerald-500/10 border-emerald-500/30',
    warning: 'bg-amber-500/10 border-amber-500/30',
    info: 'bg-blue-500/10 border-blue-500/30',
  };

  const iconVariants = {
    default: 'text-primary',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    info: 'text-blue-500',
  };

  return (
    <div className={cn('rounded-lg border p-3', variants[variant])}>
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className={cn('w-4 h-4', iconVariants[variant])} />}
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <div className="text-sm text-foreground/80">{children}</div>
    </div>
  );
}

// Quick stat display for BIM metrics
interface QuickStatProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
}

export function QuickStat({ label, value, unit, icon: Icon, trend }: QuickStatProps) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
      {Icon && (
        <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {value}
          {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

export default BIMMarkdown;
