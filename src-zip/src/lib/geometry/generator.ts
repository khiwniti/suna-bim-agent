/**
 * 3D Geometry Generator
 *
 * Converts FloorPlanAnalysis into Three.js-compatible geometry data
 * for rendering in React Three Fiber
 */

import { nanoid } from 'nanoid';
import type { FloorPlanAnalysis, Wall, Opening, Room } from '../vision/types';
import type {
  Scene3D,
  MeshData,
  GeometryData,
  MaterialData,
  GenerationOptions,
  ColorScheme,
  GenerationProgress,
  GenerationCallback,
} from './types';

// ============================================
// Default Options
// ============================================

const DEFAULT_COLOR_SCHEME: ColorScheme = {
  exteriorWall: '#4a5568', // Gray-600
  interiorWall: '#718096', // Gray-500
  partition: '#a0aec0', // Gray-400
  floor: '#e2e8f0', // Gray-200
  ceiling: '#f7fafc', // Gray-50
  door: '#805ad5', // Purple-500
  window: '#63b3ed', // Blue-400
  roomLabels: {
    bedroom: '#10b981', // Emerald
    bathroom: '#3b82f6', // Blue
    kitchen: '#f59e0b', // Amber
    living: '#8b5cf6', // Violet
    dining: '#ec4899', // Pink
    office: '#6366f1', // Indigo
    hallway: '#6b7280', // Gray
    closet: '#9ca3af', // Gray
    balcony: '#22c55e', // Green
    elevator: '#ef4444', // Red
    stairs: '#f97316', // Orange
    storage: '#78716c', // Stone
    utility: '#64748b', // Slate
    unknown: '#94a3b8', // Slate
  },
};

const DEFAULT_OPTIONS: GenerationOptions = {
  wallHeight: 2.8,
  wallThickness: 0.15,
  floorThickness: 0.1,
  doorHeight: 2.1,
  windowHeight: 1.2,
  windowSillHeight: 0.9,
  generateFloor: true,
  generateCeiling: false,
  generateLabels: true,
  colorScheme: DEFAULT_COLOR_SCHEME,
};

// ============================================
// Main Generator Class
// ============================================

export class FloorPlan3DGenerator {
  private options: GenerationOptions;
  private onProgress?: GenerationCallback;

  constructor(options?: Partial<GenerationOptions>) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Set progress callback for real-time updates
   */
  setProgressCallback(callback: GenerationCallback) {
    this.onProgress = callback;
  }

  /**
   * Generate 3D scene from floor plan analysis
   */
  async generate(analysis: FloorPlanAnalysis): Promise<Scene3D> {
    const sceneId = nanoid();
    const meshes: MeshData[] = [];

    // Calculate bounding box
    const boundingBox = this.calculateBoundingBox(analysis);

    // Step 1: Generate walls
    this.reportProgress('walls', 0, 'Starting wall generation', analysis.walls.length, 0);
    const wallMeshes = await this.generateWalls(analysis.walls, analysis.openings);
    meshes.push(...wallMeshes);

    // Step 2: Generate floor
    if (this.options.generateFloor) {
      this.reportProgress('floors', 50, 'Generating floor', 1, 0);
      const floorMesh = this.generateFloor(analysis.rooms, boundingBox);
      if (floorMesh) meshes.push(floorMesh);
    }

    // Step 3: Generate room labels
    if (this.options.generateLabels) {
      this.reportProgress('labels', 75, 'Generating labels', analysis.rooms.length, 0);
      const labelMeshes = this.generateRoomLabels(analysis.rooms);
      meshes.push(...labelMeshes);
    }

    this.reportProgress('complete', 100, 'Generation complete', meshes.length, meshes.length);

    return {
      id: sceneId,
      meshes,
      lights: this.getDefaultLights(boundingBox),
      camera: this.getDefaultCamera(boundingBox),
      boundingBox: {
        min: { x: boundingBox.minX, y: 0, z: boundingBox.minY },
        max: { x: boundingBox.maxX, y: this.options.wallHeight, z: boundingBox.maxY },
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        sourceAnalysisId: analysis.id,
        totalWalls: analysis.walls.length,
        totalRooms: analysis.rooms.length,
        totalOpenings: analysis.openings.length,
        floorArea: this.calculateTotalArea(analysis.rooms),
        wallHeight: this.options.wallHeight,
      },
    };
  }

  /**
   * Generate wall meshes with openings (doors/windows)
   */
  private async generateWalls(walls: Wall[], openings: Opening[]): Promise<MeshData[]> {
    const meshes: MeshData[] = [];

    for (let i = 0; i < walls.length; i++) {
      const wall = walls[i];
      this.reportProgress('walls', (i / walls.length) * 50, `Processing wall ${wall.id}`, walls.length, i);

      // Find openings in this wall
      const wallOpenings = openings.filter((o) => o.wallId === wall.id);

      // Generate wall mesh
      const wallMesh = this.generateWallMesh(wall, wallOpenings);
      meshes.push(wallMesh);

      // Generate opening frames
      for (const opening of wallOpenings) {
        const openingMesh = this.generateOpeningMesh(opening, wall);
        meshes.push(openingMesh);
      }
    }

    return meshes;
  }

