'use client';

/**
 * CarbonDashboardPanel - Carbon Analysis Dashboard
 *
 * Displays carbon calculation results with visualizations:
 * - Total carbon footprint
 * - Material breakdown (pie chart)
 * - Category breakdown (bar chart)
 * - Recommendations
 *
 * Features:
 * - Uses useCarbonData hook for API fetching with SWR caching
 * - Wrapped in PanelErrorBoundary for error recovery
 * - Shows PanelLoadingState skeleton while loading
 * - Wrapped with Tambo's withTamboInteractable for AI control
 */

import { useCallback } from 'react';
import { usePanelStore } from '@/stores/panel-store';
import { useTranslation } from '@/i18n/provider';
import { Leaf, CloudOff } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useCarbonData } from '@/hooks/panel-data/useCarbonData';
import { PanelErrorBoundary } from './PanelErrorBoundary';
import { PanelLoadingState } from './PanelLoadingState';
import {
  withTamboInteractable,
  type WithTamboInteractableProps,
} from '@tambo-ai/react';
import {
  CarbonDashboardSchema,
  type CarbonDashboardProps,
} from '@/lib/tambo/schemas';

// Color palette for charts
const CHART_COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#84cc16', // lime-500
];

// ============================================
// Empty State Component
// ============================================

interface EmptyStateProps {
  type: 'no-model' | 'no-data';
}

function EmptyState({ type }: EmptyStateProps) {
  const { t } = useTranslation();

  if (type === 'no-model') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <CloudOff className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {t('workspacePanel.noModelLoaded')}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {t('workspacePanel.uploadModelForCarbon')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <Leaf className="w-12 h-12 text-green-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{t('workspacePanel.noCarbonData')}</h3>
      <p className="text-sm text-muted-foreground">
        {t('workspacePanel.startCarbonCalculation')}
      </p>
    </div>
  );
}

// ============================================
// Inner Panel Content (accepts Tambo props)
// ============================================

interface CarbonDashboardContentProps extends CarbonDashboardProps, WithTamboInteractableProps {}

