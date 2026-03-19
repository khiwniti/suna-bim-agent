/**
 * Tambo VS Code Component Registry
 *
 * Registry for dynamic generative UI components that can be rendered in VS Code webviews.
 * Implements the Tambo SDK pattern with additional VS Code-specific integrations.
 *
 * Key Features:
 * - Dynamic component registration with Zod schemas
 * - Error boundaries and loading states for async generation
 * - Streaming props support for progressive rendering
 * - Bidirectional state sync with VS Code extension host
 *
 * @module tambo-mcp/component-registry
 */

import { z } from 'zod';
import type { FC, ReactNode } from 'react';

// ============================================
// Types
// ============================================

/**
 * Base schema for all Tambo components
 */
export type TamboPropsSchema = z.ZodObject<z.ZodRawShape>;

/**
 * Component render state for streaming/loading
 */
export type ComponentRenderState = 'loading' | 'streaming' | 'complete' | 'error';

/**
 * Component instance with runtime metadata
 */
export interface ComponentInstance<T = unknown> {
  id: string;
  componentName: string;
  props: T;
  renderState: ComponentRenderState;
  streamingProps?: Partial<T>;
  error?: Error;
  createdAt: number;
  updatedAt: number;
}

/**
 * Single registered Tambo component
 * Follows the @tambo-ai/react TamboComponent interface
 */
export interface TamboRegisteredComponent<TProps = Record<string, unknown>> {
  /** Unique component name */
  name: string;
  /** Human-readable description for AI context */
  description: string;
  /** The React component implementation */
  component: FC<TProps>;
  /** Zod schema defining component props */
  propsSchema: z.ZodObject<z.ZodRawShape>;
  /** Optional category for grouping */
  category?: 'artifact' | 'hitl' | 'visualization' | 'input' | 'layout';
  /** Whether component supports streaming props */
  supportsStreaming?: boolean;
  /** VS Code-specific panel target */
  targetPanel?: string;
}

/**
 * Registry configuration options
 */
export interface RegistryConfig {
  /** Enable validation of props against schema */
  validateProps?: boolean;
  /** Enable component caching */
  enableCache?: boolean;
  /** Max cached component instances */
  maxCacheSize?: number;
}

// ============================================
// Error Boundary Types
// ============================================

export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  componentName: string;
}

// ============================================
// Loading State Types
// ============================================

export interface LoadingStateProps {
  componentName: string;
  progress?: number;
  message?: string;
}

// ============================================
// Component Registry Class
// ============================================

/**
 * Central registry for Tambo generative UI components.
 *
 * Manages component registration, validation, and rendering lifecycle.
 * Integrates with VS Code webview for cross-context communication.
 *
 * @example
 * ```typescript
 * const registry = new ComponentRegistry();
 *
 * // Register a component
 * registry.register({
 *   name: 'CarbonResultCard',
 *   description: 'Displays carbon footprint analysis results',
 *   component: CarbonResultCard,
 *   propsSchema: carbonResultCardSchema,
 *   category: 'artifact',
 *   supportsStreaming: true,
 * });
 *
 * // Render a component by name
 * const element = registry.render('CarbonResultCard', {
 *   totalCarbon: 1250000,
 *   unit: 'kgCO2e',
 * });
 * ```
 */
export class ComponentRegistry {
  private components = new Map<string, TamboRegisteredComponent>();
  private instances = new Map<string, ComponentInstance>();
  private config: Required<RegistryConfig>;
  private listeners = new Set<(event: RegistryEvent) => void>();

  constructor(config?: RegistryConfig) {
    this.config = {
      validateProps: true,
      enableCache: true,
      maxCacheSize: 100,
      ...config,
    };
  }

  // ============================================
  // Registration Methods
  // ============================================

  /**
   * Register a single component
   */
  register<TProps>(component: TamboRegisteredComponent<TProps>): void {
    if (this.components.has(component.name)) {
      console.warn(
        `[ComponentRegistry] Overwriting existing component: ${component.name}`
      );
    }

    this.components.set(
      component.name,
      component as TamboRegisteredComponent<Record<string, unknown>>
    );

    this.emit({
      type: 'component-registered',
      componentName: component.name,
      timestamp: Date.now(),
    });
  }

  /**
   * Register multiple components at once
   */
  registerAll(components: TamboRegisteredComponent[]): void {
    for (const component of components) {
      this.register(component);
    }
  }

  /**
   * Unregister a component
   */
  unregister(name: string): boolean {
    const removed = this.components.delete(name);
    if (removed) {
      this.emit({
        type: 'component-unregistered',
        componentName: name,
        timestamp: Date.now(),
      });
    }
    return removed;
  }

  // ============================================
  // Query Methods
  // ============================================

  /**
   * Get a registered component by name
   */
  get(name: string): TamboRegisteredComponent | undefined {
    return this.components.get(name);
  }

