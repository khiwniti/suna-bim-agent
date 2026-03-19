/**
 * MDX Content Renderer
 *
 * Renders markdown content with syntax highlighting and styling.
 */

'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

interface MDXContentProps {
  content: string;
}

export function MDXContent({ content }: MDXContentProps) {
  const components = useMemo(
    () => ({
      // Custom link component for internal links
      a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
        const isInternal = href?.startsWith('/');
        if (isInternal && href) {
          return (
            <Link href={href} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
              {children}
            </Link>
          );
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            {...props}
          >
            {children}
          </a>
        );
      },
      // Custom code block styling
      pre: ({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) => (
        <pre
          className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm text-slate-100"
          {...props}
        >
          {children}
        </pre>
      ),
      // Inline code styling
      code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) => {
        const isInline = !className;
        if (isInline) {
          return (
            <code
              className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-emerald-600 dark:bg-slate-800 dark:text-emerald-400"
              {...props}
            >
              {children}
            </code>
          );
        }
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
      // Heading styles
      h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h1 className="mb-4 mt-8 text-3xl font-bold text-slate-900 dark:text-white" {...props}>
          {children}
        </h1>
      ),
      h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h2 className="mb-3 mt-8 text-2xl font-bold text-slate-900 dark:text-white" {...props}>
          {children}
        </h2>
      ),
      h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3 className="mb-2 mt-6 text-xl font-bold text-slate-900 dark:text-white" {...props}>
          {children}
        </h3>
      ),
      // Paragraph styling
      p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p className="mb-4 leading-relaxed text-slate-600 dark:text-slate-400" {...props}>
          {children}
        </p>
      ),
      // List styling
      ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
        <ul className="mb-4 list-disc space-y-2 pl-6 text-slate-600 dark:text-slate-400" {...props}>
          {children}
        </ul>
      ),
      ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
        <ol className="mb-4 list-decimal space-y-2 pl-6 text-slate-600 dark:text-slate-400" {...props}>
          {children}
        </ol>
      ),
      // Blockquote styling
      blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
        <blockquote
          className="mb-4 border-l-4 border-emerald-500 pl-4 italic text-slate-600 dark:text-slate-400"
          {...props}
        >
          {children}
        </blockquote>
      ),
      // Horizontal rule
      hr: () => <hr className="my-8 border-slate-200 dark:border-slate-700" />,
      // Strong/bold
      strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
        <strong className="font-semibold text-slate-900 dark:text-white" {...props}>
          {children}
        </strong>
      ),
    }),
    []
  );

  return (
    <div className="prose prose-lg prose-slate max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeSlug]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
