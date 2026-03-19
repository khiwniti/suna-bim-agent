'use client';

/**
 * CertificationDashboard Component
 *
 * Comprehensive dashboard displaying all certification statuses,
 * carbon metrics, and recommendations for improvement.
 *
 * ★ Insight ─────────────────────────────────────
 * Designed for Thai construction professionals:
 * - Multi-certification overview (Edge, TREES, T-VER)
 * - Bank loan eligibility indicators
 * - Actionable improvement recommendations
 * - Export-ready for documentation
 * ─────────────────────────────────────────────────
 */

import * as React from 'react';
import {
  Leaf,
  TreeDeciduous,
  Building2,
  TrendingDown,
  FileText,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  BarChart3,
  Download,
} from 'lucide-react';
import { cn, formatCarbon } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  CertificationCard,
  type CertificationType,
  CERTIFICATION_LEVELS,
} from './CertificationCard';
import {
  useCarbonAnalysis,
  useEdgeCertification,
  useTREESAssessment,
  useBankDocument,
  useCertificationLevel,
  useCarbonHotspots,
} from '@/stores';
import { useTranslation } from '@/i18n/provider';

export interface CertificationDashboardProps {
  /** Project ID */
  projectId: string;
  /** Project name */
  projectName: string;
  /** Callback when certification card is clicked */
  onCertificationClick?: (type: CertificationType) => void;
  /** Callback to generate bank report */
  onGenerateReport?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * Main CertificationDashboard component
 */
export function CertificationDashboard({
  projectId,
  projectName,
  onCertificationClick,
  onGenerateReport,
  className,
}: CertificationDashboardProps) {
  const { t, locale } = useTranslation();
  const { analysis, status: analysisStatus } = useCarbonAnalysis();
  const { calculation: edgeCalc, status: edgeStatus, reduction } = useEdgeCertification();
  const { assessment: treesAssessment, status: treesStatus } = useTREESAssessment();
  const bankDocument = useBankDocument();
  const certificationLevel = useCertificationLevel();
  const hotspots = useCarbonHotspots(5);

  const isLoading = analysisStatus === 'loading' || edgeStatus === 'loading' || treesStatus === 'loading';

  // Calculate progress for each certification
  const edgeProgress = Math.min((reduction / 20) * 100, 100); // 20% for first level
  const treesProgress = treesAssessment ? (treesAssessment.totalPoints / 30) * 100 : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('certification.dashboard.title')}</h2>
          <p className="text-muted-foreground">
            {projectName} | {t('certification.dashboard.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateReport}
            disabled={!analysis || bankDocument.isGenerating}
          >
            <FileText className="mr-2 h-4 w-4" />
            {t('certification.dashboard.generateReport')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!analysis}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('certification.dashboard.exportPdf')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Carbon */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500/10">
              <BarChart3 className="h-5 w-5 text-slate-600 dark:text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('certification.summary.totalCarbon')}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">
              {analysis ? formatCarbon(analysis.totalEmbodiedCarbon) : '--'}
            </p>
            {analysis && (
              <p className="text-sm text-muted-foreground">
                {analysis.carbonPerSquareMeter.toFixed(1)} kgCO₂e/m²
              </p>
            )}
          </div>
        </div>

        {/* Carbon Reduction */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('certification.summary.carbonReduction')}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {reduction > 0 ? `-${reduction.toFixed(1)}%` : '--'}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('certification.summary.vsBaseline')}
            </p>
          </div>
        </div>

        {/* Current Certification */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <CheckCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('certification.summary.certificationStatus')}</p>
            </div>
          </div>
          <div className="mt-4">
            {certificationLevel !== 'none' ? (
              <>
                <Badge variant="success" className="text-base py-1">
                  {certificationLevel.replace('_', ' ').toUpperCase()}
                </Badge>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('certification.summary.eligibleGreenLoans')}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-muted-foreground">
                  {t('certification.summary.notCertified')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('certification.summary.reviewRecommendations')}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Certification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CertificationCard
          type="edge"
          currentLevel={edgeCalc?.certificationLevel || null}
          progress={edgeProgress}
          metrics={[
            { label: 'Carbon Reduction', value: edgeCalc?.carbonReduction?.toFixed(1) || 0, unit: '%' },
            { label: 'Baseline Carbon', value: edgeCalc?.baselineCarbon ? formatCarbon(edgeCalc.baselineCarbon) : '--' },
          ]}
          onClick={() => onCertificationClick?.('edge')}
        />
        <CertificationCard
          type="trees"
          currentLevel={treesAssessment?.targetLevel || null}
          progress={treesProgress}
          metrics={[
            { label: 'Total Points', value: treesAssessment?.totalPoints || 0 },
            { label: 'MR Credits', value: (treesAssessment?.mrCredits.mr4RecycledMaterial || 0) + (treesAssessment?.mrCredits.mr5LocalMaterial || 0) },
          ]}
          onClick={() => onCertificationClick?.('trees')}
        />
        <CertificationCard
          type="tver"
          currentLevel={null}
          metrics={[
            { label: 'Carbon Credits', value: '--', unit: 'tCO₂e' },
            { label: 'Estimated Value', value: '--', unit: 'THB' },
          ]}
          onClick={() => onCertificationClick?.('tver')}
        />
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="hotspots" className="w-full">
        <TabsList>
          <TabsTrigger value="hotspots">
            <AlertTriangle className="mr-2 h-4 w-4" />
            {t('certification.tabs.hotspots')}
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <ArrowUpRight className="mr-2 h-4 w-4" />
            {t('certification.tabs.recommendations')}
          </TabsTrigger>
          <TabsTrigger value="materials">
            <Building2 className="mr-2 h-4 w-4" />
            {t('certification.tabs.materials')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hotspots" className="mt-4">
          <div className="rounded-xl border bg-card">
            <div className="p-4 border-b">
              <h3 className="font-semibold">{t('certification.hotspots.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('certification.hotspots.description')}
              </p>
            </div>
            <div className="divide-y">
              {hotspots.length > 0 ? (
                hotspots.map((hotspot, index) => (
                  <div key={hotspot.itemId} className="flex items-center gap-4 p-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{hotspot.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCarbon(hotspot.carbon)} ({hotspot.percentage.toFixed(1)}% {t('certification.hotspots.ofTotal')})
                      </p>
                    </div>
                    <Progress
                      value={hotspot.percentage}
                      variant="warning"
                      className="w-32"
                    />
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <AlertTriangle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>{t('certification.hotspots.noData')}</p>
                  <p className="text-sm">{t('certification.hotspots.uploadBoq')}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <div className="rounded-xl border bg-card">
            <div className="p-4 border-b">
              <h3 className="font-semibold">{t('certification.recommendations.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('certification.recommendations.description')}
              </p>
            </div>
            <div className="divide-y">
              {treesAssessment?.recommendations && treesAssessment.recommendations.length > 0 ? (
                treesAssessment.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-4">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{rec}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <CheckCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>{t('certification.recommendations.noData')}</p>
                  <p className="text-sm">{t('certification.recommendations.completeAssessment')}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <div className="rounded-xl border bg-card">
            <div className="p-4 border-b">
              <h3 className="font-semibold">{t('certification.materials.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('certification.materials.description')}
              </p>
            </div>
            <div className="p-4">
              {analysis?.categoryBreakdown && analysis.categoryBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {analysis.categoryBreakdown.map((cat) => (
                    <div key={cat.category} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{cat.category}</span>
                        <span className="text-muted-foreground">
                          {formatCarbon(cat.totalCarbon)} ({cat.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress
                        value={cat.percentage}
                        variant={cat.percentage > 30 ? 'warning' : 'default'}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <BarChart3 className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>{t('certification.materials.noData')}</p>
                  <p className="text-sm">{t('certification.materials.uploadBoq')}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CertificationDashboard;
