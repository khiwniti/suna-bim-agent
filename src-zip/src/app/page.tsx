'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LandingPage } from '@/components/landing';
import { WorkspaceLayout } from '@/components/layout';
import { WorkspaceChatPanel } from '@/components/chat';
import { AnalyticsDashboard } from '@/components/analytics';
import { useAuth } from '@/hooks/useAuth';
import { useCSRFHeaders, ensureCSRFToken } from '@/hooks/useCSRF';
import { useChatStore, useBIMStore } from '@/stores';
import { nanoid, customAlphabet } from 'nanoid';
import type { BIMElement } from '@/types/bim';

// Generate IDs for messages
const generateId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

/**
 * Build element quantities by type for carbon analysis
 * Groups elements by IFC type and calculates volumes/areas from geometry
 */
function buildElementQuantities(elements: BIMElement[]): Record<string, { count: number; volume?: number; area?: number; material?: string }> {
  const quantities: Record<string, { count: number; volume?: number; area?: number; material?: string }> = {};

  for (const el of elements) {
    const ifcType = mapToIfcType(el.type);
    if (!quantities[ifcType]) {
      quantities[ifcType] = { count: 0, volume: 0, area: 0 };
    }

    quantities[ifcType].count += 1;

    // Extract volume from geometry bounding box if available
    if (el.geometry?.boundingBox) {
      const { min, max } = el.geometry.boundingBox;
      const volume = Math.abs((max.x - min.x) * (max.y - min.y) * (max.z - min.z));
      quantities[ifcType].volume = (quantities[ifcType].volume || 0) + volume;
    }

    // Extract material if available
    if (el.material && !quantities[ifcType].material) {
      quantities[ifcType].material = el.material;
    }

    // Use property-based quantities if available
    const props = el.properties;
    if (props.volume) quantities[ifcType].volume = (quantities[ifcType].volume || 0) + Number(props.volume);
    if (props.area) quantities[ifcType].area = (quantities[ifcType].area || 0) + Number(props.area);
  }

  return quantities;
}

/**
 * Build materials summary for sustainability analysis
 */
function buildMaterialsSummary(elements: BIMElement[]): Record<string, { count: number; volume?: number }> {
  const materials: Record<string, { count: number; volume?: number }> = {};

  for (const el of elements) {
    const material = el.material || el.properties.material as string || 'Unknown';
    if (!materials[material]) {
      materials[material] = { count: 0, volume: 0 };
    }
    materials[material].count += 1;

    // Add volume if available
    if (el.geometry?.boundingBox) {
      const { min, max } = el.geometry.boundingBox;
      const volume = Math.abs((max.x - min.x) * (max.y - min.y) * (max.z - min.z));
      materials[material].volume = (materials[material].volume || 0) + volume;
    }
  }

  return materials;
}

/**
 * Map internal element type to IFC type naming convention
 */
function mapToIfcType(type: string): string {
  const mapping: Record<string, string> = {
    wall: 'IfcWall',
    door: 'IfcDoor',
    window: 'IfcWindow',
    slab: 'IfcSlab',
    roof: 'IfcRoof',
    stair: 'IfcStair',
    column: 'IfcColumn',
    beam: 'IfcBeam',
    furniture: 'IfcFurnishingElement',
    equipment: 'IfcBuildingElementProxy',
    space: 'IfcSpace',
    zone: 'IfcZone',
    hvac: 'IfcFlowTerminal',
    pipe: 'IfcPipeSegment',
    duct: 'IfcDuctSegment',
    other: 'IfcBuildingElement',
  };
  return mapping[type] || `Ifc${type.charAt(0).toUpperCase()}${type.slice(1)}`;
}

