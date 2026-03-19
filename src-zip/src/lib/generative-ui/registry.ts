/**
 * ComponentRegistry - Registry for tracking mounted generative UI component instances
 *
 * Maintains a centralized registry of all active UI component instances,
 * enabling instance lookup, type-based queries, and change notifications.
 */

export interface ComponentInstance {
  id: string;
  type: string;
  props: Record<string, unknown>;
  mountedAt: number;
}

export type RegistryChangeCallback = (instances: ComponentInstance[]) => void;

/**
 * Registry for tracking mounted generative UI component instances.
 *
 * Components register when mounted and unregister when unmounted,
 * enabling centralized instance tracking and management.
 */
export class ComponentRegistry {
  private instances: Map<string, ComponentInstance> = new Map();
  private listeners: Set<RegistryChangeCallback> = new Set();

  /**
   * Register a component instance with the registry.
   *
   * @param id - Unique identifier for the component instance
   * @param type - Component type (e.g., "bim.CarbonResult")
   * @param props - Current props of the component
   */
  register(id: string, type: string, props: Record<string, unknown>): void {
    const instance: ComponentInstance = {
      id,
      type,
      props,
      mountedAt: Date.now(),
    };

    this.instances.set(id, instance);
    this.notifyListeners();
  }

  /**
   * Unregister a component instance from the registry.
   *
   * @param id - Unique identifier of the component to unregister
   */
  unregister(id: string): void {
    const existed = this.instances.delete(id);
    if (existed) {
      this.notifyListeners();
    }
  }

  /**
   * Get a specific component instance by ID.
   *
   * @param id - Unique identifier of the component
   * @returns The component instance or undefined if not found
   */
  getComponent(id: string): ComponentInstance | undefined {
    return this.instances.get(id);
  }

  /**
   * Get all currently registered component instances.
   *
   * @returns Array of all active component instances (copy)
   */
  getActiveComponents(): ComponentInstance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get all component instances of a specific type.
   *
   * @param type - Component type to filter by (e.g., "bim.CarbonResult")
   * @returns Array of matching component instances (copy)
   */
  getComponentsByType(type: string): ComponentInstance[] {
    return Array.from(this.instances.values()).filter(
      (instance) => instance.type === type
    );
  }

  /**
   * Remove all registered components from the registry.
   */
  clear(): void {
    const hadInstances = this.instances.size > 0;
    this.instances.clear();
    if (hadInstances) {
      this.notifyListeners();
    }
  }

  /**
   * Subscribe to registry changes (register/unregister events).
   *
   * @param callback - Function called with current instances when registry changes
   * @returns Unsubscribe function
   */
  onChange(callback: RegistryChangeCallback): () => void {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of the current registry state.
   */
  private notifyListeners(): void {
    const instances = this.getActiveComponents();
    for (const listener of this.listeners) {
      listener(instances);
    }
  }
}

// Export singleton instance for application-wide use
export const componentRegistry = new ComponentRegistry();
