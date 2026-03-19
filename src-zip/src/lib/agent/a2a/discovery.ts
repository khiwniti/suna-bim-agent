/**
 * A2A Discovery - Agent Discovery and Capability Announcement
 *
 * Provides functionality for agents to:
 * - Register their presence and capabilities
 * - Discover other available agents
 * - Query agents by capability
 * - Track agent health and status
 *
 * Features:
 * - Tenant isolation for multi-tenant support
 * - Status tracking (available, busy, offline, error)
 * - Health check and staleness detection
 */


// ============================================
// Types
// ============================================

/**
 * Agent status values
 */
export type AgentStatus = 'available' | 'busy' | 'offline' | 'error';

/**
 * Agent registration record
 */
export interface AgentRegistration {
  /** Unique agent instance identifier */
  agentId: string;

  /** Type of agent (e.g., 'sustainability', 'spatial') */
  agentType: string;

  /** Tenant this agent belongs to */
  tenantId: string;

  /** List of capabilities this agent provides */
  capabilities: string[];

  /** Current agent status */
  status: AgentStatus;

  /** Additional metadata */
  metadata?: Record<string, unknown>;

  /** Last time agent announced itself (set automatically) */
  lastSeen?: number;

  /** Timestamp of last status change */
  statusChangedAt?: number;
}

/**
 * Query options for agent discovery
 */
export interface DiscoverAgentsOptions {
  /** Filter by tenant ID (required) */
  tenantId: string;

  /** Filter by agent type */
  agentType?: string;

  /** Filter by status */
  status?: AgentStatus;

  /** Filter by capability */
  capability?: string;
}

// ============================================
// Agent Registry
// ============================================

/**
 * Agent Registry interface
 *
 * Manages the collection of registered agents and provides
 * query capabilities for agent discovery.
 */
export interface AgentRegistry {
  /** Register a new agent or update existing registration */
  register(registration: AgentRegistration): void;

  /** Remove an agent from the registry */
  unregister(agentId: string): void;

  /** Get a specific agent by ID */
  getAgent(agentId: string): AgentRegistration | null;

  /** Get all agents for a tenant */
  getAgentsByTenant(tenantId: string): AgentRegistration[];

  /** Get total number of registered agents */
  getAgentCount(): number;

  /** Update agent status */
  updateStatus(agentId: string, status: AgentStatus): void;

  /** Mark stale agents as offline */
  pruneStaleAgents(staleThresholdMs: number): void;
}

/**
 * Creates a new agent registry
 *
 * The registry is an in-memory store for agent registrations.
 * In production, this could be backed by Redis or a database.
 */
export function createAgentRegistry(): AgentRegistry {
  const agents = new Map<string, AgentRegistration>();

  return {
    register(registration: AgentRegistration): void {
      const existing = agents.get(registration.agentId);
      const now = Date.now();

      agents.set(registration.agentId, {
        ...registration,
        lastSeen: now,
        statusChangedAt: existing?.status !== registration.status ? now : existing?.statusChangedAt,
      });
    },

    unregister(agentId: string): void {
      agents.delete(agentId);
    },

    getAgent(agentId: string): AgentRegistration | null {
      return agents.get(agentId) ?? null;
    },

    getAgentsByTenant(tenantId: string): AgentRegistration[] {
      const results: AgentRegistration[] = [];

      for (const agent of agents.values()) {
        if (agent.tenantId === tenantId) {
          results.push(agent);
        }
      }

      return results;
    },

    getAgentCount(): number {
      return agents.size;
    },

    updateStatus(agentId: string, status: AgentStatus): void {
      const agent = agents.get(agentId);

      if (agent) {
        agent.status = status;
        agent.statusChangedAt = Date.now();
      }
    },

    pruneStaleAgents(staleThresholdMs: number): void {
      const now = Date.now();

      for (const agent of agents.values()) {
        if (agent.lastSeen && now - agent.lastSeen > staleThresholdMs) {
          if (agent.status !== 'offline') {
            agent.status = 'offline';
            agent.statusChangedAt = now;
          }
        }
      }
    },
  };
}

// ============================================
// Discovery Functions
// ============================================

/**
 * Discover agents based on filter criteria
 *
 * @param registry - Agent registry to search
 * @param options - Filter options
 * @returns List of matching agents
 */
