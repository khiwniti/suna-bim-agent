'use client';

/**
 * FloorPlanProgress Component
 *
 * Displays step-by-step progress during floor plan processing with
 * visual indicators, animations, and status feedback.
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  ImageIcon,
  Eye,
  Box,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessingProgress } from '@/mcp';

// ============================================
// Types
// ============================================

export interface FloorPlanProgressProps {
  /** Current progress state */
  progress: ProcessingProgress | null;
  /** Whether processing is active */
  isProcessing: boolean;
  /** Error message if failed */
  error: string | null;
  /** Callback to cancel processing */
  onCancel?: () => void;
  /** Callback to retry after error */
  onRetry?: () => void;
  /** Compact display mode */
  compact?: boolean;
}

interface ProcessingStepDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

// ============================================
// Step Definitions
// ============================================

const PROCESSING_STEPS: ProcessingStepDefinition[] = [
  {
    id: 'preprocessing',
    name: 'Preprocessing',
    description: 'Analyzing image structure',
    icon: <ImageIcon className="w-4 h-4" />,
  },
  {
    id: 'vision_analysis',
    name: 'Vision Analysis',
    description: 'Detecting walls, doors, windows',
    icon: <Eye className="w-4 h-4" />,
  },
  {
    id: 'geometry',
    name: 'Geometry',
    description: 'Generating 3D model',
    icon: <Box className="w-4 h-4" />,
  },
  {
    id: 'export',
    name: 'Export',
    description: 'Finalizing output',
    icon: <Download className="w-4 h-4" />,
  },
];

// Map step names from backend to our step IDs
const STEP_NAME_MAP: Record<string, string> = {
  'connecting': 'preprocessing',
  'preprocessing': 'preprocessing',
  'preprocess': 'preprocessing',
  'vision': 'vision_analysis',
  'vision_analysis': 'vision_analysis',
  'analyze': 'vision_analysis',
  'geometry': 'geometry',
  'generate': 'geometry',
  'export': 'export',
  'complete': 'complete',
};

// ============================================
// Helper Functions
// ============================================

function normalizeStepName(step: string): string {
  return STEP_NAME_MAP[step.toLowerCase()] || step.toLowerCase();
}

function getStepIndex(stepId: string): number {
  return PROCESSING_STEPS.findIndex((s) => s.id === stepId);
}

function getStepStatus(
  stepId: string,
  currentStep: string | null,
  isComplete: boolean,
  hasError: boolean
): 'pending' | 'active' | 'completed' | 'error' {
  if (hasError) {
    const currentIndex = getStepIndex(normalizeStepName(currentStep || ''));
    const stepIndex = getStepIndex(stepId);
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'error';
    return 'pending';
  }

  if (isComplete) return 'completed';

  const normalizedCurrent = normalizeStepName(currentStep || '');
  const currentIndex = getStepIndex(normalizedCurrent);
  const stepIndex = getStepIndex(stepId);

  if (stepIndex < currentIndex) return 'completed';
  if (stepIndex === currentIndex) return 'active';
  return 'pending';
}

// ============================================
// Sub-Components
// ============================================

interface StepIndicatorProps {
  step: ProcessingStepDefinition;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress: number;
  isLast: boolean;
  compact?: boolean;
}

