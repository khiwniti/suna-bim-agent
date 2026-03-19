'use client';

import { memo } from 'react';
import { MessageSquare, Plus, PanelLeftClose, PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Thread item from useTamboThreadList - simpler than TamboThread
 */
interface ThreadListItem {
  id: string;
  name?: string | null;
  updatedAt?: Date | string | null;
}

interface ThreadSidebarProps {
  threads: ThreadListItem[];
  currentThreadId?: string;
  isLoading: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onSwitchThread: (threadId: string) => void;
  onNewThread: () => void;
}

/**
 * ThreadSidebar
 *
 * Collapsible sidebar for thread management.
 * Allows switching between conversation threads and creating new ones.
 */
export const ThreadSidebar = memo(function ThreadSidebar({
  threads,
  currentThreadId,
  isLoading,
  isOpen,
  onToggle,
  onSwitchThread,
  onNewThread,
}: ThreadSidebarProps) {
  // Format thread title from name or first message
  const getThreadTitle = (thread: ThreadListItem) => {
    // Use thread name if available
    if (thread.name) {
      return thread.name.length > 50 ? thread.name.slice(0, 50) + '...' : thread.name;
    }
    // Fallback to thread ID
    return `Thread ${thread.id.slice(0, 8)}`;
  };

  // Format relative time
  const formatTime = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <>
      {/* Toggle Button (always visible) */}
      <button
        onClick={onToggle}
        className={cn(
          'absolute top-2 left-2 z-10 p-2 rounded-lg',
          'bg-background/80 backdrop-blur border border-border/50',
          'text-muted-foreground hover:text-foreground',
          'transition-colors'
        )}
        title={isOpen ? 'Close threads' : 'Open threads'}
      >
        {isOpen ? (
          <PanelLeftClose className="h-4 w-4" />
        ) : (
          <PanelLeft className="h-4 w-4" />
        )}
      </button>

      {/* Sidebar Panel */}
      <div
        className={cn(
          'flex flex-col border-r bg-muted/30',
          'transition-all duration-200 ease-in-out overflow-hidden',
          isOpen ? 'w-64' : 'w-0'
        )}
      >
        {isOpen && (
          <div className="flex flex-col h-full pt-12 min-w-64">
            {/* Header */}
            <div className="px-3 pb-3 border-b">
              <button
                onClick={onNewThread}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2',
                  'rounded-lg border border-dashed border-border',
                  'text-sm text-muted-foreground hover:text-foreground',
                  'hover:border-primary hover:bg-primary/5',
                  'transition-colors'
                )}
              >
                <Plus className="h-4 w-4" />
                New conversation
              </button>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto py-2">
              {isLoading ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Loading threads...
                </div>
              ) : threads.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No conversations yet
                </div>
              ) : (
                <div className="space-y-1 px-2">
                  {threads.map(thread => (
                    <button
                      key={thread.id}
                      onClick={() => onSwitchThread(thread.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg',
                        'transition-colors',
                        thread.id === currentThreadId
                          ? 'bg-primary/10 text-foreground'
                          : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm truncate">
                            {getThreadTitle(thread)}
                          </div>
                          {thread.updatedAt && (
                            <div className="text-xs text-muted-foreground">
                              {formatTime(thread.updatedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
});
