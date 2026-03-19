'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  useTambo,
  useTamboThreadInput,
  useTamboThreadList,
  useTamboSuggestions,
  useTamboVoice,
} from '@tambo-ai/react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ThreadSidebar } from './ThreadSidebar';
import { Suggestions } from './Suggestions';
import { PanelEventSubscriber } from './PanelEventSubscriber';

/**
 * TamboChatPanel
 *
 * Main chat panel using Tambo AI for conversational interface.
 * Enhanced with:
 * - Thread management (sidebar for switching threads)
 * - Suggestions (AI-generated follow-up prompts)
 * - Panel event subscription (bridges tools → UI)
 * - Pending message handling from landing page
 *
 * ★ Insight ─────────────────────────────────────
 * When users start a chat from the landing page, their initial
 * message is stored in sessionStorage. This component picks it
 * up and to provide seamless UX across the redirect.
 auto-submits * Similarly, pending upload actions trigger the file picker.
 * ─────────────────────────────────────────────────
 */
export function TamboChatPanel() {
  const { thread, messages, isStreaming, currentThreadId, switchThread, startNewThread } = useTambo();
  const { setValue, submit, isPending, isDisabled, value } = useTamboThreadInput();
  const { data: threadListData, isLoading: isThreadsLoading } = useTamboThreadList();
  const { suggestions, isLoading: isSuggestionsLoading } = useTamboSuggestions();
  
  // Voice input hook - provides speech-to-text functionality
  const {
    isRecording,
    transcript,
    startRecording,
    stopRecording,
    transcriptionError,
    isTranscribing,
  } = useTamboVoice();

  const hasProcessedPendingMessage = useRef(false);
  const [triggerUpload, setTriggerUpload] = useState(false);
  const [showThreadSidebar, setShowThreadSidebar] = useState(false);

  // Extract thread list from query data
  const threads = threadListData?.threads ?? [];

  // Handle suggestion click - suggestions are Suggestion objects with title property
  const handleSuggestionClick = useCallback(
    (suggestionText: string) => {
      setValue(suggestionText);
      // Auto-submit after setting value
      setTimeout(() => submit(), 50);
    },
    [setValue, submit]
  );

  // Handle new thread creation
  const handleNewThread = useCallback(async () => {
    startNewThread();
    setShowThreadSidebar(false);
  }, [startNewThread]);

  // Handle thread switch
  const handleSwitchThread = useCallback(
    async (threadId: string) => {
      await switchThread(threadId);
      setShowThreadSidebar(false);
    },
    [switchThread]
  );

  // Check for pending message or upload action from landing page on mount
  useEffect(() => {
    if (hasProcessedPendingMessage.current) return;
    if (typeof window === 'undefined') return;

    // Handle pending chat message
    const pendingMessage = sessionStorage.getItem('pendingChatMessage');
    if (pendingMessage) {
      sessionStorage.removeItem('pendingChatMessage');
      hasProcessedPendingMessage.current = true;

      // Set value and submit after a short delay to ensure Tambo is ready
      setTimeout(() => {
        setValue(pendingMessage);
        // Need another tick for the value to be set before submitting
        setTimeout(() => {
          submit();
        }, 50);
      }, 100);
      return;
    }

    // Handle pending upload action
    const pendingUpload = sessionStorage.getItem('pendingUploadAction');
    if (pendingUpload) {
      sessionStorage.removeItem('pendingUploadAction');
      hasProcessedPendingMessage.current = true;
      // Trigger upload dialog via state passed to ChatInput
      setTriggerUpload(true);
    }
  }, [setValue, submit]);

  // Map Suggestion[] to string[] for the Suggestions component
  const suggestionTitles = suggestions.map((s) => s.title);

  return (
    <div className="flex h-full">
      {/* Event subscriber bridges tool events to panel store */}
      <PanelEventSubscriber />

      {/* Thread Sidebar (collapsible) */}
      <ThreadSidebar
        threads={threads}
        currentThreadId={currentThreadId ?? undefined}
        isLoading={isThreadsLoading}
        isOpen={showThreadSidebar}
        onToggle={() => setShowThreadSidebar(!showThreadSidebar)}
        onSwitchThread={handleSwitchThread}
        onNewThread={handleNewThread}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Messages */}
        <MessageList messages={messages} />

        {/* Suggestions (shown when not streaming and suggestions available) */}
        {!isStreaming && !isPending && suggestionTitles.length > 0 && (
          <Suggestions
            suggestions={suggestionTitles}
            isLoading={isSuggestionsLoading}
            onSelect={handleSuggestionClick}
          />
        )}

        {/* Input */}
        <ChatInput
          disabled={isStreaming || isPending}
          triggerUpload={triggerUpload}
          onUploadTriggered={() => setTriggerUpload(false)}
          value={value}
          setValue={setValue}
          submit={submit}
          isPending={isPending}
          isDisabled={isDisabled}
          isRecording={isRecording}
          transcript={transcript}
          startRecording={startRecording}
          stopRecording={stopRecording}
          transcriptionError={transcriptionError}
          isTranscribing={isTranscribing}
        />
      </div>
    </div>
  );
}
