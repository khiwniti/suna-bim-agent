/**
 * In-memory panel state store
 *
 * Provides temporary storage for panel states until database persistence is implemented.
 * States are keyed by userId:panelId for user isolation.
 */

export interface PanelStateEntry {
  state: Record<string, unknown>;
  savedAt: number;
  projectId?: string;
}

const panelStates = new Map<string, PanelStateEntry>();

/**
 * Save panel state to in-memory store
 */
export function savePanelState(
  userId: string,
  panelId: string,
  state: Record<string, unknown>,
  projectId?: string
): PanelStateEntry {
  const key = `${userId}:${panelId}`;
  const entry: PanelStateEntry = { state, savedAt: Date.now(), projectId };
  panelStates.set(key, entry);
  return entry;
}

/**
 * Get panel state from in-memory store
 */
export function getPanelState(
  userId: string,
  panelId: string
): PanelStateEntry | null {
  const key = `${userId}:${panelId}`;
  return panelStates.get(key) || null;
}

/**
 * Clear panel state from in-memory store
 */
export function clearPanelState(userId: string, panelId: string): boolean {
  const key = `${userId}:${panelId}`;
  return panelStates.delete(key);
}

/**
 * Clear all panel states for a user (useful for logout)
 */
export function clearUserPanelStates(userId: string): number {
  let cleared = 0;
  for (const key of panelStates.keys()) {
    if (key.startsWith(`${userId}:`)) {
      panelStates.delete(key);
      cleared++;
    }
  }
  return cleared;
}

/**
 * For testing: clear all stored states
 */
export function clearAllPanelStates(): void {
  panelStates.clear();
}
