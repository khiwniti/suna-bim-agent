/**
 * Travel-themed agent chat components
 *
 * Manus.im-style visualization for agent responses with travel metaphors:
 * - Journey phases (Departing → Arriving)
 * - Tool calls as "destinations visited"
 * - Results as "discoveries"
 * - Reasoning as "Captain's Log"
 */

// Main wrapper component
export { TravelAgentMessage, type TravelAgentMessageProps, type TravelToolCall, type TravelDiscovery } from './TravelAgentMessage';

// Individual components
export { JourneyProgressBar, type JourneyProgressBarProps } from './JourneyProgressBar';
export { CaptainsLog, type CaptainsLogProps } from './CaptainsLog';
export { DestinationsVisited, type DestinationsVisitedProps, type DestinationInfo } from './DestinationsVisited';
export { DiscoveryCard, type DiscoveryCardProps } from './DiscoveryCard';