function CarbonDashboardContent(props: CarbonDashboardContentProps) {
  const {
    totalCarbon: tamboTotalCarbon,
    unit: tamboUnit,
    materialBreakdown: tamboMaterialBreakdown,
    categoryBreakdown: tamboCategoryBreakdown,
    recommendations: tamboRecommendations,
  } = props;

  const { t } = useTranslation();
  const { updatePanelData } = usePanelStore();

  // Use the useCarbonData hook for API fetching, event-driven data, and store data
  // combinedData includes both API data and AI-pushed data via event bus
  // storeData comes from analysis-results-store (last resort fallback)
  const { combinedData, eventData, storeData, isLoading, hasModel, hasData: hookHasData } = useCarbonData();

  // Merge data sources with priority: Tambo props > combinedData (eventData/API) > storeData
  const totalCarbon = tamboTotalCarbon ?? combinedData?.totalCarbon ?? storeData?.totalCarbon;
  const unit = tamboUnit ?? combinedData?.unit ?? storeData?.unit ?? 'kgCO2e';
  const materials = tamboMaterialBreakdown?.map((m) => ({
    name: m.name,
    carbon: m.value,
    percentage: m.percentage,
  })) ?? combinedData?.materials ?? storeData?.materials;
  const categories = tamboCategoryBreakdown?.map((c) => ({
    category: c.category,
    carbon: c.value,
  })) ?? combinedData?.categories ?? storeData?.categories;
  // Recommendations from Tambo (API doesn't have recommendations yet)
  const recommendations = tamboRecommendations;

  // Check if we have any data (from Tambo props, event bus, API, or store)
  const hasData = totalCarbon !== undefined || materials?.length || categories?.length || hookHasData;

  // Check if we have AI-pushed data (eventData, Tambo props, or storeData)
  const hasAIPushedData = !!(eventData || storeData || tamboTotalCarbon !== undefined || tamboMaterialBreakdown?.length || tamboCategoryBreakdown?.length);

  // Handle export data event
  const handleExport = useCallback((format: 'pdf' | 'excel' | 'csv') => {
    // Update panel data with export request
    updatePanelData('carbon-dashboard', {
      state: { exportRequest: format },
      lastActive: Date.now(),
    });
  }, [updatePanelData]);

  // Show loading state while fetching (but not if we have AI-pushed data)
  if (isLoading && !hasData && !hasAIPushedData) {
    return <PanelLoadingState variant="chart" message={t('workspacePanel.loadingCarbonData')} />;
  }

  // Show empty state when no model loaded AND no AI-pushed data
  // (If AI pushed data, show it even without a model)
  if (!hasModel && !hasAIPushedData && !hasData) {
    return <EmptyState type="no-model" />;
  }

  // Show empty state when no data available
  if (!hasData) {
    return <EmptyState type="no-data" />;
  }

  // Carbon data display
  return (
    <div className="space-y-4">
      {/* Total Carbon */}
      {totalCarbon !== undefined && (
        <div
          data-testid="total-carbon"
          className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
        >
          <div className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
            {t('workspacePanel.totalCarbonFootprint')}
          </div>
          <div className="text-3xl font-bold text-green-700 dark:text-green-300">
            {totalCarbon.toLocaleString()} {unit}
          </div>
        </div>
      )}

      {/* Material Breakdown - Pie Chart */}
      {materials && materials.length > 0 && (
        <div className="p-4 bg-card rounded-lg border border-border">
          <h4 className="font-semibold mb-3">{t('workspacePanel.materialBreakdown')}</h4>
          <div className="h-64" role="img" aria-label={t('workspacePanel.pieChartAriaLabel')}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={materials}
                  dataKey="carbon"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, payload }) =>
                    `${name}: ${(payload as { percentage?: number })?.percentage ?? 0}%`
                  }
                >
                  {materials.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [
                    `${typeof value === 'number' ? value.toLocaleString() : value} ${unit}`,
                    t('workspacePanel.carbon'),
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Breakdown - Bar Chart */}
      {categories && categories.length > 0 && (
        <div className="p-4 bg-card rounded-lg border border-border">
          <h4 className="font-semibold mb-3">{t('workspacePanel.categoryBreakdown')}</h4>
          <div className="h-64" role="img" aria-label={t('workspacePanel.barChartAriaLabel')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} layout="vertical">
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={100}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [
                    `${typeof value === 'number' ? value.toLocaleString() : value} ${unit}`,
                    t('workspacePanel.carbon'),
                  ]}
                />
                <Bar
                  dataKey="carbon"
                  fill="#10b981"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="p-4 bg-card rounded-lg border border-border">
          <h4 className="font-semibold mb-3">{t('workspacePanel.recommendations')}</h4>
          <ul className="space-y-2">
            {recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Leaf className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Export Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => handleExport('pdf')}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t('workspacePanel.exportPDF')}
        </button>
        <button
          onClick={() => handleExport('excel')}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
        >
          {t('workspacePanel.exportExcel')}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Tambo Interactable Wrapper
// ============================================

const CarbonDashboardInteractable = withTamboInteractable(CarbonDashboardContent, {
  componentName: 'CarbonDashboard',
  description:
    'Carbon analysis dashboard showing emissions breakdown by material and category. ' +
    'Can display total carbon footprint, material breakdown pie chart, category breakdown bar chart, ' +
    'and sustainability recommendations.',
  propsSchema: CarbonDashboardSchema,
});

// ============================================
// Main Exported Component
// ============================================

export function CarbonDashboardPanel() {
  return (
    <PanelErrorBoundary panelName="Carbon Dashboard">
      <div data-testid="carbon-dashboard-panel" className="h-full w-full p-4 overflow-auto">
        <CarbonDashboardInteractable />
      </div>
    </PanelErrorBoundary>
  );
}
