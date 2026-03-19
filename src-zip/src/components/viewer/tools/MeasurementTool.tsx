'use client';

/**
 * MeasurementTool - Distance, angle, and area measurements
 *
 * Provides measurement capabilities in the 3D viewport:
 * - Point-to-point distance
 * - Angle between surfaces
 * - Area of selected faces
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Ruler, X, Trash2, CornerDownRight, Square, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';

export type MeasurementMode = 'distance' | 'angle' | 'area' | 'point';

export interface Measurement {
  id: string;
  type: MeasurementMode;
  points: THREE.Vector3[];
  value: number;
  unit: string;
  label?: string;
}

interface MeasurementToolProps {
  scene: THREE.Scene;
  camera: THREE.Camera;
  renderer: THREE.WebGLRenderer;
  isActive: boolean;
  mode: MeasurementMode;
  onMeasurementComplete?: (measurement: Measurement) => void;
  onClose?: () => void;
}

// Helper: Create measurement line
function createMeasurementLine(
  start: THREE.Vector3,
  end: THREE.Vector3,
  color: number = 0x00ff00
): THREE.Line {
  const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
  const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });
  return new THREE.Line(geometry, material);
}

// Helper: Create measurement label sprite
function createLabelSprite(text: string, position: THREE.Vector3): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = 256;
  canvas.height = 64;

  // Background
  context.fillStyle = 'rgba(0, 0, 0, 0.8)';
  context.roundRect(0, 0, canvas.width, canvas.height, 8);
  context.fill();

  // Text
  context.fillStyle = '#00ff00';
  context.font = 'bold 24px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(2, 0.5, 1);

  return sprite;
}

// Helper: Calculate distance
function calculateDistance(p1: THREE.Vector3, p2: THREE.Vector3): number {
  return p1.distanceTo(p2);
}

// Helper: Calculate angle between three points
function calculateAngle(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
  const v1 = new THREE.Vector3().subVectors(p1, p2);
  const v2 = new THREE.Vector3().subVectors(p3, p2);
  return v1.angleTo(v2) * (180 / Math.PI);
}

// Helper: Calculate area of polygon
function calculateArea(points: THREE.Vector3[]): number {
  if (points.length < 3) return 0;

  // Shoelace formula for 3D polygon
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const cross = new THREE.Vector3().crossVectors(
      points[i],
      points[j]
    );
    area += cross.length();
  }

  return area / 2;
}

export function MeasurementTool({
  scene,
  camera,
  renderer,
  isActive,
  mode,
  onMeasurementComplete,
  onClose,
}: MeasurementToolProps) {
  const { t } = useTranslation();
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [currentPoints, setCurrentPoints] = useState<THREE.Vector3[]>([]);
  const [previewLine, setPreviewLine] = useState<THREE.Line | null>(null);
  const measurementGroupRef = useRef<THREE.Group>(new THREE.Group());

  // Add measurement group to scene
  useEffect(() => {
    const group = measurementGroupRef.current;
    group.name = 'measurements';
    scene.add(group);

    return () => {
      scene.remove(group);
    };
  }, [scene]);

  // Handle click for measurement
  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!isActive) return;

      const rect = renderer.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(scene.children, true);
      const validIntersect = intersects.find(
        (i) => !i.object.name.includes('measurement') && i.object.type !== 'GridHelper'
      );

      if (validIntersect) {
        const point = validIntersect.point.clone();
        const newPoints = [...currentPoints, point];
        setCurrentPoints(newPoints);

        // Create point marker
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.1),
          new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        marker.position.copy(point);
        marker.name = 'measurement-marker';
        measurementGroupRef.current.add(marker);

        // Check if measurement is complete
        const requiredPoints = mode === 'distance' ? 2 : mode === 'angle' ? 3 : 3;

        if (newPoints.length === requiredPoints) {
          // Calculate measurement
          let value = 0;
          let unit = '';

          switch (mode) {
            case 'distance':
              value = calculateDistance(newPoints[0], newPoints[1]);
              unit = 'm';
              break;
            case 'angle':
              value = calculateAngle(newPoints[0], newPoints[1], newPoints[2]);
              unit = '°';
              break;
            case 'area':
              value = calculateArea(newPoints);
              unit = 'm²';
              break;
            case 'point':
              value = 0;
              unit = '';
              break;
          }

          // Create visual representation
          if (mode === 'distance') {
            const line = createMeasurementLine(newPoints[0], newPoints[1]);
            line.name = 'measurement-line';
            measurementGroupRef.current.add(line);

            const midpoint = new THREE.Vector3()
              .addVectors(newPoints[0], newPoints[1])
              .multiplyScalar(0.5);
            const label = createLabelSprite(`${value.toFixed(2)} ${unit}`, midpoint);
            label.name = 'measurement-label';
            measurementGroupRef.current.add(label);
          }

          const measurement: Measurement = {
            id: `measurement-${Date.now()}`,
            type: mode,
            points: newPoints,
            value,
            unit,
            label: `${value.toFixed(2)} ${unit}`,
          };

          setMeasurements((prev) => [...prev, measurement]);
          setCurrentPoints([]);
          onMeasurementComplete?.(measurement);
        } else if (newPoints.length > 1) {
          // Draw preview line
          const line = createMeasurementLine(
            newPoints[newPoints.length - 2],
            newPoints[newPoints.length - 1],
            0x00aa00
          );
          line.name = 'measurement-preview';
          measurementGroupRef.current.add(line);
        }
      }
    },
    [isActive, mode, currentPoints, scene, camera, renderer, onMeasurementComplete]
  );

  // Attach click listener
  useEffect(() => {
    if (!isActive) return;

    renderer.domElement.addEventListener('click', handleClick);
    renderer.domElement.style.cursor = 'crosshair';

    return () => {
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.style.cursor = 'auto';
    };
  }, [isActive, handleClick, renderer]);

  // Clear all measurements
  const clearMeasurements = useCallback(() => {
    const group = measurementGroupRef.current;
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    setMeasurements([]);
    setCurrentPoints([]);
  }, []);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-3"
    >
      <div className="flex items-center gap-4">
        {/* Mode indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg">
          <Ruler className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium capitalize">{t(`viewer.${mode}Mode`)}</span>
        </div>

        {/* Current measurement */}
        {currentPoints.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {t('viewer.points')}: {currentPoints.length} / {mode === 'distance' ? 2 : 3}
          </div>
        )}

        {/* Measurements list */}
        {measurements.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
            <span className="text-sm">
              {measurements.length} {t('viewer.measurement')}{measurements.length > 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Actions */}
        <button
          onClick={clearMeasurements}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title={t('viewer.clearAll')}
        >
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </button>

        <button
          onClick={onClose}
          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
          title={t('common.close')}
        >
          <X className="w-4 h-4 text-destructive" />
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-2 text-xs text-muted-foreground text-center">
        {t('viewer.measurementInstructions')}
      </div>
    </motion.div>
  );
}

export default MeasurementTool;
