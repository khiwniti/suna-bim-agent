/**
 * withInteractable HOC - Makes components subscribable to AI-driven updates
 *
 * Wraps any component to make it:
 * 1. Subscribable to prop updates via ComponentUpdateBus
 * 2. Registered in ComponentRegistry for AI targeting
 * 3. Auto-unsubscribe and unregister on unmount
 *
 * @example
 * ```tsx
 * const InteractableCard = withInteractable<CardProps>(Card, 'bim.CarbonResult');
 *
 * // In component tree:
 * <InteractableCard
 *   componentId="carbon-1"
 *   initialProps={{ totalCarbon: 0, unit: 'kgCO2e' }}
 *   onPropsUpdate={(newProps) => console.log('Updated:', newProps)}
 * />
 * ```
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  componentUpdateBus,
  ComponentUpdateBus,
  type ComponentUpdate,
} from './update-bus';
import { componentRegistry, ComponentRegistry } from './registry';

/**
 * Props accepted by the interactable wrapper component
 */
export interface InteractableProps<T> {
  /** Unique identifier for this component instance (used for AI targeting) */
  componentId: string;
  /** Initial props to render the component with */
  initialProps: T;
  /** Callback when props are updated via the bus */
  onPropsUpdate?: (newProps: T) => void;
  /** Callback when component receives remove action */
  onRemove?: () => void;
}

/**
 * Options for configuring withInteractable HOC
 * Primarily used for testing with custom bus/registry instances
 */
export interface WithInteractableOptions {
  /** Custom ComponentUpdateBus instance (defaults to singleton) */
  bus?: ComponentUpdateBus;
  /** Custom ComponentRegistry instance (defaults to singleton) */
  registry?: ComponentRegistry;
}

/**
 * Higher-Order Component that makes any component subscribable to AI-driven updates.
 *
 * The wrapped component will:
 * - Register itself in ComponentRegistry on mount
 * - Subscribe to ComponentUpdateBus for prop updates
 * - Handle 'update' (merge), 'replace' (full swap), and 'remove' actions
 * - Automatically cleanup on unmount
 *
 * @param WrappedComponent - The React component to wrap
 * @param componentType - Type identifier for the component (e.g., 'bim.CarbonResult')
 * @param options - Optional configuration for custom bus/registry instances
 * @returns A new component accepting InteractableProps
 */
export function withInteractable<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentType: string,
  options?: WithInteractableOptions
): React.FC<InteractableProps<T>> {
  const bus = options?.bus ?? componentUpdateBus;
  const registry = options?.registry ?? componentRegistry;

  const InteractableComponent: React.FC<InteractableProps<T>> = ({
    componentId,
    initialProps,
    onPropsUpdate,
    onRemove,
  }) => {
    // Internal state holding current props
    const [currentProps, setCurrentProps] = useState<T>(initialProps);

    // Memoize the update handler to prevent unnecessary re-subscriptions
    const handleUpdate = useCallback(
      (update: ComponentUpdate) => {
        setCurrentProps((prevProps) => {
          let newProps: T;

          switch (update.action) {
            case 'update':
              // Merge new props with existing
              newProps = { ...prevProps, ...update.updates } as T;
              break;

            case 'replace':
              // Replace all props with new ones
              newProps = update.updates as T;
              break;

            case 'remove':
              // Trigger remove callback, don't change props
              onRemove?.();
              return prevProps;

            default:
              return prevProps;
          }

          // Notify callback of prop changes
          onPropsUpdate?.(newProps);

          // Update registry with new props
          registry.register(componentId, componentType, newProps as Record<string, unknown>);

          return newProps;
        });
      },
      [componentId, onPropsUpdate, onRemove]
    );

    // Register component and subscribe to updates on mount
    useEffect(() => {
      // Register with registry
      registry.register(componentId, componentType, initialProps as Record<string, unknown>);

      // Subscribe to bus updates
      const unsubscribe = bus.subscribe(componentId, handleUpdate);

      // Cleanup on unmount
      return () => {
        unsubscribe();
        registry.unregister(componentId);
      };
    }, [componentId, handleUpdate, initialProps]);

    // Render the wrapped component with current props
    return <WrappedComponent {...currentProps} />;
  };

  // Set display name for debugging
  const wrappedName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  InteractableComponent.displayName = `withInteractable(${wrappedName})`;

  return InteractableComponent;
}

/**
 * Hook for creating an interactable component instance programmatically.
 * Alternative to the HOC pattern for simpler use cases.
 *
 * @param componentId - Unique identifier for the component
 * @param componentType - Type identifier (e.g., 'bim.CarbonResult')
 * @param initialProps - Initial prop values
 * @param options - Optional callbacks and configuration
 * @returns Current props and update state
 */
export function useInteractable<T extends object>(
  componentId: string,
  componentType: string,
  initialProps: T,
  options?: {
    onPropsUpdate?: (newProps: T) => void;
    onRemove?: () => void;
    bus?: ComponentUpdateBus;
    registry?: ComponentRegistry;
  }
): {
  props: T;
  isRemoved: boolean;
} {
  const bus = options?.bus ?? componentUpdateBus;
  const registry = options?.registry ?? componentRegistry;

  const [props, setProps] = useState<T>(initialProps);
  const [isRemoved, setIsRemoved] = useState(false);

  // Use refs for stable callback references to avoid re-subscribing
  const onPropsUpdateRef = useRef(options?.onPropsUpdate);
  const onRemoveRef = useRef(options?.onRemove);

  // Keep refs in sync
  useEffect(() => {
    onPropsUpdateRef.current = options?.onPropsUpdate;
    onRemoveRef.current = options?.onRemove;
  });

  useEffect(() => {
    // Register with registry
    registry.register(componentId, componentType, initialProps as Record<string, unknown>);

    // Subscribe to updates
    const unsubscribe = bus.subscribe(componentId, (update) => {
      switch (update.action) {
        case 'update':
          setProps((prev) => {
            const newProps = { ...prev, ...update.updates } as T;
            onPropsUpdateRef.current?.(newProps);
            registry.register(componentId, componentType, newProps as Record<string, unknown>);
            return newProps;
          });
          break;

        case 'replace': {
          const newProps = update.updates as T;
          setProps(newProps);
          onPropsUpdateRef.current?.(newProps);
          registry.register(componentId, componentType, newProps as Record<string, unknown>);
          break;
        }

        case 'remove':
          setIsRemoved(true);
          onRemoveRef.current?.();
          break;
      }
    });

    return () => {
      unsubscribe();
      registry.unregister(componentId);
    };
  }, [componentId, componentType, bus, registry, initialProps]);

  return { props, isRemoved };
}