  /**
   * Generate single wall mesh
   */
  private generateWallMesh(wall: Wall, openings: Opening[]): MeshData {
    // Calculate wall length and angle
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    // Wall center position
    const centerX = (wall.start.x + wall.end.x) / 2;
    const centerY = (wall.start.y + wall.end.y) / 2;

    // Get wall color based on type
    const color = this.getWallColor(wall.type);

    // Create geometry - simple box for walls without openings
    // For walls with openings, we'd need CSG operations in Three.js
    const geometry: GeometryData = {
      type: 'box',
      width: length,
      height: this.options.wallHeight,
      depth: wall.thickness || this.options.wallThickness,
    };

    const material: MaterialData = {
      type: 'standard',
      color,
      opacity: openings.length > 0 ? 0.9 : 1.0,
      transparent: openings.length > 0,
      roughness: 0.8,
      metalness: 0.1,
    };

    return {
      id: `mesh_${wall.id}`,
      type: 'wall',
      geometry,
      material,
      position: [centerX, this.options.wallHeight / 2, centerY],
      rotation: [0, -angle, 0],
      scale: [1, 1, 1],
      userData: {
        wallId: wall.id,
        wallType: wall.type,
        length,
        openingIds: openings.map((o) => o.id),
      },
    };
  }

  /**
   * Generate opening mesh (door or window)
   */
  private generateOpeningMesh(opening: Opening, wall: Wall): MeshData {
    const isDoor = opening.type === 'door';
    const height = isDoor ? this.options.doorHeight : this.options.windowHeight;
    const yOffset = isDoor ? height / 2 : this.options.windowSillHeight + height / 2;

    // Calculate wall angle for opening orientation
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const angle = Math.atan2(dy, dx);

    const color = isDoor ? this.options.colorScheme.door : this.options.colorScheme.window;

    const geometry: GeometryData = {
      type: 'box',
      width: opening.width,
      height: height,
      depth: (wall.thickness || this.options.wallThickness) + 0.02, // Slightly deeper to cut through wall
    };

    const material: MaterialData = {
      type: 'standard',
      color,
      opacity: isDoor ? 0.7 : 0.3,
      transparent: true,
      roughness: 0.2,
      metalness: isDoor ? 0.3 : 0.1,
    };

    return {
      id: `mesh_${opening.id}`,
      type: isDoor ? 'door' : 'window',
      geometry,
      material,
      position: [opening.position.x, yOffset, opening.position.y],
      rotation: [0, -angle, 0],
      scale: [1, 1, 1],
      userData: {
        openingId: opening.id,
        openingType: opening.type,
        swingDirection: opening.swingDirection,
        wallId: opening.wallId,
      },
    };
  }

  /**
   * Generate floor mesh from room polygons
   */
  private generateFloor(rooms: Room[], boundingBox: BoundingBox): MeshData {
    // Simple floor covering entire bounding box
    const width = boundingBox.maxX - boundingBox.minX;
    const depth = boundingBox.maxY - boundingBox.minY;
    const centerX = (boundingBox.minX + boundingBox.maxX) / 2;
    const centerZ = (boundingBox.minY + boundingBox.maxY) / 2;

    return {
      id: 'floor_main',
      type: 'floor',
      geometry: {
        type: 'box',
        width: width + 0.5, // Slight padding
        height: this.options.floorThickness,
        depth: depth + 0.5,
      },
      material: {
        type: 'standard',
        color: this.options.colorScheme.floor,
        opacity: 1.0,
        transparent: false,
        roughness: 0.9,
        metalness: 0.0,
      },
      position: [centerX, -this.options.floorThickness / 2, centerZ],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      userData: {
        roomIds: rooms.map((r) => r.id),
      },
    };
  }

  /**
   * Generate room label meshes
   */
  private generateRoomLabels(rooms: Room[]): MeshData[] {
    return rooms.map((room, index) => {
      this.reportProgress('labels', 75 + (index / rooms.length) * 20, `Labeling ${room.type}`, rooms.length, index);

      const color = this.options.colorScheme.roomLabels[room.type] || this.options.colorScheme.roomLabels.unknown;

      return {
        id: `label_${room.id}`,
        type: 'room_label',
        geometry: {
          type: 'plane',
          width: 1,
          height: 0.3,
        },
        material: {
          type: 'basic',
          color,
          opacity: 0.9,
          transparent: true,
          side: 'double',
        },
        position: [room.centroid.x, 0.1, room.centroid.y],
        rotation: [-Math.PI / 2, 0, 0],
        scale: [1, 1, 1],
        userData: {
          roomId: room.id,
          roomType: room.type,
          area: room.areaSquareMeters,
          label: room.label || this.formatRoomType(room.type),
        },
      };
    });
  }

