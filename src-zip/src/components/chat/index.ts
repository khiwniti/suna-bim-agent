// Core Chat Components
export { ChatPanel, default } from './ChatPanel';
export { WorkspaceChatPanel } from './WorkspaceChatPanel';
export { FloorPlanProgress } from './FloorPlanProgress';
export { ChatContent } from './ChatContent';

// Headless Chat UI Components
export { FloatingChatFAB, type FABPosition } from './FloatingChatFAB';
export { FloatingChatPanel } from './FloatingChatPanel';
export { HeadlessChat } from './HeadlessChat';
export { MessageBubble, TypingIndicator, type MessageRole, type DeliveryStatus } from './MessageBubble';
export { BIMMarkdown, DataCard, QuickStat } from './BIMMarkdown';
export { AgentStateVisualization, ThinkingAnimation, type AgentState, type AgentEvent, type AgentEventType, type AgentEventStatus } from './AgentStateVisualization';
export { AgentProgressSteps } from './AgentProgressSteps';

// Message utility components
export { MessageActions, FeedbackButtons } from './MessageActions';
export { ReasoningBlock, ThinkingIndicator as InlineThinkingIndicator } from './ReasoningBlock';
export { SourceCitations } from './SourceCitations';

// Chat message with tool visualization
export {
  ChatMessageWithTools,
  type ChatMessageWithToolsProps,
  type ToolCall,
} from './ChatMessageWithTools';

// Tool Visualizers (re-export from tool-visualizers/)
export * from './tool-visualizers';

// Workflow Visualization (re-export from workflow/)
export * from './workflow';

// Agent Response Card - Beautiful AI response visualization
export {
  AgentResponseCard,
  type AgentResponseCardProps,
  type AgentReasoning,
  type ToolCallInfo,
  type ViewportCommand,
} from './AgentResponseCard';

// Smart Agent Message - Intelligent message renderer with auto-detection
export { SmartAgentMessage, type SmartAgentMessageProps } from './SmartAgentMessage';

// NOTE: The following components were removed as unused dead code:
// - ChatContainer (unused wrapper)
// - AdvancedAgentState (superseded by AgentStateVisualization)
// - ActivityPanel (only used by ManusStyleChat)
// - ManusStyleChat (alternative implementation never adopted)
// - AgentResponseDemo (demo-only, not production)
