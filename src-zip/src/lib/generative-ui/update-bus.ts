/**
 * ComponentUpdateBus - Event bus for targeted component prop updates
 *
 * Enables streaming updates to specific UI components by ID,
 * supporting partial updates, replacements, and removals.
 */

export type UpdateAction = 'update' | 'remove' | 'replace';

export interface ComponentUpdate {
  componentId: string;
  updates: Record<string, unknown>;
  action: UpdateAction;
}

export type UpdateCallback = (update: ComponentUpdate) => void;

/**
 * Event bus for managing targeted component updates.
 *
 * Components subscribe by their ID and receive updates when
 * emit() is called with their componentId. Supports:
 * - 'update': Partial prop updates (merge with existing)
 * - 'replace': Full prop replacement
 * - 'remove': Component should be removed from UI
 */
export class ComponentUpdateBus {
  private subscribers: Map<string, Set<UpdateCallback>> = new Map();

  /**
   * Subscribe to updates for a specific component ID.
   *
   * @param componentId - The unique identifier of the component to subscribe to
   * @param callback - Function called when updates are emitted for this componentId
   * @returns Unsubscribe function to stop receiving updates
   */
  subscribe(componentId: string, callback: UpdateCallback): () => void {
    if (!this.subscribers.has(componentId)) {
      this.subscribers.set(componentId, new Set());
    }

    const callbacks = this.subscribers.get(componentId)!;
    callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      callbacks.delete(callback);
      // Clean up empty sets
      if (callbacks.size === 0) {
        this.subscribers.delete(componentId);
      }
    };
  }

  /**
   * Emit an update to all subscribers of a specific component ID.
   *
   * @param componentId - The unique identifier of the component to update
   * @param updates - The prop updates to apply
   * @param action - The type of update: 'update' (default), 'remove', or 'replace'
   */
  emit(
    componentId: string,
    updates: Record<string, unknown>,
    action: UpdateAction = 'update'
  ): void {
    const callbacks = this.subscribers.get(componentId);
    if (!callbacks) return;

    const update: ComponentUpdate = {
      componentId,
      updates,
      action,
    };

    // Notify all subscribers for this componentId
    for (const callback of callbacks) {
      callback(update);
    }
  }

  /**
   * Remove all subscriptions from the bus.
   * Useful for cleanup during unmount or reset scenarios.
   */
  clear(): void {
    this.subscribers.clear();
  }
}

// Export singleton instance for application-wide use
export const componentUpdateBus = new ComponentUpdateBus();
