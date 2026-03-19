'use client';

/**
 * GenerativeUIRenderer - Dynamic Component Renderer for BIM Agent
 *
 * Renders generative UI components inline in chat messages
 * Pattern from: Vercel AI SDK render() + second-brain A2UIRenderer
 */

import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import type { GenerativeUIComponent } from '@/lib/generative-ui/types';
import { getComponentRenderer } from '@/lib/generative-ui/catalog';
import { cn } from '@/lib/utils';

interface GenerativeUIRendererProps {
  /** Component specification from backend or agent */
  component: GenerativeUIComponent;
  /** Optional wrapper class name */
  className?: string;
  /** Callback when component type not found */
  onMissingComponent?: (type: string) => void;
  /** Show error cards for missing components (default: true) */
  showErrors?: boolean;
}

/**
 * GenerativeUIRenderer Component
 *
 * Recursively renders generative UI component trees
 */
export function GenerativeUIRenderer({
  component,
  className,
  onMissingComponent,
  showErrors = true,
}: GenerativeUIRendererProps): React.ReactElement {
  // Handle invalid component spec
  if (!component || !component.type) {
    if (showErrors) {
      return (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm font-medium">Invalid Component</p>
          </div>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Component specification is missing or invalid.
          </p>
        </div>
      );
    }
    return <></>;
  }

  // Get the renderer for this component type
  const renderer = getComponentRenderer(component.type);

  // Handle unregistered component types
  if (!renderer) {
    if (onMissingComponent) {
      onMissingComponent(component.type);
    }

    if (showErrors) {
      return (
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20 p-3">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm font-medium">Unknown Component: {component.type}</p>
          </div>
          <details className="mt-2 text-xs text-muted-foreground">
            <summary className="cursor-pointer">Component Details</summary>
            <pre className="mt-2 p-2 bg-muted/50 rounded overflow-x-auto">
              {JSON.stringify(component, null, 2)}
            </pre>
          </details>
        </div>
      );
    }
    return <></>;
  }

  // Render children recursively
  const childComponents = component.children?.map((child, index) => (
    <GenerativeUIRenderer
      key={child.id || `child-${index}`}
      component={child}
      onMissingComponent={onMissingComponent}
      showErrors={showErrors}
    />
  ));

  // Apply layout and styling from component spec
  const wrapperClassName = cn(
    className,
    component.layout?.className,
    component.styling?.className
  );

  const wrapperStyle: React.CSSProperties = {
    ...(component.layout?.width && { width: component.layout.width }),
    ...(component.layout?.height && { height: component.layout.height }),
    ...(component.layout?.position && { position: component.layout.position }),
  };

  // Merge props with styling
  const componentProps = {
    ...component.props,
    ...(component.styling?.variant && { variant: component.styling.variant }),
    ...(component.styling?.theme && { theme: component.styling.theme }),
  };

  // Render the component
  const renderedComponent = renderer(componentProps, childComponents);

  // Wrap with layout if specified
  if (wrapperClassName || Object.keys(wrapperStyle).length > 0) {
    return (
      <motion.div
        className={wrapperClassName}
        style={wrapperStyle}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {renderedComponent}
      </motion.div>
    );
  }

  return renderedComponent;
}

/**
 * GenerativeUIRendererList Component
 *
 * Renders a list of generative UI components with stagger animation
 */
interface GenerativeUIRendererListProps {
  components: GenerativeUIComponent[];
  className?: string;
  onMissingComponent?: (type: string) => void;
  showErrors?: boolean;
  stagger?: boolean;
}

export function GenerativeUIRendererList({
  components,
  className,
  onMissingComponent,
  showErrors = true,
  stagger = true,
}: GenerativeUIRendererListProps) {
  if (!components || components.length === 0) {
    return null;
  }

  if (!stagger) {
    return (
      <div className={className}>
        {components.map((component, index) => (
          <GenerativeUIRenderer
            key={component.id || `component-${index}`}
            component={component}
            onMissingComponent={onMissingComponent}
            showErrors={showErrors}
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
    >
      {components.map((component, index) => (
        <motion.div
          key={component.id || `component-${index}`}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <GenerativeUIRenderer
            component={component}
            onMissingComponent={onMissingComponent}
            showErrors={showErrors}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
