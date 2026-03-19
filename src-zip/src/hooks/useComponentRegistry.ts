/**
 * useComponentRegistry Hook
 *
 * React hook that subscribes to ComponentRegistry changes and provides
 * helpers for component lookup and filtering. Re-renders when components
 * are added or removed from the registry.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  componentRegistry,
  type ComponentInstance,
} from '@/lib/generative-ui/registry';

/**
 * Return type for the useComponentRegistry hook
 */
export interface UseComponentRegistryReturn {
  /** Current list of all registered component instances */
  components: ComponentInstance[];
  /** Get a specific component instance by ID */
  getComponent: (id: string) => ComponentInstance | undefined;
  /** Get all component instances of a specific type */
  getComponentsByType: (type: string) => ComponentInstance[];
}

/**
 * Hook that subscribes to ComponentRegistry changes and provides
 * reactive access to registered component instances.
 *
 * @returns Object with components array and helper methods
 *
 * @example
 * ```tsx
 * function ComponentList() {
 *   const { components, getComponent, getComponentsByType } = useComponentRegistry();
 *
 *   // Get all carbon analysis components
 *   const carbonComponents = getComponentsByType('bim.CarbonResult');
 *
 *   // Get a specific component
 *   const myComponent = getComponent('component-123');
 *
 *   return (
 *     <div>
 *       <p>Total components: {components.length}</p>
 *       <p>Carbon components: {carbonComponents.length}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useComponentRegistry(): UseComponentRegistryReturn {
  // State to track current components - triggers re-render on change
  const [components, setComponents] = useState<ComponentInstance[]>(() =>
    componentRegistry.getActiveComponents()
  );

  // Subscribe to registry changes
  useEffect(() => {
    // Track if component is mounted to prevent state updates after unmount
    let isMounted = true;

    // Update state when registry changes
    const unsubscribe = componentRegistry.onChange((instances) => {
      if (isMounted) {
        setComponents(instances);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Memoized helper to get a component by ID
  const getComponent = useCallback(
    (id: string): ComponentInstance | undefined => {
      return componentRegistry.getComponent(id);
    },
    []
  );

  // Memoized helper to get components by type
  const getComponentsByType = useCallback(
    (type: string): ComponentInstance[] => {
      return componentRegistry.getComponentsByType(type);
    },
    []
  );

  // Return stable object structure
  return useMemo(
    () => ({
      components,
      getComponent,
      getComponentsByType,
    }),
    [components, getComponent, getComponentsByType]
  );
}