function StepIndicator({ step, status, progress, isLast, compact }: StepIndicatorProps) {
  const statusColors = {
    pending: 'text-muted-foreground bg-muted',
    active: 'text-primary bg-primary/10',
    completed: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    error: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
  };

  const lineColors = {
    pending: 'bg-muted',
    active: 'bg-primary/30',
    completed: 'bg-green-500',
    error: 'bg-red-500',
  };

  // Render status icon based on current status
  const renderStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      case 'active':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <div
          className={cn(
            'flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300',
            statusColors[status]
          )}
        >
          {renderStatusIcon()}
        </div>
        {!isLast && (
          <div
            className={cn(
              'w-4 h-0.5 transition-all duration-300',
              lineColors[status === 'completed' ? 'completed' : 'pending']
            )}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      {/* Icon and connector line */}
      <div className="flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300',
            statusColors[status]
          )}
        >
          {renderStatusIcon()}
        </motion.div>
        {!isLast && (
          <div className="w-0.5 h-8 mt-1 bg-border relative overflow-hidden">
            {status === 'completed' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ duration: 0.3 }}
                className={lineColors.completed}
              />
            )}
            {status === 'active' && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${progress}%` }}
                className={lineColors.active}
              />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-sm font-medium transition-colors',
              status === 'active' && 'text-primary',
              status === 'completed' && 'text-green-600 dark:text-green-400',
              status === 'error' && 'text-red-600 dark:text-red-400',
              status === 'pending' && 'text-muted-foreground'
            )}
          >
            {step.name}
          </span>
          {status === 'active' && (
            <span className="text-xs text-muted-foreground">
              {Math.round(progress)}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>

        {/* Progress bar for active step */}
        {status === 'active' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2"
          >
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export function FloorPlanProgress({
  progress,
  isProcessing,
  error,
  onCancel,
  onRetry,
  compact = false,
}: FloorPlanProgressProps) {
  const currentStep = progress?.step || null;
  const currentProgress = progress?.progress || 0;
  const isComplete = currentStep === 'complete';
  const hasError = !!error;

  // Calculate overall progress
  const normalizedStep = normalizeStepName(currentStep || '');
  const stepIndex = getStepIndex(normalizedStep);
  const overallProgress = isComplete
    ? 100
    : stepIndex >= 0
    ? ((stepIndex + currentProgress / 100) / PROCESSING_STEPS.length) * 100
    : 0;

  if (!isProcessing && !progress && !error) {
    return null;
  }

  // Compact mode - horizontal progress
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="px-4 py-3 bg-card border-b border-border"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium">
            {hasError ? 'Processing failed' : isComplete ? 'Complete!' : 'Processing floor plan...'}
          </span>
          <span className="text-xs text-muted-foreground">{Math.round(overallProgress)}%</span>
        </div>

        {/* Compact step indicators */}
        <div className="flex items-center justify-between">
          {PROCESSING_STEPS.map((step, index) => (
            <StepIndicator
              key={step.id}
              step={step}
              status={getStepStatus(step.id, currentStep, isComplete, hasError)}
              progress={normalizedStep === step.id ? currentProgress : 0}
              isLast={index === PROCESSING_STEPS.length - 1}
              compact
            />
          ))}
        </div>

        {/* Error message */}
        {hasError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="truncate">{error}</span>
            {onRetry && (
              <button
                onClick={onRetry}
                className="ml-auto px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  // Full mode - vertical progress
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 bg-card border border-border rounded-xl shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : hasError ? (
            <XCircle className="w-5 h-5 text-red-600" />
          ) : (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          )}
          <h3 className="font-semibold text-sm">
            {hasError
              ? 'Processing Failed'
              : isComplete
              ? 'Processing Complete'
              : 'Processing Floor Plan'}
          </h3>
        </div>
        {onCancel && isProcessing && !isComplete && (
          <button
            onClick={onCancel}
            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Overall progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.5 }}
            className={cn(
              'h-full rounded-full transition-colors',
              hasError ? 'bg-red-500' : isComplete ? 'bg-green-500' : 'bg-primary'
            )}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            {progress?.message || 'Initializing...'}
          </span>
          <span className="text-xs font-medium">{Math.round(overallProgress)}%</span>
        </div>
      </div>

      {/* Step indicators */}
      <div className="space-y-0">
        {PROCESSING_STEPS.map((step, index) => (
          <StepIndicator
            key={step.id}
            step={step}
            status={getStepStatus(step.id, currentStep, isComplete, hasError)}
            progress={normalizedStep === step.id ? currentProgress : 0}
            isLast={index === PROCESSING_STEPS.length - 1}
          />
        ))}
      </div>

      {/* Error state */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success state */}
      <AnimatePresence>
        {isComplete && !hasError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">
                Floor plan successfully converted to 3D model!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default FloorPlanProgress;
