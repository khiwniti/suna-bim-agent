/**
 * Tenant Context
 *
 * Provides tenant information throughout the app for tenant-scoped routes.
 */

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { Tenant } from '@prisma/client';

interface TenantContextValue {
  tenant: Tenant;
  isLoaded: boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
  tenant: Tenant;
  children: ReactNode;
}

export function TenantProvider({ tenant, children }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={{ tenant, isLoaded: true }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext);

  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }

  return context;
}

export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext);
}
