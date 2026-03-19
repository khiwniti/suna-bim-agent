'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';
import {
  Building2,
  MessageSquare,
  BarChart3,
  Upload,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBIMStore } from '@/stores';
import { FloorPlanUpload } from './FloorPlanUpload';
import { useTranslation } from '@/i18n/provider';
import type { BIMModel } from '@/types';

interface MainLayoutProps {
  viewportPanel: React.ReactNode;
  chatPanel: React.ReactNode;
  analyticsPanel?: React.ReactNode;
}

export function MainLayout({
  viewportPanel,
  chatPanel,
  analyticsPanel,
}: MainLayoutProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'chat' | 'analytics'>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const setCurrentModel = useBIMStore((state) => state.setCurrentModel);
  const currentModel = useBIMStore((state) => state.currentModel);

  const handleUploadComplete = (model: BIMModel) => {
    setCurrentModel(model);
    setShowUpload(false);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="flex-shrink-0 h-16 bg-card border-b border-border px-4 flex items-center justify-between z-50">
        {/* Left: Logo and title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg leading-tight">{t('layout.bimAgent')}</h1>
              <p className="text-xs text-muted-foreground">{t('layout.buildingIntelligence')}</p>
            </div>
          </div>
        </div>

        {/* Center: Project selector */}
        <div className="hidden md:flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
            <Building2 className="w-4 h-4" />
            <span className="font-medium">{currentModel?.name || t('layout.demoBuilding')}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            title="Upload Floor Plan"
          >
            <Upload className="w-5 h-5" />
            <span className="hidden sm:inline font-medium">{t('common.upload')}</span>
          </button>
          <button className="p-2.5 hover:bg-accent rounded-lg transition-colors" title="Settings">
            <Settings className="w-5 h-5" />
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

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile tab bar */}
        <div className="lg:hidden flex border-b border-border bg-card">
          <button
            onClick={() => setActiveTab('chat')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-colors',
              activeTab === 'chat'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            )}
          >
            <MessageSquare className="w-5 h-5" />
            <span>{t('layout.chat')}</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-colors',
              activeTab === 'analytics'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground'
            )}
          >
            <BarChart3 className="w-5 h-5" />
            <span>{t('layout.analytics')}</span>
          </button>
        </div>

        {/* Desktop: Split panels */}
        <div className="hidden lg:block h-full">
          <PanelGroup direction="horizontal" className="h-full">
            {/* 3D Viewport - 60% */}
            <Panel defaultSize={60} minSize={40} maxSize={75}>
              <div className="h-full">{viewportPanel}</div>
            </Panel>

            {/* Resize handle */}
            <PanelResizeHandle className="w-1.5 bg-border hover:bg-primary transition-colors cursor-col-resize" />

            {/* Right Panel - 40% */}
            <Panel defaultSize={40} minSize={25} maxSize={50}>
              <div className="h-full flex flex-col">
                {/* Tab switcher */}
                <div className="flex-shrink-0 flex border-b border-border bg-card">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-colors',
                      activeTab === 'chat'
                        ? 'text-primary border-b-2 border-primary bg-accent/30'
                        : 'text-muted-foreground hover:bg-accent/20'
                    )}
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>{t('layout.aiChat')}</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 font-medium transition-colors',
                      activeTab === 'analytics'
                        ? 'text-primary border-b-2 border-primary bg-accent/30'
                        : 'text-muted-foreground hover:bg-accent/20'
                    )}
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Analytics</span>
                  </button>
                </div>

                {/* Panel content */}
                <div className="flex-1 overflow-hidden">
                  {activeTab === 'chat' ? chatPanel : analyticsPanel || <AnalyticsPlaceholder />}
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </div>

        {/* Mobile: Single panel */}
        <div className="lg:hidden h-full">
          <PanelGroup direction="vertical" className="h-full">
            {/* 3D Viewport - Top */}
            <Panel defaultSize={40} minSize={30}>
              <div className="h-full">{viewportPanel}</div>
            </Panel>

            <PanelResizeHandle className="h-1.5 bg-border hover:bg-primary transition-colors cursor-row-resize" />

            {/* Chat/Analytics - Bottom */}
            <Panel defaultSize={60} minSize={40}>
              <div className="h-full overflow-hidden">
                {activeTab === 'chat' ? chatPanel : analyticsPanel || <AnalyticsPlaceholder />}
              </div>
            </Panel>
          </PanelGroup>
        </div>
      </div>
    </div>
  );
}

function AnalyticsPlaceholder() {
  const { t } = useTranslation();

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-background">
      <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
        <BarChart3 className="w-8 h-8 text-accent-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{t('layout.analyticsDashboard')}</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        {t('layout.analyticsDescription')}
      </p>
    </div>
  );
}

export default MainLayout;
