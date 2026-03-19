export type PanelId =
  | '3d-viewer'
  | 'boq-table'
  | 'carbon-dashboard'
  | 'clash-report'
  | 'floorplan-viewer'
  | 'document-editor';

export type PanelLifecycle = 'active' | 'recent' | 'inactive';

export interface Panel {
  id: PanelId;
  title: string;
  icon: string;
  defaultHeight: number;
  minHeight: number;
  maxHeight: number;
  lifecycle: PanelLifecycle;
}

export interface PanelData {
  state: any;
  lastActive: number;
  isDirty: boolean;
}

export interface PanelContext {
  userMessage: string;
  uploadedFiles?: File[];
  aiToolCall?: string;
  recentMessages?: string[];
  currentPanelId?: PanelId | null;
}