  /**
   * Get wall color based on type
   */
  private getWallColor(type: Wall['type']): string {
    switch (type) {
      case 'exterior':
        return this.options.colorScheme.exteriorWall;
      case 'interior':
        return this.options.colorScheme.interiorWall;
      case 'partition':
        return this.options.colorScheme.partition;
      default:
        return this.options.colorScheme.interiorWall;
    }
  }

  /**
   * Calculate bounding box from analysis
   */
  private calculateBoundingBox(analysis: FloorPlanAnalysis): BoundingBox {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    // From walls
    for (const wall of analysis.walls) {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minY = Math.min(minY, wall.start.y, wall.end.y);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      maxY = Math.max(maxY, wall.start.y, wall.end.y);
    }

    // From rooms
    for (const room of analysis.rooms) {
      for (const point of room.polygon) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    }

    // Handle empty case
    if (minX === Infinity) {
      return { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    }

    return { minX, minY, maxX, maxY };
  }

  /**
   * Calculate total floor area
   */
  private calculateTotalArea(rooms: Room[]): number {
    return rooms.reduce((sum, room) => sum + room.areaSquareMeters, 0);
  }

  /**
   * Get default lighting setup
   */
  private getDefaultLights(boundingBox: BoundingBox) {
    const centerX = (boundingBox.minX + boundingBox.maxX) / 2;
    const centerZ = (boundingBox.minY + boundingBox.maxY) / 2;

    return [
      {
        type: 'ambient' as const,
        color: '#ffffff',
        intensity: 0.6,
      },
      {
        type: 'directional' as const,
        color: '#ffffff',
        intensity: 0.8,
        position: [centerX + 10, 15, centerZ + 10] as [number, number, number],
        target: [centerX, 0, centerZ] as [number, number, number],
      },
      {
        type: 'directional' as const,
        color: '#e0e7ff',
        intensity: 0.4,
        position: [centerX - 10, 10, centerZ - 10] as [number, number, number],
        target: [centerX, 0, centerZ] as [number, number, number],
      },
    ];
  }

  /**
   * Get default camera setup
   */
  private getDefaultCamera(boundingBox: BoundingBox) {
    const centerX = (boundingBox.minX + boundingBox.maxX) / 2;
    const centerZ = (boundingBox.minY + boundingBox.maxY) / 2;
    const width = boundingBox.maxX - boundingBox.minX;
    const depth = boundingBox.maxY - boundingBox.minY;
    const maxDim = Math.max(width, depth);

    return {
      type: 'perspective' as const,
      position: [centerX + maxDim * 0.8, maxDim * 0.6, centerZ + maxDim * 0.8] as [number, number, number],
      target: [centerX, 0, centerZ] as [number, number, number],
      fov: 50,
      near: 0.1,
      far: maxDim * 10,
    };
  }

  /**
   * Format room type for display
   */
  private formatRoomType(type: string): string {
    return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    step: GenerationProgress['step'],
    progress: number,
    currentItem: string,
    totalItems: number,
    processedItems: number
  ) {
    if (this.onProgress) {
      this.onProgress({
        step,
        progress,
        currentItem,
        totalItems,
        processedItems,
      });
    }
  }
}

// ============================================
// Bounding Box Interface
// ============================================

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

// ============================================
// Singleton Export
// ============================================

let defaultGenerator: FloorPlan3DGenerator | null = null;

export function getFloorPlan3DGenerator(options?: Partial<GenerationOptions>): FloorPlan3DGenerator {
  if (!defaultGenerator || options) {
    defaultGenerator = new FloorPlan3DGenerator(options);
  }
  return defaultGenerator;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Convert Scene3D to Three.js compatible format for direct use
 */
export function sceneToThreeJSFormat(scene: Scene3D) {
  return {
    objects: scene.meshes.map((mesh) => ({
      uuid: mesh.id,
      type: mesh.geometry.type === 'box' ? 'BoxGeometry' : 'PlaneGeometry',
      position: { x: mesh.position[0], y: mesh.position[1], z: mesh.position[2] },
      rotation: { x: mesh.rotation[0], y: mesh.rotation[1], z: mesh.rotation[2] },
      scale: { x: mesh.scale[0], y: mesh.scale[1], z: mesh.scale[2] },
      geometry: {
        type: mesh.geometry.type === 'box' ? 'BoxGeometry' : 'PlaneGeometry',
        width: mesh.geometry.width,
        height: mesh.geometry.height,
        depth: mesh.geometry.depth,
      },
      material: {
        type: 'MeshStandardMaterial',
        color: mesh.material.color,
        opacity: mesh.material.opacity,
        transparent: mesh.material.transparent,
        roughness: mesh.material.roughness,
        metalness: mesh.material.metalness,
      },
      userData: mesh.userData,
    })),
    lights: scene.lights,
    camera: scene.camera,
    boundingBox: scene.boundingBox,
    metadata: scene.metadata,
  };
}
