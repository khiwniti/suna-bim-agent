/**
 * Tenant Layout
 *
 * Layout for tenant-scoped routes. Resolves tenant from URL parameter
 * and provides tenant context to children.
 */

import { notFound } from 'next/navigation';
import { getTenantBySlug } from '@/lib/tenant';
import { TenantProvider } from '@/contexts/TenantContext';
import type { ReactNode } from 'react';

interface TenantLayoutProps {
  children: ReactNode;
  params: Promise<{ tenant: string }>;
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const { tenant: tenantSlug } = await params;

  // Resolve tenant by slug
  const tenant = await getTenantBySlug(tenantSlug);

  if (!tenant) {
    notFound();
  }

  return <TenantProvider tenant={tenant}>{children}</TenantProvider>;
}
