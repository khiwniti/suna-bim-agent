'use client';

/**
 * SectionTool - Section plane and clipping controls
 *
 * Provides section/clipping capabilities:
 * - X, Y, Z axis section planes
 * - Interactive plane positioning
 * - Multiple planes support
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, X, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';

export type SectionAxis = 'x' | 'y' | 'z';

export interface SectionPlane {
  id: string;
  axis: SectionAxis;
  position: number;
  enabled: boolean;
  plane: THREE.Plane;
}

interface SectionToolProps {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  isActive: boolean;
  onClose?: () => void;
}

// Axis configurations
const AXIS_CONFIG: Record<SectionAxis, { normal: THREE.Vector3; color: number; label: string }> = {
  x: { normal: new THREE.Vector3(1, 0, 0), color: 0xff4444, label: 'X (Red)' },
  y: { normal: new THREE.Vector3(0, 1, 0), color: 0x44ff44, label: 'Y (Green)' },
  z: { normal: new THREE.Vector3(0, 0, 1), color: 0x4444ff, label: 'Z (Blue)' },
};

export function SectionTool({
  scene,
  renderer,
  isActive,
  onClose,
}: SectionToolProps) {
  const { t } = useTranslation();
  const [sections, setSections] = useState<SectionPlane[]>([]);
  const [activeAxis, setActiveAxis] = useState<SectionAxis | null>(null);
  const clippingPlanesRef = useRef<THREE.Plane[]>([]);
  const helperGroupRef = useRef<THREE.Group>(new THREE.Group());

  // Add helper group to scene
  useEffect(() => {
    const group = helperGroupRef.current;
    group.name = 'section-helpers';
    scene.add(group);

    return () => {
      scene.remove(group);
      // Remove all clipping planes
      renderer.clippingPlanes = [];
    };
  }, [scene, renderer]);

  // Update renderer clipping planes
  useEffect(() => {
    const enabledPlanes = sections
      .filter((s) => s.enabled)
      .map((s) => s.plane);

    renderer.clippingPlanes = enabledPlanes;
    renderer.localClippingEnabled = enabledPlanes.length > 0;
  }, [sections, renderer]);

  // Create a new section plane
  const createSection = useCallback(
    (axis: SectionAxis) => {
      const config = AXIS_CONFIG[axis];

      // Calculate bounding box of scene
      const box = new THREE.Box3();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh && !obj.name.includes('helper') && !obj.name.includes('section')) {
          box.expandByObject(obj);
        }
      });

      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Create plane at center
      const plane = new THREE.Plane(config.normal.clone(), -center[axis]);

      // Create visual helper
      const helperGeometry = new THREE.PlaneGeometry(
        axis === 'x' ? size.z * 1.2 : size.x * 1.2,
        axis === 'y' ? size.z * 1.2 : size.y * 1.2
      );
      const helperMaterial = new THREE.MeshBasicMaterial({
        color: config.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      });
      const helper = new THREE.Mesh(helperGeometry, helperMaterial);
      helper.name = `section-helper-${axis}`;

      // Position and rotate helper
      if (axis === 'x') {
        helper.rotation.y = Math.PI / 2;
        helper.position.set(center.x, center.y, center.z);
      } else if (axis === 'y') {
        helper.rotation.x = -Math.PI / 2;
        helper.position.set(center.x, center.y, center.z);
      } else {
        helper.position.set(center.x, center.y, center.z);
      }

      helperGroupRef.current.add(helper);

      const section: SectionPlane = {
        id: `section-${axis}-${Date.now()}`,
        axis,
        position: center[axis],
        enabled: true,
        plane,
      };

      setSections((prev) => [...prev, section]);
      setActiveAxis(axis);
    },
    [scene]
  );

  // Update section plane position
  const updateSectionPosition = useCallback(
    (id: string, position: number) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id === id) {
            const newPlane = s.plane.clone();
            newPlane.constant = -position;
            return { ...s, position, plane: newPlane };
          }
          return s;
        })
      );

      // Update helper position
      const section = sections.find((s) => s.id === id);
      if (section) {
        const helper = helperGroupRef.current.getObjectByName(`section-helper-${section.axis}`);
        if (helper) {
          helper.position[section.axis] = position;
        }
      }
    },
    [sections]
  );

  // Toggle section visibility
  const toggleSection = useCallback((id: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return { ...s, enabled: !s.enabled };
        }
        return s;
      })
    );
  }, []);

  // Remove section
  const removeSection = useCallback((id: string) => {
    const section = sections.find((s) => s.id === id);
    if (section) {
      const helper = helperGroupRef.current.getObjectByName(`section-helper-${section.axis}`);
      if (helper) {
        helperGroupRef.current.remove(helper);
      }
    }
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, [sections]);

  // Clear all sections
  const clearSections = useCallback(() => {
    while (helperGroupRef.current.children.length > 0) {
      helperGroupRef.current.remove(helperGroupRef.current.children[0]);
    }
    setSections([]);
    renderer.clippingPlanes = [];
    renderer.localClippingEnabled = false;
  }, [renderer]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="absolute top-20 left-4 bg-card/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-4 w-72"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scissors className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">{t('viewer.sectionPlanes')}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Add Section Buttons */}
      <div className="flex gap-2 mb-4">
        {(['x', 'y', 'z'] as SectionAxis[]).map((axis) => {
          const config = AXIS_CONFIG[axis];
          const hasSection = sections.some((s) => s.axis === axis);
          return (
            <button
              key={axis}
              onClick={() => createSection(axis)}
              disabled={hasSection}
              className={cn(
                'flex-1 py-2 rounded-lg font-medium text-sm transition-colors',
                hasSection
                  ? 'bg-muted text-muted-foreground cursor-not-allowed'
                  : 'bg-primary/10 hover:bg-primary/20 text-primary'
              )}
              style={{ borderLeft: `3px solid ${hasSection ? '#888' : `#${config.color.toString(16).padStart(6, '0')}`}` }}
            >
              {axis.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Active Sections */}
      {sections.length > 0 ? (
        <div className="space-y-3">
          {sections.map((section) => {
            const config = AXIS_CONFIG[section.axis];
            return (
              <div
                key={section.id}
                className="p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: `#${config.color.toString(16).padStart(6, '0')}` }}
                    />
                    <span className="text-sm font-medium">{t(`sectionTool.axis.${section.axis}`)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      title={section.enabled ? t('common.hide') : t('common.show')}
                    >
                      {section.enabled ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => removeSection(section.id)}
                      className="p-1 hover:bg-destructive/10 rounded transition-colors"
                      title={t('common.remove')}
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>

                {/* Position slider */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={-50}
                    max={50}
                    step={0.1}
                    value={section.position}
                    onChange={(e) => updateSectionPosition(section.id, parseFloat(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="text-xs text-muted-foreground text-center">
                    {t('sectionTool.position', { value: section.position.toFixed(1) })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Clear all button */}
          <button
            onClick={clearSections}
            className="w-full py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            {t('sectionTool.clearAllSections')}
          </button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('sectionTool.clickAxisInstruction')}
        </p>
      )}
    </motion.div>
  );
}

export default SectionTool;
