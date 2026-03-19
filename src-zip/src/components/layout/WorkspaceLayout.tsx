'use client';

/**
 * WorkspaceLayout - Viewport-first layout with headless chat overlay
 *
 * Features:
 * - Full-screen 3D viewport (100% width)
 * - Floating chat panel as overlay
 * - Floating analytics/issues drawers (optional)
 * - Mobile-responsive with stacked panels fallback
 */

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
import {
  Building2,
  BarChart3,
  AlertCircle,
  Upload,
  Settings,
  ChevronLeft,
  X,
  MessageSquare,
  Layers,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBIMStore } from '@/stores';
import { useChatStore } from '@/stores/chat-store';
import { usePanelEventSubscriptions } from '@/hooks';
import { FloorPlanUpload } from './FloorPlanUpload';
import { ThatOpenViewer, ThatOpenToolbar, ThatOpenModelTree, ThatOpenPropertiesPanel } from '@/components/viewer';
import { IssuesPanel } from '@/components/issues';
import { TamboChatPanel } from '@/components/chat/tambo';
import { FloatingChatFAB } from '@/components/chat/FloatingChatFAB';
import { FloatingChatPanel } from '@/components/chat/FloatingChatPanel';
import { useTranslation } from '@/i18n/provider';
import type { BIMModel } from '@/types';

interface WorkspaceLayoutProps {
  /** Custom viewport panel (optional - uses ThatOpenViewer by default) */
  viewportPanel?: React.ReactNode;
  /** Analytics panel content */
  analyticsPanel?: React.ReactNode;
  /** Callback when back button is clicked */
  onBackToLanding?: () => void;
  /** Callback when sending chat message */
  onSendMessage?: (message: string) => Promise<void>;
  /** Whether AI is processing */
  isProcessing?: boolean;
  /** Legacy: chatPanel prop for backward compatibility */
  chatPanel?: React.ReactNode;
}

