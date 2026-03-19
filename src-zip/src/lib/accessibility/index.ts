/**
 * Accessibility Utilities Module
 *
 * Exports accessibility helpers for streaming UI components.
 */

export {
  // Reduced Motion
  useReducedMotion,
  useAnimationDuration,
  // Screen Reader
  useScreenReaderAnnounce,
  usePhaseAnnouncements,
  // Focus Management
  useFocusTrap,
  // ARIA Helpers
  getStreamingAriaProps,
  getToolCardAriaProps,
  getTimelineAriaProps,
  // Keyboard Navigation
  useArrowKeyNavigation,
} from './streaming';
