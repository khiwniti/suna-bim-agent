/**
 * Streaming UI Components - Module Index
 *
 * Barrel export for streaming-related UI components.
 *
 * @example
 * ```typescript
 * import { StreamingStatusBar, StreamingCursor, ThinkingAnimation } from '@/components/ui/streaming';
 * ```
 */

// Streaming status components
export { StreamingStatusBar } from './StreamingStatusBar';
export type { StreamingStatusBarProps } from './StreamingStatusBar';

// Streaming cursor
export { StreamingCursor } from './StreamingCursor';
export type { StreamingCursorProps } from './StreamingCursor';

// Skeleton loader
export { SkeletonLoader } from './SkeletonLoader';
export type { SkeletonLoaderProps } from './SkeletonLoader';

// Progress indicators
export { CircularProgress } from './CircularProgress';
export type { CircularProgressProps } from './CircularProgress';

// Shimmer effect
export { ShimmerEffect } from './ShimmerEffect';
export type { ShimmerEffectProps } from './ShimmerEffect';

// Thinking animation
export { ThinkingAnimation } from './ThinkingAnimation';
export type { ThinkingAnimationProps } from './ThinkingAnimation';

// Re-export existing streaming cursor from parent
export {
  StreamingCursor as StreamingCursorLegacy,
  TypingDots,
  StreamingText,
} from '../StreamingCursor';
