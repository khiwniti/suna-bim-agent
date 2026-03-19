"use client";

/**
 * WorkspaceLayout
 *
 * Artifact-centric chat platform layout with:
 * - Left: Collapsible sidebar (260px) with navigation, project selector, quick actions
 * - Center: Chat panel (resizable, 25-50%) with Tambo AI - artifact previews inline
 * - Right: Artifact Canvas (remaining %) with tabbed panels
 *
 * Layout structure:
 * ┌──────────────┬────────────────────┬───────────────────────────────────────┐
 * │              │                    │                                       │
 * │   Sidebar    │   Chat Panel       │    Artifact Canvas                    │
 * │   (260px)    │   (resizable)      │    (resizable)                        │
 * │   collapsible│   Tambo AI         │    Carbon/BIM/BOQ/Docs                │
 * │              │                    │                                       │
 * └──────────────┴────────────────────┴───────────────────────────────────────┘
 *
 * SCG Branding: #00a651 (green)
 */

import { useCallback, useState } from "react";
import { usePanelStore } from "@/stores/panel-store";
import { useResizable } from "@/hooks/useResizable";
import { usePanelEventSubscriptions } from "@/hooks/usePanelEventSubscriptions";
import { TabbedPanelArea } from "./TabbedPanelArea";
import { motion, AnimatePresence } from "framer-motion";
import type { PanelId } from "@/lib/panels/types";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Building2,
  Leaf,
  Boxes,
  FileText,
  ClipboardList,
  Award,
  FileCheck,
  BarChart3,
  Wallet,
  Receipt,
  Library,
  Users,
  Settings,
  Upload,
  FileDown,
  MessageSquare,
  LayoutGrid,
  PanelLeft,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TamboChatPanel } from "@/components/chat/tambo";

// Layout modes
type LayoutMode = "split" | "chat" | "artifact";

// Navigation section type
interface NavItem {
  id: string;
  label: string;
  labelTh: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: "default" | "warning";
}

interface NavSection {
  title: string;
  titleTh: string;
  items: NavItem[];
}

// Navigation structure matching the wireframe
// Note: Only some items map to actual panels (PanelId types)
const navigationSections: NavSection[] = [
  {
    title: "Analysis",
    titleTh: "การวิเคราะห์",
    items: [
      { id: "carbon-dashboard", label: "Carbon Analysis", labelTh: "วิเคราะห์คาร์บอน", icon: Leaf },
      { id: "3d-viewer", label: "BIM Viewer", labelTh: "BIM Viewer", icon: Boxes },
      { id: "boq-table", label: "BOQ", labelTh: "BOQ", icon: ClipboardList, badge: 48 },
      { id: "document-editor", label: "Documents", labelTh: "เอกสาร", icon: FileText },
    ],
  },
  {
    title: "Compliance",
    titleTh: "การรับรอง",
    items: [
      { id: "edge", label: "EDGE Certification", labelTh: "EDGE Certification", icon: Award, badge: "Advanced" },
      { id: "tgo", label: "TGO Compliance", labelTh: "TGO Compliance", icon: FileCheck },
      { id: "taxonomy", label: "Thailand Taxonomy", labelTh: "Thailand Taxonomy", icon: BarChart3, badge: "Review", badgeVariant: "warning" },
    ],
  },
  {
    title: "Finance",
    titleTh: "การเงิน",
    items: [
      { id: "green-finance", label: "Green Finance", labelTh: "สินเชื่อสีเขียว", icon: Wallet },
      { id: "carbon-tax", label: "Carbon Tax", labelTh: "ภาษีคาร์บอน", icon: Receipt },
    ],
  },
  {
    title: "Settings",
    titleTh: "ตั้งค่า",
    items: [
      { id: "materials", label: "Material Library", labelTh: "ฐานข้อมูลวัสดุ", icon: Library },
      { id: "team", label: "Team", labelTh: "ทีมงาน", icon: Users },
      { id: "settings", label: "Settings", labelTh: "ตั้งค่า", icon: Settings },
    ],
  },
];

