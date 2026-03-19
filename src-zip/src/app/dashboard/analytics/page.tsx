'use client';

/**
 * Analytics Dashboard Page
 *
 * Enterprise analytics page showing tenant usage metrics and trends.
 * Requires authentication and tenant membership.
 *
 * Features:
 * - Overview metrics cards
 * - Usage trends visualization
 * - Date range selection
 * - Period aggregation
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Loading';
import { AdvancedDashboard } from '@/components/analytics/AdvancedDashboard';
import { useTranslation } from '@/i18n/provider';

// ============================================
// Types
// ============================================

interface Tenant {
  id: string;
  name: string;
  slug: string;
  memberships: Array<{
    role: string;
    joinedAt: string;
  }>;
  _count: {
    projects: number;
    memberships: number;
  };
}

interface TenantsResponse {
  tenants: Tenant[];
}

// ============================================
// Fetcher
// ============================================

const fetcher = async (url: string): Promise<TenantsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch tenants');
  }
  return res.json();
};

// ============================================
// Page Component
// ============================================

export default function AnalyticsDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  // Translation hook available for future i18n support
  useTranslation();

  // Fetch user's tenants
  const { data: tenantsData, error, isLoading } = useSWR<TenantsResponse>(
    user ? '/api/tenants' : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            View usage metrics and trends
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-border">
          <BarChart3 className="w-12 h-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Unable to Load Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            There was an error loading your organization data.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No tenants
  if (!tenantsData?.tenants || tenantsData.tenants.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
          <p className="mt-1 text-muted-foreground">
            View usage metrics and trends
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-border">
          <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Organizations</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md text-center">
            You need to be a member of an organization to view analytics.
            Create a new organization or ask an admin to invite you.
          </p>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  // Transform tenants for the dashboard
  const tenants = tenantsData.tenants.map((tenant) => ({
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="mt-1 text-muted-foreground">
          Monitor usage, track trends, and optimize your platform utilization
        </p>
      </div>

      {/* Dashboard */}
      <AdvancedDashboard
        tenants={tenants}
        defaultTenantId={tenants[0]?.id}
      />
    </div>
  );
}
