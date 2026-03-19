/**
 * BIM Viewer Components
 *
 * Two viewer options available:
 *
 * 1. XeokitViewer (xeokit-sdk) - DEPRECATED
 *    - Handles 10M+ elements with GPU-optimized rendering
 *    - Native XKT format support
 *    - AGPL license
 *
 * 2. ThatOpenViewer (@thatopen/components) - RECOMMENDED
 *    - Revit-like UI experience
 *    - MIT license (commercial-friendly)
 *    - Better IFC property access for carbon analysis
 */

// That Open Viewer - New recommended viewer
export { ThatOpenViewer } from './ThatOpenViewer';
export { ThatOpenToolbar } from './ThatOpenToolbar';
export { ThatOpenPropertiesPanel } from './ThatOpenPropertiesPanel';
export { ThatOpenModelTree } from './ThatOpenModelTree';

// Legacy xeokit viewer - Keep for fallback
export { XeokitViewer } from './XeokitViewer';
export { XeokitViewer as default } from './XeokitViewer';

// Supporting components
export { BIMToolbar } from './BIMToolbar';
export { ModelTree } from './ModelTree';
export { SpatialTree, type SpatialNode, type SpatialTreeProps } from './SpatialTree';
export { ViewCube, ViewCubeCanvas, type ViewCubeProps, type ViewCubeCanvasProps } from './ViewCube';
export {
  NavigationControls,
  CompactNavigationBar,
  type NavigationControlsProps,
  type CompactNavigationBarProps,
  type NavigationMode,
} from './NavigationControls';
export { PropertiesPanel, type PropertiesPanelProps } from './PropertiesPanel';
export {
  ViewerErrorBoundary,
  withViewerErrorBoundary,
} from './ViewerErrorBoundary';

// Legacy exports - deprecated, use XeokitViewer instead
// export { IFCViewer } from './IFCViewer';
// export { HybridBIMViewer } from './HybridBIMViewer';
