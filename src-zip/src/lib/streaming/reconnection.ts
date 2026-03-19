/**
 * Reconnection Manager for AI Streaming System
 *
 * Handles network reconnection with exponential backoff and optional jitter.
 * Used by the streaming transport layer to manage connection recovery.
 */

// ============================================================================
// Types and Configuration
// ============================================================================

/**
 * Configuration for reconnection behavior
 */
export interface ReconnectionConfig {
  /** Maximum number of reconnection attempts before giving up */
  maxAttempts: number;
  /** Array of backoff delays in milliseconds for each attempt */
  backoffMs: number[];
  /** Whether to add random jitter (±20%) to backoff delays */
  jitter?: boolean;
}

/**
 * Default reconnection configuration matching transport spec
 */
export const DEFAULT_RECONNECTION_CONFIG: ReconnectionConfig = {
  maxAttempts: 5,
  backoffMs: [1000, 2000, 4000, 8000, 16000],
  jitter: false,
};

// ============================================================================
// ReconnectionManager Class
// ============================================================================

/**
 * Manages reconnection logic with exponential backoff
 *
 * @example
 * ```typescript
 * const manager = new ReconnectionManager();
 *
 * function attemptReconnect() {
 *   if (manager.isMaxAttemptsReached()) {
 *     console.log('Max attempts reached, giving up');
 *     return;
 *   }
 *   manager.scheduleReconnect(() => {
 *     connection.connect().catch(() => attemptReconnect());
 *   });
 * }
 * ```
 */
export class ReconnectionManager {
  private config: ReconnectionConfig;
  private attemptCount: number = 0;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  /**
   * Create a new ReconnectionManager
   * @param config - Optional configuration (defaults to DEFAULT_RECONNECTION_CONFIG)
   */
  constructor(config: ReconnectionConfig = DEFAULT_RECONNECTION_CONFIG) {
    this.config = config;
  }

  /**
   * Get the current number of reconnection attempts
   */
  getAttemptCount(): number {
    return this.attemptCount;
  }

  /**
   * Check if maximum reconnection attempts have been reached
   */
  isMaxAttemptsReached(): boolean {
    return this.attemptCount >= this.config.maxAttempts;
  }

  /**
   * Get the next backoff delay in milliseconds
   *
   * Returns the backoff time for the current attempt index.
   * If jitter is enabled, adds ±20% randomness to the delay.
   * If attempts exceed the backoffMs array length, uses the last value.
   */
  getNextBackoffMs(): number {
    const { backoffMs, jitter } = this.config;

    // Handle empty array edge case
    if (backoffMs.length === 0) {
      return 0;
    }

    // Get the base backoff (use last value if attempts exceed array length)
    const index = Math.min(this.attemptCount, backoffMs.length - 1);
    const baseBackoff = backoffMs[index];

    // Apply jitter if enabled (±20% randomness)
    if (jitter) {
      const jitterFactor = 0.2;
      const minBackoff = baseBackoff * (1 - jitterFactor);
      const maxBackoff = baseBackoff * (1 + jitterFactor);
      return Math.floor(minBackoff + Math.random() * (maxBackoff - minBackoff));
    }

    return baseBackoff;
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   *
   * If max attempts have been reached, the callback will not be scheduled.
   * If a previous reconnection is pending, it will be cancelled.
   *
   * @param callback - Function to call after the backoff delay
   */
  scheduleReconnect(callback: () => void): void {
    // Cancel any pending reconnection
    this.cancelTimer();

    // Don't schedule if max attempts reached
    if (this.isMaxAttemptsReached()) {
      return;
    }

    // Get backoff delay for current attempt
    const backoffMs = this.getNextBackoffMs();

    // Increment attempt count
    this.attemptCount++;

    // Schedule the reconnection
    this.timeoutId = setTimeout(callback, backoffMs);
  }

  /**
   * Cancel any pending reconnection attempt
   *
   * Safe to call multiple times.
   */
  cancel(): void {
    this.cancelTimer();
  }

  /**
   * Reset the reconnection state
   *
   * Clears the attempt counter and cancels any pending reconnection.
   * Call this after a successful connection.
   */
  reset(): void {
    this.cancelTimer();
    this.attemptCount = 0;
  }

  /**
   * Internal helper to cancel the timeout
   */
  private cancelTimer(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
