'use client';

/**
 * Tambo Providers
 *
 * Wraps the app with TamboProvider, configuring:
 * - Components (generative UI)
 * - Tools (AI-callable functions)
 * - Context helpers (ambient state)
 * - MCP servers (external tool integration)
 * - Resources (@-mentionable documentation)
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TamboProvider, MCPTransport } from '@tambo-ai/react';
import type { ListResourceItem } from '@tambo-ai/react';
import { tamboComponents } from '@/lib/tambo/components';
import { tamboTools } from '@/lib/tambo/tools';
import { tamboContextHelpers } from '@/lib/tambo/context-helpers';
import { useTamboContextState, syncContextState } from '@/lib/tambo/context-state';
import { useBIMContextSync } from '@/hooks/useBIMContextSync';

const STORAGE_KEY = 'tambo-user-key';

/**
 * Get or create a persistent anonymous user key for Tambo thread ownership.
 * Pure function - no side effects during initial call, only localStorage access.
 * In production, this should come from your auth system.
 */
function getOrCreateUserKey(): string {
  if (typeof window === 'undefined') {
    return 'anonymous-ssr';
  }

  let userKey = localStorage.getItem(STORAGE_KEY);
  if (!userKey) {
    userKey = `anon-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    localStorage.setItem(STORAGE_KEY, userKey);
  }
  return userKey;
}

/**
 * Hook to sync context state for non-hook context helpers.
 */
function TamboContextSync() {
  const state = useTamboContextState();

  useEffect(() => {
    syncContextState(state);
  }, [state]);

  return null;
}

/**
 * Syncs BIM store state (selection, model) to Tambo context.
 * Must be inside TamboProvider to access Tambo state.
 */
function TamboBIMContextSync() {
  useBIMContextSync();
  return null;
}

// ============================================
// MCP Server Configuration
// ============================================

/**
 * MCP servers for external tool integration.
 * Tambo MCP provides additional AI capabilities.
 */
const mcpServers = [
  {
    url: 'https://mcp.tambo.co/mcp',
    serverKey: 'tambo',
    transport: MCPTransport.HTTP,
  },
];

// ============================================
// Local Resources (@-mentionable)
// ============================================

/**
 * Static resources users can @-mention in chat.
 * These provide documentation context to the AI.
 */
const staticResources: ListResourceItem[] = [
  {
    uri: 'docs://carbon-analysis',
    name: 'Carbon Analysis Guide',
    mimeType: 'text/plain',
  },
  {
    uri: 'docs://clash-detection',
    name: 'Clash Detection Guide',
    mimeType: 'text/plain',
  },
  {
    uri: 'docs://boq-export',
    name: 'BOQ Export Guide',
    mimeType: 'text/plain',
  },
  {
    uri: 'docs://ifc-elements',
    name: 'IFC Element Types Reference',
    mimeType: 'text/plain',
  },
  {
    uri: 'docs://thai-standards',
    name: 'Thai Building Standards (TGO/TREES)',
    mimeType: 'text/plain',
  },
];

/**
 * Resource content provider for @-mentioned resources.
 */
const resourceContents: Record<string, string> = {
  'docs://carbon-analysis': `
# Carbon Analysis Guide

CarbonBIM analyzes embodied carbon in BIM models using Thai emission factors (TGO 2023).

## Supported Categories
- **Materials**: Concrete, steel, timber, glass, aluminum
- **Construction**: Assembly, equipment usage
- **Transport**: Material delivery distances

## How to Use
1. Load an IFC model
2. Ask "Analyze carbon footprint" or click the Carbon Analysis tool
3. Review the breakdown by material and category
4. Check hotspots for highest-impact elements
5. Follow recommendations for reduction strategies

## Thai Standards
- TGO (Thailand Greenhouse Gas Organization) emission factors
- TREES certification requirements for green buildings
  `,
  'docs://clash-detection': `
# Clash Detection Guide

Detect geometric clashes between BIM elements across disciplines.

## Clash Types
- **Hard Clash**: Physical intersection (elements occupy same space)
- **Soft Clash**: Clearance violation (insufficient spacing)
- **Workflow Clash**: Scheduling or sequencing conflicts

## Severity Levels
- **Critical**: Must resolve before construction
- **High**: Should resolve before MEP installation
- **Medium**: Should resolve before coordination sign-off
- **Low**: Minor issues, resolve at discretion

## How to Use
1. Load an IFC model with multiple disciplines
2. Ask "Check for clashes" or "Detect clashes between MEP and Structure"
3. Review clash list sorted by severity
4. Click on a clash to zoom to location
5. Export clash report for coordination meetings
  `,
  'docs://boq-export': `
# BOQ Export Guide

Generate Bill of Quantities from BIM model data.

## Supported Exports
- Excel (.xlsx) with categorized items
- PDF summary report
- CSV for database import

## Categories
- Structural elements (columns, beams, slabs, foundations)
- Architectural elements (walls, doors, windows, finishes)
- MEP elements (ducts, pipes, equipment)

## Pricing
- Manual cost input per item
- Database lookup for common materials (Thai market)
- Custom material databases supported

## How to Use
1. Load an IFC model
2. Ask "Generate BOQ" or "Export quantities"
3. Select categories to include
4. Choose export format
5. Download and share with contractors
  `,
  'docs://ifc-elements': `
# IFC Element Types Reference

Common IFC entity types found in BIM models.

## Structural
- IfcColumn, IfcBeam, IfcSlab, IfcFooting
- IfcWall, IfcCurtainWall, IfcRoof

## Architectural  
- IfcDoor, IfcWindow, IfcStair, IfcRamp
- IfcSpace, IfcZone, IfcBuildingStorey

## MEP
- IfcDuctSegment, IfcPipeSegment, IfcCableSegment
- IfcFlowTerminal, IfcEnergyConversionDevice
- IfcDistributionPort, IfcDistributionSystem

## Properties
- Pset_*Common: Standard property sets
- BaseQuantities: Area, volume, length
- Custom property sets per project
  `,
  'docs://thai-standards': `
# Thai Building Standards

Reference for Thai construction and sustainability standards.

## TGO (Thailand Greenhouse Gas Organization)
- National emission factors for construction materials
- Carbon accounting methodology for buildings
- Annual updates based on Thai electricity grid

## TREES (Thai Rating of Energy and Environmental Sustainability)
- Thai green building certification
- Categories: Site, Water, Energy, Materials, Indoor Environment
- Levels: Certified, Silver, Gold, Platinum

## Building Codes
- พ.ร.บ. ควบคุมอาคาร (Building Control Act)
- กฎกระทรวง (Ministerial Regulations)
- มาตรฐาน วสท. (EIT Standards)

## Accessibility
- กฎกระทรวงการออกแบบเพื่อคนพิการ
- Ramp slopes, door widths, accessible routes
  `,
};

interface TamboProvidersProps {
  children: React.ReactNode;
}

export function TamboProviders({ children }: TamboProvidersProps) {
  const apiKey = process.env.NEXT_PUBLIC_TAMBO_API_KEY;
  // Self-hosted Tambo API URL (optional - defaults to Tambo Cloud)
  // For self-hosted: set NEXT_PUBLIC_TAMBO_API_URL=http://localhost:8261
  const tamboUrl = process.env.NEXT_PUBLIC_TAMBO_API_URL;
  // Use lazy initialization to compute userKey only once
  const [userKey] = useState(getOrCreateUserKey);
  const hasLoggedToolsRef = useRef(false);

  // Log tools being registered only once on mount
  useEffect(() => {
    if (!hasLoggedToolsRef.current && apiKey) {
      console.log('[TamboProviders] Registering tools:', tamboTools.map(t => ({
        name: t.name,
        description: t.description.substring(0, 50) + '...',
        hasInputSchema: !!t.inputSchema,
        hasOutputSchema: !!t.outputSchema,
        hasToolFn: typeof t.tool === 'function',
      })));
      console.log('[TamboProviders] MCP servers configured:', mcpServers.map(s => s.serverKey));
      console.log('[TamboProviders] Resources available:', staticResources.map(r => r.name));
      if (tamboUrl) {
        console.log('[TamboProviders] Using self-hosted Tambo API:', tamboUrl);
      }
      hasLoggedToolsRef.current = true;
    }
  }, [apiKey, tamboUrl]);

  // Resource list provider - returns array of resources directly
  const listResources = useCallback(async (_search?: string) => {
    return staticResources;
  }, []);

  // Resource content provider
  const getResource = useCallback(async (uri: string) => {
    const content = resourceContents[uri];
    if (!content) {
      return { contents: [{ uri, mimeType: 'text/plain', text: `Resource not found: ${uri}` }] };
    }
    return { contents: [{ uri, mimeType: 'text/plain', text: content }] };
  }, []);

  // If no API key, render children without Tambo (for local dev)
  if (!apiKey) {
    console.warn('[Tambo] No API key found. Running without Tambo integration.');
    return <>{children}</>;
  }

  return (
    <TamboProvider
      apiKey={apiKey}
      userKey={userKey}
      tamboUrl={tamboUrl}
      components={tamboComponents}
      tools={tamboTools}
      contextHelpers={tamboContextHelpers}
      mcpServers={mcpServers}
      listResources={listResources}
      getResource={getResource}
    >
      <TamboContextSync />
      <TamboBIMContextSync />
      {children}
    </TamboProvider>
  );
}