export function WorkspaceLayout({
  viewportPanel,
  analyticsPanel,
  onBackToLanding,
  onSendMessage,
  isProcessing = false,
  chatPanel, // Legacy prop - ignored in new design
}: WorkspaceLayoutProps) {
  const { t } = useTranslation();
  // Subscribe to panel events from chat/agent system
  usePanelEventSubscriptions();

  const [showUpload, setShowUpload] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [showModelTree, setShowModelTree] = useState(false);
  const [showProperties, setShowProperties] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'analytics' | 'issues'>('chat');

  // Chat store for floating panel control
  const {
    isPanelOpen,
    dockPosition,
    unreadCount,
    togglePanel,
    setDockPosition,
  } = useChatStore();

  const setCurrentModel = useBIMStore((state) => state.setCurrentModel);
  const currentModel = useBIMStore((state) => state.currentModel);

  const handleUploadComplete = (model: BIMModel) => {
    setCurrentModel(model);
    setShowUpload(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-screen w-screen flex flex-col overflow-hidden bg-background"
    >
      {/* Top Navigation - Minimal & Transparent */}
      <header className="flex-shrink-0 h-14 bg-card/80 backdrop-blur-sm border-b border-border px-4 flex items-center justify-between z-50">
        {/* Left: Back button and logo */}
        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              title={t('layout.backToHome')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-semibold text-sm">{t('layout.bimAgent')}</span>
            </div>
          </div>
        </div>

        {/* Center: Project selector */}
        <div className="hidden md:flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 hover:bg-secondary rounded-lg transition-colors text-sm">
            <Building2 className="w-3.5 h-3.5" />
            <span className="font-medium">{currentModel?.name || t('layout.demoBuilding')}</span>
            <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          {/* Model Tree toggle */}
          <button
            onClick={() => setShowModelTree(!showModelTree)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showModelTree
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
            title={t('layout.modelTree')}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Properties toggle */}
          <button
            onClick={() => setShowProperties(!showProperties)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showProperties
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
            title={t('layout.properties')}
          >
            <Info className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border mx-0.5" />

          {/* Analytics toggle */}
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showAnalytics
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
            title={t('layout.analytics')}
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {/* Issues toggle */}
          <button
            onClick={() => setShowIssues(!showIssues)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showIssues
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-accent text-muted-foreground hover:text-foreground'
            )}
            title={t('layout.issues')}
          >
            <AlertCircle className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
            title={t('layout.uploadFloorPlan')}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-medium">{t('common.upload')}</span>
          </button>

          <button className="p-2 hover:bg-accent rounded-lg transition-colors" title={t('layout.settings')}>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <FloorPlanUpload
            onClose={() => setShowUpload(false)}
            onComplete={handleUploadComplete}
          />
        )}
      </AnimatePresence>

      {/* Main Content - Full-Screen Viewport */}
      <main className="flex-1 relative overflow-hidden">
        {/* Desktop: Full-screen viewport with floating overlays */}
        <div className="hidden lg:flex lg:flex-col h-full">
          {/* BIM Toolbar */}
          <ThatOpenToolbar className="flex-shrink-0" />

          {/* 3D Viewport - Full Screen */}
          <div className="flex-1 relative">
            {viewportPanel || <ThatOpenViewer className="w-full h-full" />}
          </div>

          {/* Floating Chat Panel (Tambo) */}
          <FloatingChatFAB
            onClick={togglePanel}
            isOpen={isPanelOpen}
            unreadCount={unreadCount}
            position="bottom-center"
          />
          <FloatingChatPanel
            isOpen={isPanelOpen}
            onClose={togglePanel}
            dockPosition={dockPosition}
            onDockPositionChange={setDockPosition}
            title={t('chat.bimAssistant')}
          >
            <TamboChatPanel />
          </FloatingChatPanel>

          {/* Floating Analytics Drawer */}
          <AnimatePresence>
            {showAnalytics && (
              <FloatingDrawer
                title={t('layout.analytics')}
                icon={<BarChart3 className="w-4 h-4" />}
                onClose={() => setShowAnalytics(false)}
                position="left"
              >
                {analyticsPanel || <AnalyticsPlaceholder />}
              </FloatingDrawer>
            )}
          </AnimatePresence>

          {/* Floating Issues Drawer */}
          <AnimatePresence>
            {showIssues && (
              <FloatingDrawer
                title={t('layout.issues')}
                icon={<AlertCircle className="w-4 h-4" />}
                onClose={() => setShowIssues(false)}
                position="left"
              >
                <IssuesPanel />
              </FloatingDrawer>
            )}
          </AnimatePresence>

          {/* Floating Model Tree Drawer */}
          <AnimatePresence>
            {showModelTree && (
              <FloatingDrawer
                title={t('layout.modelTree')}
                icon={<Layers className="w-4 h-4" />}
                onClose={() => setShowModelTree(false)}
                position="left"
              >
                <ThatOpenModelTree
                  className="h-full border-0"
                  onElementSelect={(expressID) => {
                    console.log('[WorkspaceLayout] Element selected:', expressID);
                  }}
                />
              </FloatingDrawer>
            )}
          </AnimatePresence>

          {/* Floating Properties Panel Drawer */}
          <AnimatePresence>
            {showProperties && (
              <FloatingDrawer
                title={t('layout.properties')}
                icon={<Info className="w-4 h-4" />}
                onClose={() => setShowProperties(false)}
                position="right"
              >
                <ThatOpenPropertiesPanel className="h-full border-0" />
              </FloatingDrawer>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile: Stacked panels with tabs */}
        <div className="lg:hidden h-full">
          <PanelGroup direction="vertical" className="h-full">
            {/* 3D Viewport - Top */}
            <Panel defaultSize={35} minSize={25}>
              <div className="h-full flex flex-col">
                <ThatOpenToolbar className="flex-shrink-0" />
                <div className="flex-1">
                  {viewportPanel || <ThatOpenViewer className="w-full h-full" />}
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 transition-colors cursor-row-resize" />

            {/* Chat/Analytics/Issues - Bottom */}
            <Panel defaultSize={65} minSize={45}>
              <div className="h-full flex flex-col">
                {/* Mobile tab bar */}
                <div className="flex border-b border-border bg-card/50">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
                      activeTab === 'chat'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{t('layout.chat')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
                      activeTab === 'analytics'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>{t('layout.analytics')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('issues')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors',
                      activeTab === 'issues'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>{t('layout.issues')}</span>
                  </button>
                </div>

                {/* Tab content - uses HeadlessChat for chat tab */}
                <div className="flex-1 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="h-full"
                    >
                      {activeTab === 'chat' && (
                        <MobileChatPanel />
                      )}
                      {activeTab === 'analytics' && (analyticsPanel || <AnalyticsPlaceholder />)}
                      {activeTab === 'issues' && <IssuesPanel />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </main>
    </motion.div>
  );
}

// ============================================
// Floating Drawer Component
// ============================================

interface FloatingDrawerProps {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  position?: 'left' | 'right';
  children: React.ReactNode;
}

function FloatingDrawer({
  title,
  icon,
  onClose,
  position = 'left',
  children,
}: FloatingDrawerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: position === 'left' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: position === 'left' ? -20 : 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'fixed top-20 bottom-6 w-80 z-30',
        'glass-chat rounded-xl overflow-hidden',
        'flex flex-col',
        position === 'left' ? 'left-4' : 'right-4'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </motion.div>
  );
}

// ============================================
// Mobile Chat Panel (Embedded)
// ============================================

function MobileChatPanel() {
  // On mobile, we use the Tambo chat panel directly
  return <TamboChatPanel />;
}

// ============================================
// Placeholder Components
// ============================================

function AnalyticsPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-background">
      <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center mb-4">
        <BarChart3 className="w-6 h-6 text-accent-foreground" />
      </div>
      <h3 className="text-base font-semibold mb-2">{t('layout.analyticsDashboard')}</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        {t('layout.analyticsDescription')}
      </p>
    </div>
  );
}

export default WorkspaceLayout;
