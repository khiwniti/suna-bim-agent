'use client';

/**
 * JourneyProgressBar - Visual progress through travel phases
 *
 * Shows a horizontal progress bar with icons for each phase:
 * 🛫 Departing → 🗺️ Charting → 🧳 Packing → ✈️ Flight → 🌊 Waters → 🏝️ Arriving
 *
 * Features:
 * - Animated phase transitions
 * - Pulsing current phase indicator
 * - Completed phases show checkmark overlay
 * - Connection lines animate like "traveling" effect
 */

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  TRAVEL_PHASES,
  getTravelPhaseInfo,
  isPhaseCompleted,
  isPhaseActive,
  type TravelPhase,
} from '@/lib/travel-destinations';

export interface JourneyProgressBarProps {
  /** Current travel phase */
  currentPhase: TravelPhase;
  /** Whether the journey is complete */
  isComplete?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * Single phase node in the progress bar
 */
const PhaseNode = memo(function PhaseNode({
  phase,
  currentPhase,
  isComplete,
  index,
}: {
  phase: TravelPhase;
  currentPhase: TravelPhase;
  isComplete: boolean;
  index: number;
}) {
  const info = getTravelPhaseInfo(phase);
  const completed = isComplete || isPhaseCompleted(phase, currentPhase);
  const active = !isComplete && isPhaseActive(phase, currentPhase);

  return (
    <div className="flex flex-col items-center gap-1 relative z-10">
      {/* Phase icon container */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center w-10 h-10 rounded-full',
          'border-2 transition-colors duration-300',
          completed && 'bg-primary/20 border-primary',
          active && 'bg-primary/10 border-primary',
          !completed && !active && 'bg-muted/50 border-muted-foreground/30'
        )}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
        }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
      >
        {/* Phase icon */}
        <motion.span
          className="text-lg"
          animate={
            active
              ? {
                  scale: [1, 1.1, 1],
                }
              : {}
          }
          transition={
            active
              ? {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
              : {}
          }
        >
          {info.icon}
        </motion.span>

        {/* Completed checkmark overlay */}
        {completed && (
          <motion.div
            className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Check className="w-2.5 h-2.5 text-white" />
          </motion.div>
        )}

        {/* Active pulse ring */}
        {active && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>

      {/* Phase name */}
      <span
        className={cn(
          'text-[10px] font-medium text-center max-w-[60px] leading-tight',
          completed && 'text-primary',
          active && 'text-primary',
          !completed && !active && 'text-muted-foreground/60'
        )}
      >
        {info.name}
      </span>
    </div>
  );
});

/**
 * Connection line between phases
 */
const ConnectionLine = memo(function ConnectionLine({
  fromPhase,
  currentPhase,
  isComplete,
  index,
}: {
  fromPhase: TravelPhase;
  currentPhase: TravelPhase;
  isComplete: boolean;
  index: number;
}) {
  const completed = isComplete || isPhaseCompleted(fromPhase, currentPhase);
  const currentIndex = TRAVEL_PHASES.indexOf(currentPhase);
  const lineIndex = index;
  const isTransitioning = lineIndex === currentIndex - 1;

  return (
    <div className="flex-1 h-0.5 mx-1 relative overflow-hidden">
      {/* Background line */}
      <div className="absolute inset-0 bg-muted-foreground/20 rounded-full" />

      {/* Progress line */}
      <motion.div
        className={cn(
          'absolute inset-y-0 left-0 rounded-full',
          completed ? 'bg-primary' : 'bg-primary/30'
        )}
        initial={{ width: '0%' }}
        animate={{
          width: completed ? '100%' : isTransitioning ? '50%' : '0%',
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      {/* Traveling dot animation for active transition */}
      {isTransitioning && (
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full shadow-lg shadow-primary/50"
          animate={{
            x: ['0%', '100%'],
            opacity: [1, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
    </div>
  );
});

/**
 * JourneyProgressBar - Main component
 */
export const JourneyProgressBar = memo(function JourneyProgressBar({
  currentPhase,
  isComplete = false,
  className,
}: JourneyProgressBarProps) {
  // Memoize to prevent unnecessary recalculations
  const phases = useMemo(() => TRAVEL_PHASES, []);

  return (
    <motion.div
      className={cn(
        'w-full px-2 py-3',
        'bg-gradient-to-r from-muted/30 via-muted/20 to-muted/30',
        'rounded-lg border border-border/30',
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-sm">🧭</span>
        <span className="text-xs font-medium text-muted-foreground">
          Journey Progress
        </span>
        {isComplete && (
          <motion.span
            className="text-xs text-green-500 font-medium ml-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            ✓ Arrived
          </motion.span>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex items-center">
        {phases.map((phase, index) => (
          <div key={phase} className="contents">
            {/* Phase node */}
            <PhaseNode
              phase={phase}
              currentPhase={currentPhase}
              isComplete={isComplete}
              index={index}
            />

            {/* Connection line (not after last phase) */}
            {index < phases.length - 1 && (
              <ConnectionLine
                fromPhase={phase}
                currentPhase={currentPhase}
                isComplete={isComplete}
                index={index}
              />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
});

export default JourneyProgressBar;