// Dynamic import for ThatOpenViewer (Professional BIM viewer with That Open components)
// Using ssr: false requires suppressHydrationWarning to avoid React Error #418
const ThatOpenViewer = dynamic(
  () => import('@/components/viewer/ThatOpenViewer').then(m => ({ default: m.ThatOpenViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading 3D Viewer...</span>
        </div>
      </div>
    ),
  }
);

type AppView = 'landing' | 'workspace';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const csrfHeaders = useCSRFHeaders();
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [showUploadOnWorkspace, setShowUploadOnWorkspace] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [anonymousSessionId, setAnonymousSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Ref to track pending initial message processing
  const initialMessageProcessedRef = useRef(false);

  // Initialize CSRF token on mount
  useEffect(() => {
    ensureCSRFToken();
  }, []);

  // Check for anonymous session on mount or create one for non-authenticated users
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let sessionId = localStorage.getItem('anonymousSessionId');

      // If no session and no user, create anonymous session automatically
      if (!sessionId && !user && !loading) {
        sessionId = `anon_${nanoid()}`;
        localStorage.setItem('anonymousSessionId', sessionId);
      }

      if (sessionId) {
        setAnonymousSessionId(sessionId);
        setIsAnonymous(!user);
      }
    }
  }, [user, loading]);

  const handleStartChat = useCallback((initialMessage: string) => {
    // Store the initial message for the chat page to pick up
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pendingChatMessage', initialMessage);
    }

    // Redirect to the full-screen chat page (ChatGPT/Claude-like UI)
    router.push('/chat');
  }, [router]);

  const handleUploadFloorPlan = useCallback(() => {
    // Allow if user is authenticated OR has anonymous session
    if (!user && !anonymousSessionId) {
      router.push('/auth/login?redirect=/chat&action=upload');
      return;
    }

    // Set flag for /chat page to trigger upload dialog
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pendingUploadAction', 'true');
    }

    // Redirect to the full-screen chat page (same as handleStartChat)
    router.push('/chat');
  }, [user, anonymousSessionId, router]);

  // Handle resuming after login redirect
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const pendingMessage = sessionStorage.getItem('pendingChatMessage');
      if (pendingMessage) {
        sessionStorage.removeItem('pendingChatMessage');
        useChatStore.getState().setPendingInitialMessage(pendingMessage);
        setCurrentView('workspace');
      }
    }
  }, [user]);

  const handleBackToLanding = useCallback(() => {
    setCurrentView('landing');
    setShowUploadOnWorkspace(false);
  }, []);

  /**
   * Send message to AI chat API with SSE streaming
   * This connects HeadlessChat to the backend chat endpoint
   */
  const handleSendMessage = useCallback(async (content: string): Promise<void> => {
    const canChat = !!user || !!anonymousSessionId;
    if (!canChat) return;

    setIsProcessing(true);

    // Create assistant message placeholder
    const assistantMessageId = generateId();
    let assistantContent = '';

    try {
      // Build project context from current model
      const currentModel = useBIMStore.getState().currentModel;
      const selectedElements = useBIMStore.getState().selection.selectedIds;

      const projectContext = currentModel ? {
        modelId: currentModel.id,
        modelName: currentModel.name,
        totalArea: currentModel.metadata.totalArea || 0,
        totalVolume: currentModel.metadata.totalVolume || 0,
        floors: currentModel.levels.map(level => ({
          id: level.id,
          name: level.name,
          level: level.elevation,
          area: 0,
        })),
        selectedElements,
        elementCount: currentModel.elements.length,
        elementTypes: Object.entries(
          currentModel.elements.reduce((acc, el) => {
            acc[el.type] = (acc[el.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        ).map(([type, count]) => ({ type, count })),
        // Enhanced: Include element quantities for carbon analysis
        elementQuantities: buildElementQuantities(currentModel.elements),
        // Enhanced: Include materials summary
        materials: buildMaterialsSummary(currentModel.elements),
        source: currentModel.source,
        // Include sustainability data if available
        sustainability: currentModel.sustainability,
      } : null;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders,
        },
        body: JSON.stringify({
          message: content,
          conversationId,
          anonymousSessionId: isAnonymous ? anonymousSessionId : undefined,
          projectContext,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please refresh the page.');
        }
        throw new Error('Failed to send message');
      }

      // Handle SSE streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response stream');

      // Add placeholder message for assistant response
      useChatStore.getState().addMessage({
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'token':
                  assistantContent += data.content;
                  // Update message in store
                  useChatStore.getState().updateMessage(assistantMessageId, {
                    content: assistantContent,
                  });
                  break;

                case 'done':
                  if (data.conversationId) {
                    setConversationId(data.conversationId);
                  }
                  break;

                case 'ui_command':
                  // Execute UI commands from the agent
                  if (data.command) {
                    const command = data.command;

                    // Handle analytics updates separately
                    if (command.type === 'updateAnalytics') {
                      useBIMStore.getState().setAnalyticsData({
                        sustainabilityAnalysis: command.data?.content || null,
                      });
                    } else {
                      // All other commands go to the viewport
                      useBIMStore.getState().addPendingCommand(command);
                    }
                  }
                  break;

                case 'error':
                  throw new Error(data.message);
              }
            } catch {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (err) {
      // Add error message
      useChatStore.getState().addMessage({
        id: generateId(),
        role: 'assistant',
        content: `⚠️ ${err instanceof Error ? err.message : 'An error occurred while processing your request.'}`,
        timestamp: new Date(),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [user, anonymousSessionId, conversationId, isAnonymous, csrfHeaders]);

  /**
   * Process pending initial message from landing page
   */
  useEffect(() => {
    if (currentView !== 'workspace' || initialMessageProcessedRef.current) return;

    const pendingMessage = useChatStore.getState().pendingInitialMessage;
    const canChat = !!user || !!anonymousSessionId;

    if (pendingMessage && canChat) {
      initialMessageProcessedRef.current = true;
      // Clear the pending message immediately to prevent re-processing
      useChatStore.getState().clearPendingInitialMessage();
      // Send the message
      handleSendMessage(pendingMessage);
    }
  }, [currentView, user, anonymousSessionId, handleSendMessage]);

  /**
   * Handle when an IFC model is loaded in the viewer
   * Notifies the chat so the AI can reference the loaded model
   */
  const handleModelLoaded = useCallback((modelId: string) => {
    const model = useBIMStore.getState().currentModel;
    if (!model) return;

    // Generate element type summary
    const elementsByType: Record<string, number> = {};
    for (const el of model.elements) {
      elementsByType[el.type] = (elementsByType[el.type] || 0) + 1;
    }
    const typeList = Object.entries(elementsByType)
      .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
      .join(', ');

    const elementCount = model.elements.length;

    // Add system message to chat
    useChatStore.getState().addMessage({
      id: nanoid(),
      role: 'assistant',
      content: `🏗️ **IFC Model Loaded: ${model.name}**

I've loaded your BIM model into the 3D viewer. Here's what I found:

📊 **Model Summary:**
- **Elements:** ${elementCount} total${typeList ? ` (${typeList})` : ''}
- **Levels:** ${model.levels.length}
- **Source:** IFC file

The model is now displayed in the 3D viewport. I can help you:
- **Analyze** specific building elements
- **Calculate** sustainability metrics
- **Identify** MEP systems and clashes
- **Generate** reports and BCF issues

What would you like to know about this model?`,
      timestamp: new Date(),
      metadata: {
        elementRefs: model.elements.map(e => e.id),
      },
    });
  }, []);

  // Show loading state while checking auth
  if (loading && currentView === 'workspace') {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  // Redirect to login if trying to access workspace without auth or anonymous session
  if (!user && !anonymousSessionId && currentView === 'workspace') {
    router.push('/auth/login?redirect=/');
    return null;
  }

  return (
    <AnimatePresence mode="wait">
      {currentView === 'landing' ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <LandingPage onStartChat={handleStartChat} onUploadFloorPlan={handleUploadFloorPlan} />
        </motion.div>
      ) : (
        <motion.div
          key="workspace"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-screen w-screen overflow-hidden"
          suppressHydrationWarning
        >
          <WorkspaceLayout
            viewportPanel={
              <ThatOpenViewer
                className="w-full h-full"
                onModelLoaded={handleModelLoaded}
              />
            }
            chatPanel={
              <WorkspaceChatPanel
                initialShowUpload={showUploadOnWorkspace}
                anonymousSessionId={anonymousSessionId ?? undefined}
              />
            }
            analyticsPanel={<AnalyticsDashboard />}
            onBackToLanding={handleBackToLanding}
            onSendMessage={handleSendMessage}
            isProcessing={isProcessing}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
