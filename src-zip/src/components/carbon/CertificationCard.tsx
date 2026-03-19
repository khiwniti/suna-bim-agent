'use client';

/**
 * CertificationCard Component
 *
 * Displays certification status and details in a card format.
 * Supports Edge, TREES, and T-VER certifications.
 *
 * ★ Insight ─────────────────────────────────────
 * Visual design inspired by Thai construction industry needs:
 * - Clear certification level indicators
 * - Thai/English bilingual support
 * - Progress toward next level
 * - Bank-friendly presentation for green loans
 * ─────────────────────────────────────────────────
 */

import * as React from 'react';
import {
  Leaf,
  TreeDeciduous,
  Building2,
  Award,
  TrendingUp,
  ChevronRight,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/i18n/provider';

export type CertificationType = 'edge' | 'trees' | 'tver';

export interface CertificationLevel {
  id: string;
  name: string;
  nameTh: string;
  minReduction?: number; // For Edge
  minPoints?: number;    // For TREES
  color: string;
}

export const CERTIFICATION_LEVELS: Record<CertificationType, CertificationLevel[]> = {
  edge: [
    { id: 'certified', name: 'EDGE Certified', nameTh: 'EDGE รับรอง', minReduction: 20, color: 'bg-emerald-500' },
    { id: 'advanced', name: 'EDGE Advanced', nameTh: 'EDGE ขั้นสูง', minReduction: 40, color: 'bg-emerald-600' },
    { id: 'zero_carbon', name: 'EDGE Zero Carbon', nameTh: 'EDGE Zero Carbon', minReduction: 100, color: 'bg-emerald-700' },
  ],
  trees: [
    { id: 'certified', name: 'TREES Certified', nameTh: 'TREES รับรอง', minPoints: 30, color: 'bg-lime-500' },
    { id: 'silver', name: 'TREES Silver', nameTh: 'TREES ระดับเงิน', minPoints: 40, color: 'bg-gray-400' },
    { id: 'gold', name: 'TREES Gold', nameTh: 'TREES ระดับทอง', minPoints: 50, color: 'bg-amber-500' },
    { id: 'platinum', name: 'TREES Platinum', nameTh: 'TREES ระดับแพลทินัม', minPoints: 60, color: 'bg-slate-700' },
  ],
  tver: [
    { id: 'registered', name: 'T-VER Registered', nameTh: 'T-VER ขึ้นทะเบียน', color: 'bg-blue-500' },
    { id: 'verified', name: 'T-VER Verified', nameTh: 'T-VER รับรอง', color: 'bg-blue-600' },
  ],
};

export interface CertificationCardProps {
  /** Certification type */
  type: CertificationType;
  /** Current certification level achieved (null if none) */
  currentLevel: string | null;
  /** Progress value (0-100) */
  progress?: number;
  /** Key metrics to display */
  metrics?: {
    label: string;
    value: string | number;
    unit?: string;
  }[];
  /** Click handler */
  onClick?: () => void;
  /** Whether the card is in compact mode */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

const CERTIFICATION_ICONS = {
  edge: Leaf,
  trees: TreeDeciduous,
  tver: Building2,
};

const CERTIFICATION_COLORS = {
  edge: 'from-emerald-500/20 to-green-500/20',
  trees: 'from-lime-500/20 to-green-500/20',
  tver: 'from-blue-500/20 to-cyan-500/20',
};

const CERTIFICATION_NAMES = {
  edge: { en: 'Edge Certificate', th: 'ใบรับรอง Edge' },
  trees: { en: 'TREES-NC', th: 'TREES-NC' },
  tver: { en: 'T-VER Carbon Credit', th: 'คาร์บอนเครดิต T-VER' },
};

export function CertificationCard({
  type,
  currentLevel,
  progress = 0,
  metrics = [],
  onClick,
  compact = false,
  className,
}: CertificationCardProps) {
  const { t, locale } = useTranslation();
  const Icon = CERTIFICATION_ICONS[type];
  const levels = CERTIFICATION_LEVELS[type];
  const currentLevelData = currentLevel
    ? levels.find((l) => l.id === currentLevel)
    : null;

  // Get next level for progress display
  const currentIndex = currentLevel
    ? levels.findIndex((l) => l.id === currentLevel)
    : -1;
  const nextLevel = currentIndex < levels.length - 1
    ? levels[currentIndex + 1]
    : null;

  return (
    <div
      className={cn(
        'group relative rounded-xl border transition-all duration-300',
        'bg-card hover:shadow-lg cursor-pointer',
        onClick && 'hover:border-primary/50',
        className
      )}
      onClick={onClick}
    >
      {/* Gradient background */}
      <div
        className={cn(
          'absolute inset-0 rounded-xl opacity-50',
          'bg-gradient-to-br',
          CERTIFICATION_COLORS[type]
        )}
      />

      <div className={cn('relative', compact ? 'p-4' : 'p-6')}>
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center rounded-lg',
                compact ? 'h-10 w-10' : 'h-12 w-12',
                currentLevelData?.color || 'bg-muted',
                'text-white'
              )}
            >
              <Icon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
            </div>
            <div>
              <h3 className={cn('font-semibold', compact ? 'text-sm' : 'text-lg')}>
                {t(`certification.types.${type}`)}
              </h3>
              <p className="text-xs text-muted-foreground">
                {locale === 'th' ? CERTIFICATION_NAMES[type].en : CERTIFICATION_NAMES[type].th}
              </p>
            </div>
          </div>

          {currentLevelData && (
            <Badge variant={type}>
              <BadgeCheck className="mr-1 h-3 w-3" />
              {locale === 'th' ? currentLevelData.nameTh : currentLevelData.name}
            </Badge>
          )}
        </div>

        {/* Progress to next level */}
        {!compact && nextLevel && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('certification.card.progressTo')} {locale === 'th' ? nextLevel.nameTh : nextLevel.name}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress
              value={progress}
              variant={progress >= 100 ? 'success' : 'default'}
            />
          </div>
        )}

        {/* Metrics */}
        {!compact && metrics.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="space-y-1">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="text-lg font-semibold">
                  {metric.value}
                  {metric.unit && (
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      {metric.unit}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Action hint */}
        {onClick && (
          <div
            className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity',
              'group-hover:opacity-100'
            )}
          >
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}

export default CertificationCard;
