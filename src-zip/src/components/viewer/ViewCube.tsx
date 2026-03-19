'use client';

/**
 * ViewCube - Interactive 3D Navigation Cube
 *
 * A professional BIM navigation control inspired by Revit/Navisworks.
 * Provides intuitive orientation and camera control through:
 * - Clickable faces, edges, and corners
 * - Compass ring for cardinal directions
 * - Smooth camera animations
 *
 * ★ Insight ─────────────────────────────────────
 * The ViewCube uses CSS 3D transforms rather than WebGL, making it
 * lightweight and render-independent from the main viewport. This
 * pattern is common in professional CAD software where the cube
 * needs to remain responsive even during heavy model operations.
 * ─────────────────────────────────────────────────
 */

import { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Home, RotateCcw } from 'lucide-react';
import type { ViewPreset } from '@/types/bim';

// ============================================
// Types
// ============================================

export interface ViewCubeProps {
  /** Current camera rotation (degrees) for cube rotation */
  rotation?: { x: number; y: number; z: number };
  /** Currently active view preset */
  activeView?: ViewPreset;
  /** Callback when a view is selected */
  onViewSelect?: (preset: ViewPreset) => void;
  /** Callback for home view */
  onHomeView?: () => void;
  /** Optional CSS class */
  className?: string;
  /** Size of the cube in pixels */
  size?: number;
  /** Show compass ring */
  showCompass?: boolean;
  /** Show corner labels */
  showLabels?: boolean;
}

interface CubeFace {
  id: ViewPreset;
  label: string;
  shortLabel?: string;
  transform: string;
  hoverColor: string;
}

interface CubeEdge {
  id: string;
  label: string;
  preset: ViewPreset;
  transform: string;
  width: string;
  height: string;
}

interface CubeCorner {
  id: string;
  label: string;
  preset: ViewPreset;
  transform: string;
}

// ============================================
// Configuration
// ============================================

const CUBE_FACES: CubeFace[] = [
  { id: 'top', label: 'TOP', transform: 'rotateX(90deg) translateZ(50px)', hoverColor: 'from-blue-400/90 to-blue-500/90' },
  { id: 'bottom', label: 'BOTTOM', transform: 'rotateX(-90deg) translateZ(50px)', hoverColor: 'from-gray-400/90 to-gray-500/90' },
  { id: 'front', label: 'FRONT', transform: 'translateZ(50px)', hoverColor: 'from-emerald-400/90 to-emerald-500/90' },
  { id: 'back', label: 'BACK', transform: 'rotateY(180deg) translateZ(50px)', hoverColor: 'from-emerald-400/90 to-emerald-500/90' },
  { id: 'left', label: 'LEFT', transform: 'rotateY(-90deg) translateZ(50px)', hoverColor: 'from-amber-400/90 to-amber-500/90' },
  { id: 'right', label: 'RIGHT', transform: 'rotateY(90deg) translateZ(50px)', hoverColor: 'from-amber-400/90 to-amber-500/90' },
];

const CUBE_EDGES: CubeEdge[] = [
  // Top edges
  { id: 'top-front', label: 'Top Front', preset: 'front', transform: 'rotateX(45deg) translateZ(50px)', width: '80px', height: '16px' },
  { id: 'top-back', label: 'Top Back', preset: 'back', transform: 'rotateX(-45deg) rotateY(180deg) translateZ(50px)', width: '80px', height: '16px' },
  { id: 'top-left', label: 'Top Left', preset: 'left', transform: 'rotateY(-90deg) rotateX(45deg) translateZ(50px)', width: '80px', height: '16px' },
  { id: 'top-right', label: 'Top Right', preset: 'right', transform: 'rotateY(90deg) rotateX(45deg) translateZ(50px)', width: '80px', height: '16px' },
];

const COMPASS_DIRECTIONS = [
  { label: 'N', angle: 0 },
  { label: 'E', angle: 90 },
  { label: 'S', angle: 180 },
  { label: 'W', angle: 270 },
];

// ============================================
// ViewCube Component
// ============================================