  /**
   * Check if a component is registered
   */
  has(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * Get all registered component names
   */
  getNames(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Get all registered components
   */
  getAll(): TamboRegisteredComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * Get components by category
   */
  getByCategory(
    category: TamboRegisteredComponent['category']
  ): TamboRegisteredComponent[] {
    return this.getAll().filter((c) => c.category === category);
  }

  /**
   * Get component descriptions for AI context
   */
  getDescriptions(): Array<{ name: string; description: string }> {
    return this.getAll().map((c) => ({
      name: c.name,
      description: c.description,
    }));
  }

  // ============================================
  // Validation Methods
  // ============================================

  /**
   * Validate props against component schema
   */
  validateProps(
    componentName: string,
    props: unknown
  ): { success: boolean; error?: z.ZodError } {
    const component = this.get(componentName);
    if (!component) {
      return {
        success: false,
        error: new z.ZodError([
          {
            code: 'custom',
            message: `Component not found: ${componentName}`,
            path: [],
          },
        ]),
      };
    }

    const result = component.propsSchema.safeParse(props);
    return result.success
      ? { success: true }
      : { success: false, error: result.error };
  }

  // ============================================
  // Instance Management
  // ============================================

  /**
   * Create a component instance for rendering
   */
  createInstance<T = unknown>(
    componentName: string,
    props: T,
    options?: { id?: string; streaming?: boolean }
  ): ComponentInstance<T> {
    const id = options?.id || `${componentName}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    // Validate props if enabled
    if (this.config.validateProps) {
      const validation = this.validateProps(componentName, props);
      if (!validation.success) {
        console.error(
          `[ComponentRegistry] Invalid props for ${componentName}:`,
          validation.error
        );
      }
    }

    const instance: ComponentInstance<T> = {
      id,
      componentName,
      props,
      renderState: options?.streaming ? 'streaming' : 'complete',
      streamingProps: options?.streaming ? (props as Partial<T>) : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Cache instance if enabled
    if (this.config.enableCache) {
      this.instances.set(id, instance as ComponentInstance);
      this.pruneCache();
    }

    this.emit({
      type: 'instance-created',
      instanceId: id,
      componentName,
      timestamp: Date.now(),
    });

    return instance;
  }

  /**
   * Update streaming props on an instance
   */
  updateStreamingProps<T>(
    instanceId: string,
    partialProps: Partial<T>
  ): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    instance.streamingProps = {
      ...instance.streamingProps,
      ...partialProps,
    };
    instance.updatedAt = Date.now();

    this.emit({
      type: 'instance-updated',
      instanceId,
      componentName: instance.componentName,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Mark streaming as complete, merge streaming props
   */
  completeStreaming(instanceId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    if (instance.streamingProps) {
      instance.props = {
        ...instance.props,
        ...instance.streamingProps,
      };
      instance.streamingProps = undefined;
    }

    instance.renderState = 'complete';
    instance.updatedAt = Date.now();

    this.emit({
      type: 'instance-completed',
      instanceId,
      componentName: instance.componentName,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Mark instance as errored
   */
  setInstanceError(instanceId: string, error: Error): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    instance.renderState = 'error';
    instance.error = error;
    instance.updatedAt = Date.now();

    this.emit({
      type: 'instance-error',
      instanceId,
      componentName: instance.componentName,
      error,
      timestamp: Date.now(),
    });

    return true;
  }

  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): ComponentInstance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Delete instance
   */
  deleteInstance(instanceId: string): boolean {
    return this.instances.delete(instanceId);
  }

  // ============================================
  // Event System
  // ============================================

  /**
   * Subscribe to registry events
   */
  subscribe(listener: (event: RegistryEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit(event: RegistryEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[ComponentRegistry] Event listener error:', err);
      }
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  private pruneCache(): void {
    if (this.instances.size <= this.config.maxCacheSize) return;

    // Sort by updatedAt and remove oldest
    const sorted = Array.from(this.instances.entries()).sort(
      ([, a], [, b]) => a.updatedAt - b.updatedAt
    );

    const toRemove = sorted.slice(0, sorted.length - this.config.maxCacheSize);
    for (const [id] of toRemove) {
      this.instances.delete(id);
    }
  }

  /**
   * Clear all instances (not components)
   */
  clearInstances(): void {
    this.instances.clear();
  }

  /**
   * Clear everything including components
   */
  reset(): void {
    this.components.clear();
    this.instances.clear();
  }
}

// ============================================
// Registry Events
// ============================================

export type RegistryEvent =
  | { type: 'component-registered'; componentName: string; timestamp: number }
  | { type: 'component-unregistered'; componentName: string; timestamp: number }
  | {
      type: 'instance-created';
      instanceId: string;
      componentName: string;
      timestamp: number;
    }
  | {
      type: 'instance-updated';
      instanceId: string;
      componentName: string;
      timestamp: number;
    }
  | {
      type: 'instance-completed';
      instanceId: string;
      componentName: string;
      timestamp: number;
    }
  | {
      type: 'instance-error';
      instanceId: string;
      componentName: string;
      error: Error;
      timestamp: number;
    };

// ============================================
// Singleton Instance
// ============================================

let registryInstance: ComponentRegistry | null = null;

/**
 * Get the singleton component registry
 */
export function getComponentRegistry(
  config?: RegistryConfig
): ComponentRegistry {
  if (!registryInstance) {
    registryInstance = new ComponentRegistry(config);
  }
  return registryInstance;
}

/**
 * Reset the singleton registry
 */
export function resetComponentRegistry(): void {
  registryInstance?.reset();
  registryInstance = null;
}

// ============================================
// Default VS Code Components
// ============================================

/**
 * Default loading state component schema
 */
export const loadingStateSchema = z.object({
  componentName: z.string().describe('Name of the component being loaded'),
  progress: z.number().min(0).max(100).optional().describe('Loading progress percentage'),
  message: z.string().optional().describe('Loading status message'),
});

/**
 * Error fallback component schema
 */
export const errorFallbackSchema = z.object({
  componentName: z.string().describe('Name of the component that errored'),
  errorMessage: z.string().describe('Error message to display'),
  canRetry: z.boolean().optional().describe('Whether retry is possible'),
});

export type LoadingStateSchemaType = z.infer<typeof loadingStateSchema>;
export type ErrorFallbackSchemaType = z.infer<typeof errorFallbackSchema>;