export function discoverAgents(
  registry: AgentRegistry,
  options: DiscoverAgentsOptions
): AgentRegistration[] {
  let agents = registry.getAgentsByTenant(options.tenantId);

  // Filter by agent type
  if (options.agentType) {
    agents = agents.filter((a) => a.agentType === options.agentType);
  }

  // Filter by status
  if (options.status) {
    agents = agents.filter((a) => a.status === options.status);
  }

  // Filter by capability
  if (options.capability) {
    agents = agents.filter((a) => a.capabilities.includes(options.capability!));
  }

  return agents;
}

/**
 * Announce agent capabilities (register or update)
 *
 * @param registry - Agent registry
 * @param registration - Agent registration data
 */
export function announceCapabilities(
  registry: AgentRegistry,
  registration: AgentRegistration
): void {
  registry.register(registration);
}

/**
 * Get capabilities of a specific agent
 *
 * @param registry - Agent registry
 * @param agentId - Agent identifier
 * @returns List of capabilities or empty array
 */
export function getAgentCapabilities(registry: AgentRegistry, agentId: string): string[] {
  const agent = registry.getAgent(agentId);
  return agent?.capabilities ?? [];
}

/**
 * Find all agents that have a specific capability
 *
 * @param registry - Agent registry
 * @param tenantId - Tenant to search within
 * @param capability - Capability to search for
 * @returns List of agents with the capability
 */
export function findAgentsByCapability(
  registry: AgentRegistry,
  tenantId: string,
  capability: string
): AgentRegistration[] {
  return discoverAgents(registry, {
    tenantId,
    capability,
  });
}

/**
 * Find the best available agent for a capability
 *
 * Prefers agents that are:
 * 1. Available (not busy)
 * 2. Recently seen (healthy)
 * 3. Have the required capability
 *
 * @param registry - Agent registry
 * @param tenantId - Tenant to search within
 * @param capability - Required capability
 * @returns Best matching agent or null
 */
export function findBestAgentForCapability(
  registry: AgentRegistry,
  tenantId: string,
  capability: string
): AgentRegistration | null {
  const agents = discoverAgents(registry, {
    tenantId,
    capability,
    status: 'available',
  });

  if (agents.length === 0) {
    return null;
  }

  // Sort by lastSeen (most recent first)
  agents.sort((a, b) => (b.lastSeen ?? 0) - (a.lastSeen ?? 0));

  return agents[0];
}

/**
 * Check if an agent is available for work
 *
 * @param registry - Agent registry
 * @param agentId - Agent identifier
 * @returns True if agent exists and is available
 */
export function isAgentAvailable(registry: AgentRegistry, agentId: string): boolean {
  const agent = registry.getAgent(agentId);
  return agent?.status === 'available';
}

/**
 * Mark an agent as busy
 *
 * @param registry - Agent registry
 * @param agentId - Agent identifier
 */
export function markAgentBusy(registry: AgentRegistry, agentId: string): void {
  registry.updateStatus(agentId, 'busy');
}

/**
 * Mark an agent as available
 *
 * @param registry - Agent registry
 * @param agentId - Agent identifier
 */
export function markAgentAvailable(registry: AgentRegistry, agentId: string): void {
  registry.updateStatus(agentId, 'available');
}

// ============================================
// Health Check Utilities
// ============================================

/**
 * Get health summary for all agents in a tenant
 *
 * @param registry - Agent registry
 * @param tenantId - Tenant identifier
 * @returns Health summary statistics
 */
export function getAgentHealthSummary(
  registry: AgentRegistry,
  tenantId: string
): {
  total: number;
  available: number;
  busy: number;
  offline: number;
  error: number;
} {
  const agents = registry.getAgentsByTenant(tenantId);

  return {
    total: agents.length,
    available: agents.filter((a) => a.status === 'available').length,
    busy: agents.filter((a) => a.status === 'busy').length,
    offline: agents.filter((a) => a.status === 'offline').length,
    error: agents.filter((a) => a.status === 'error').length,
  };
}

/**
 * Get list of agents that haven't reported recently
 *
 * @param registry - Agent registry
 * @param tenantId - Tenant identifier
 * @param thresholdMs - Staleness threshold in milliseconds
 * @returns List of stale agents
 */
export function getStaleAgents(
  registry: AgentRegistry,
  tenantId: string,
  thresholdMs: number
): AgentRegistration[] {
  const agents = registry.getAgentsByTenant(tenantId);
  const now = Date.now();

  return agents.filter((a) => a.lastSeen && now - a.lastSeen > thresholdMs);
}