export function ViewCube({
  rotation = { x: -25, y: 45, z: 0 },
  activeView,
  onViewSelect,
  onHomeView,
  className,
  size = 100,
  showCompass = true,
  showLabels = true,
}: ViewCubeProps) {
  const [hoveredFace, setHoveredFace] = useState<string | null>(null);
  const [isHoveringCube, setIsHoveringCube] = useState(false);

  // Calculate cube transform based on current camera rotation
  const cubeTransform = useMemo(() => {
    // Invert rotations to match camera view
    return `rotateX(${-rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${-rotation.z}deg)`;
  }, [rotation]);

  // Handle face click
  const handleFaceClick = useCallback(
    (preset: ViewPreset) => {
      onViewSelect?.(preset);
    },
    [onViewSelect]
  );

  // Handle home view
  const handleHomeClick = useCallback(() => {
    onHomeView?.();
  }, [onHomeView]);

  // Scale factor for cube size
  const scale = size / 100;

  return (
    <div
      className={cn(
        'relative',
        className
      )}
      style={{ width: size + 40, height: size + 40 }}
      onMouseEnter={() => setIsHoveringCube(true)}
      onMouseLeave={() => setIsHoveringCube(false)}
    >
      {/* Compass Ring */}
      {showCompass && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `rotateZ(${-rotation.y}deg)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          {/* Compass circle */}
          <div className="absolute inset-2 rounded-full border-2 border-border/50" />

          {/* Direction labels */}
          {COMPASS_DIRECTIONS.map((dir) => (
            <div
              key={dir.label}
              className="absolute left-1/2 -translate-x-1/2 text-xs font-bold text-muted-foreground/60"
              style={{
                top: dir.angle === 0 ? '2px' : dir.angle === 180 ? 'auto' : '50%',
                bottom: dir.angle === 180 ? '2px' : 'auto',
                left: dir.angle === 90 ? 'auto' : dir.angle === 270 ? '2px' : '50%',
                right: dir.angle === 90 ? '2px' : 'auto',
                transform: dir.angle === 90 || dir.angle === 270 ? 'translateY(-50%)' : 'translateX(-50%)',
              }}
            >
              {dir.label}
            </div>
          ))}
        </div>
      )}

      {/* Cube Container */}
      <div
        className="absolute"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          perspective: '400px',
          perspectiveOrigin: 'center center',
        }}
      >
        {/* 3D Cube */}
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{
            width: 100 * scale,
            height: 100 * scale,
            transformStyle: 'preserve-3d',
            transform: cubeTransform,
          }}
        >
          {/* Cube Faces */}
          {CUBE_FACES.map((face) => (
            <button
              key={face.id}
              onClick={() => handleFaceClick(face.id)}
              onMouseEnter={() => setHoveredFace(face.id)}
              onMouseLeave={() => setHoveredFace(null)}
              aria-label={`View from ${face.label}`}
              className={cn(
                'absolute flex items-center justify-center',
                'border border-border',
                'cursor-pointer transition-all duration-200',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                activeView === face.id
                  ? 'bg-primary/80 text-primary-foreground shadow-lg'
                  : hoveredFace === face.id
                  ? `bg-gradient-to-br ${face.hoverColor} text-white shadow-md`
                  : 'bg-background/90 text-muted-foreground'
              )}
              style={{
                width: 100 * scale,
                height: 100 * scale,
                transform: face.transform.replace(/50px/g, `${50 * scale}px`),
                backfaceVisibility: 'hidden',
              }}
            >
              {showLabels && (
                <span
                  className={cn(
                    'text-[10px] font-bold tracking-wider',
                    'select-none pointer-events-none'
                  )}
                  style={{ transform: 'scale(0.9)' }}
                >
                  {face.shortLabel || face.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Home Button */}
      <AnimatePresence>
        {isHoveringCube && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={handleHomeClick}
            className={cn(
              'absolute bottom-1 left-1/2 -translate-x-1/2',
              'p-1.5 rounded-full bg-background',
              'border border-border',
              'shadow-md hover:shadow-lg transition-shadow',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary'
            )}
            aria-label="Reset to home view"
          >
            <Home className="w-4 h-4 text-muted-foreground/60" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// ViewCube Canvas (xeokit-integrated version)
// ============================================

/**
 * A container component for xeokit's native NavCube plugin.
 * Use this when you want xeokit to manage the cube rendering.
 */
export interface ViewCubeCanvasProps {
  /** Canvas ID for xeokit NavCubePlugin */
  canvasId?: string;
  /** Size in pixels */
  size?: number;
  /** CSS class */
  className?: string;
  /** Show compass directions */
  showCompass?: boolean;
  /** Current Y-axis rotation for compass */
  compassRotation?: number;
}

export function ViewCubeCanvas({
  canvasId = 'navCubeCanvas',
  size = 120,
  className,
  showCompass = true,
  compassRotation = 0,
}: ViewCubeCanvasProps) {
  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      {/* Compass Ring */}
      {showCompass && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            transform: `rotateZ(${-compassRotation}deg)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-border/30" />
          {COMPASS_DIRECTIONS.map((dir) => (
            <div
              key={dir.label}
              className="absolute text-[10px] font-bold text-muted-foreground/80"
              style={{
                top: dir.angle === 0 ? '-2px' : dir.angle === 180 ? 'auto' : '50%',
                bottom: dir.angle === 180 ? '-2px' : 'auto',
                left: dir.angle === 90 ? 'auto' : dir.angle === 270 ? '-4px' : '50%',
                right: dir.angle === 90 ? '-4px' : 'auto',
                transform: dir.angle === 90 || dir.angle === 270 ? 'translateY(-50%)' : 'translateX(-50%)',
              }}
            >
              {dir.label}
            </div>
          ))}
        </div>
      )}

      {/* NavCube Canvas */}
      <canvas
        id={canvasId}
        className="absolute inset-2 rounded-lg shadow-lg"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  );
}

export default ViewCube;
