'use client';

/**
 * MessageList - Tambo chat message list with travel-themed agent visualization
 *
 * Renders user messages with simple bubble styling, and assistant messages
 * with the full TravelAgentMessage visualization including:
 * - JourneyProgressBar
 * - CaptainsLog (reasoning)
 * - DestinationsVisited (tool calls)
 * - DiscoveryCards (tool results)
 */

import { useTambo } from '@tambo-ai/react';
import type { TamboThreadMessage } from '@tambo-ai/react';
import { TamboAgentMessage } from './TamboAgentMessage';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: TamboThreadMessage[];
}

/**
 * User message bubble - simple styling
 */
function UserMessage({ message }: { message: TamboThreadMessage }) {
  const textContent = message.content
    .filter((c) => c.type === 'text')
    .map((c) => ('text' in c ? c.text : ''))
    .join('\n');

  return (
    <div className="flex justify-end">
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          'bg-primary text-primary-foreground',
          'text-sm'
        )}
      >
        {textContent}
      </div>
    </div>
  );
}

export function MessageList({ messages }: MessageListProps) {
  const { currentThreadId, isStreaming } = useTambo();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const messageIsStreaming = isStreaming && isLastMessage;

        if (message.role === 'user') {
          return <UserMessage key={message.id} message={message} />;
        }

        // Assistant messages use the full travel-themed visualization
        return (
          <TamboAgentMessage
            key={message.id}
            message={message}
            threadId={currentThreadId}
            isStreaming={messageIsStreaming}
            hasNextMessage={!isLastMessage}
          />
        );
      })}
    </div>
  );
}