export function WorkspaceLayout() {
  const { chatWidth, setChatWidth, setActiveTab, enableTab } = usePanelStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("split");
  const [language, setLanguage] = useState<"en" | "th">("th");
  const [activeNavId, setActiveNavId] = useState("carbon-dashboard");

  // Subscribe to panel events from chat/agent system
  // This enables artifact cards to communicate with panels via event bus
  usePanelEventSubscriptions();

  // Resizable chat panel
  const { width, isDragging, dragHandleProps } = useResizable({
    initialWidth: chatWidth,
    min: 25,
    max: 50,
    onWidthChange: setChatWidth,
  });

  // Handle navigation item click - opens corresponding panel
  const handleNavClick = useCallback((navId: string) => {
    setActiveNavId(navId);

    // Map nav items to panel IDs - only items that are valid PanelIds
    const validPanelIds: PanelId[] = [
      "carbon-dashboard",
      "3d-viewer",
      "boq-table",
      "document-editor",
      "clash-report",
      "floorplan-viewer",
    ];

    if (validPanelIds.includes(navId as PanelId)) {
      enableTab(navId as PanelId);
      setActiveTab(navId as PanelId);
    }
  }, [enableTab, setActiveTab]);

  // Handler to focus chat input when "Ask Agent" is clicked
  const handleAskAgentClick = useCallback(() => {
    const chatInput = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="chat-input"], textarea[placeholder*="message"], textarea[placeholder*="Message"]'
    );
    if (chatInput) {
      chatInput.focus();
      chatInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // Handler for file upload click
  const handleUploadClick = useCallback(() => {
    console.log("Upload clicked - trigger file upload dialog");
  }, []);

  const t = (en: string, th: string) => (language === "th" ? th : en);

  const panelWidth = 100 - width;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* SIDEBAR (LEFT - COLLAPSIBLE) */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 60 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="shrink-0 h-full bg-card border-r flex flex-col z-50"
      >
        {/* Sidebar Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold bg-primary"
            >
              BIM
            </div>
            {!sidebarCollapsed && (
              <span className="font-semibold text-sm">
                Carbon<span className="text-primary">AI</span>
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Project Selector */}
        <div className="p-3 border-b">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted hover:bg-muted/80 cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white bg-primary">
              <Building2 className="h-4 w-4" />
            </div>
            {!sidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">SCG Office Tower</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <span>Bangkok</span>
                    <span>•</span>
                    <span>42,500 m²</span>
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navigationSections.map((section) => (
            <div key={section.title} className="mb-4">
              {!sidebarCollapsed && (
                <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t(section.title, section.titleTh)}
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={cn(
                      "w-full flex items-center px-4 py-2.5 text-sm transition-all border-l-[3px]",
                      activeNavId === item.id
                        ? "bg-primary/10 text-primary border-l-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground border-l-transparent"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", sidebarCollapsed ? "mx-auto" : "mr-3")} />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left">{t(item.label, item.labelTh)}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "px-2 py-0.5 text-[10px] font-semibold rounded-full text-white",
                              item.badgeVariant === "warning" ? "bg-amber-500" : "bg-primary"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Quick Actions */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t space-y-2">
            <Button
              className="w-full justify-center gap-2"
              onClick={handleUploadClick}
            >
              <FileDown className="h-4 w-4" />
              {t("Export Report", "ส่งออกรายงาน")}
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center gap-2"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4" />
              {t("Upload IFC", "อัปโหลด IFC")}
            </Button>
          </div>
        )}

        {/* User Profile */}
        <div className="p-3 border-t">
          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
              KH
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Khiwn T.</p>
                <p className="text-xs text-muted-foreground">Project Manager</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-5 bg-card border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span className="font-semibold">{t("AI Assistant", "AI Assistant")}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Layout Controls */}
            <div className="flex bg-muted p-1 rounded-lg">
              <Button
                variant={layoutMode === "split" ? "default" : "ghost"}
                size="sm"
                className="px-3 py-1.5 text-sm rounded-md"
                onClick={() => setLayoutMode("split")}
              >
                <LayoutGrid className="h-4 w-4 mr-1" />
                Split
              </Button>
              <Button
                variant={layoutMode === "chat" ? "default" : "ghost"}
                size="sm"
                className="px-3 py-1.5 text-sm rounded-md"
                onClick={() => setLayoutMode("chat")}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
              </Button>
              <Button
                variant={layoutMode === "artifact" ? "default" : "ghost"}
                size="sm"
                className="px-3 py-1.5 text-sm rounded-md"
                onClick={() => setLayoutMode("artifact")}
              >
                <PanelLeft className="h-4 w-4 mr-1" />
                Artifact
              </Button>
            </div>

            {/* Language Toggle */}
            <div className="flex bg-muted rounded-md overflow-hidden">
              <button
                className={cn(
                  "px-3 py-1.5 text-sm transition-all",
                  language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setLanguage("en")}
              >
                EN
              </button>
              <button
                className={cn(
                  "px-3 py-1.5 text-sm transition-all",
                  language === "th" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setLanguage("th")}
              >
                TH
              </button>
            </div>
          </div>
        </header>

        {/* Main Container - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat Panel */}
          <AnimatePresence mode="wait">
            {(layoutMode === "split" || layoutMode === "chat") && (
              <motion.div
                data-testid="chat-panel"
                className="relative flex flex-col h-full overflow-hidden"
                initial={{ width: 0, opacity: 0 }}
                animate={{
                  width: layoutMode === "chat" ? "100%" : width + "%",
                  opacity: 1
                }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: isDragging ? 0 : 0.3, ease: "easeInOut" }}
                style={{ width: layoutMode === "chat" ? "100%" : width + "%" }}
              >
                <TamboChatPanel />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resize Handle (between chat and panel) - only in split mode */}
          {layoutMode === "split" && (
            <div
              {...dragHandleProps}
              data-testid="resize-handle"
              className={cn(
                "relative shrink-0 w-1 cursor-col-resize",
                "group hover:bg-primary active:bg-primary/80",
                "transition-colors flex items-center justify-center",
                isDragging ? "bg-primary" : "bg-border"
              )}
            >
              <div
                className={cn(
                  "absolute -ml-2 w-5 h-12 flex items-center justify-center",
                  "opacity-0 group-hover:opacity-100 transition-opacity",
                  isDragging ? "opacity-100" : ""
                )}
              >
                <GripVertical className="w-4 h-4 text-primary" aria-hidden="true" />
              </div>
            </div>
          )}

          {/* Artifact Canvas / Panel Area */}
          <AnimatePresence mode="wait">
            {(layoutMode === "split" || layoutMode === "artifact") && (
              <motion.div
                data-testid="panel-area"
                className="relative flex flex-col h-full overflow-hidden bg-background"
                initial={{ width: 0, opacity: 0 }}
                animate={{
                  width: layoutMode === "artifact" ? "100%" : panelWidth + "%",
                  opacity: 1
                }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: isDragging ? 0 : 0.3, ease: "easeInOut" }}
                style={{ width: layoutMode === "artifact" ? "100%" : panelWidth + "%" }}
              >
                <TabbedPanelArea
                  onUploadClick={handleUploadClick}
                  onAskAgentClick={handleAskAgentClick}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Drag overlay to prevent text selection during resize */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50 cursor-col-resize"
          style={{ userSelect: "none" }}
        />
      )}
    </div>
  );
}
