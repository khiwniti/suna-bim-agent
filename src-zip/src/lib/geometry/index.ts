/**
 * Geometry Module Exports
 *
 * 3D geometry generation from floor plan analysis
 */

export { FloorPlan3DGenerator, getFloorPlan3DGenerator, sceneToThreeJSFormat } from './generator';

export type {
  Scene3D,
  MeshData,
  GeometryData,
  MaterialData,
  GenerationOptions,
  ColorScheme,
  GenerationProgress,
  GenerationCallback,
  LightData,
  CameraData,
} from './types';
