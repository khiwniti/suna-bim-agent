'use client';

import { useEffect, useRef, useState } from 'react';

import type * as OBC from '@thatopen/components';
import type * as OBCF from '@thatopen/components-front';

interface ElementHighlight {
  expressId: number;
  color?: string;
}

interface BIMViewerProps {
  modelUrl: string;
  selectedElements?: string[];
  highlights?: ElementHighlight[];
  onElementSelect?: (expressId: number) => void;
}

export default function BIMViewer({
  modelUrl,
  selectedElements = [],
  highlights = [],
  onElementSelect,
}: BIMViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const componentsRef = useRef<InstanceType<typeof OBC.Components> | null>(null);
  // Fix 1: store callback in ref to avoid stale closure
  const onElementSelectRef = useRef(onElementSelect);
  // Fix 2: store highlighter instance for external highlight/selection application
  const highlighterRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fix 1: keep ref in sync with the latest prop value
  useEffect(() => {
    onElementSelectRef.current = onElementSelect;
  }, [onElementSelect]);

  // Fix 2: react to selectedElements/highlights prop changes
  useEffect(() => {
    if (!highlighterRef.current || selectedElements.length === 0) return;
    // TODO: OBC highlighter.highlightByID requires fragment IDs mapped from express IDs.
    // A full implementation needs the loaded model's fragmentMap. Stored for future use.
  }, [selectedElements, highlights]);

  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;

    async function initViewer() {
      try {
        const OBCMod = await import('@thatopen/components');
        // Fix 3: guard after first dynamic import
        if (!mounted) return;

        const OBCFMod = await import('@thatopen/components-front');
        // Fix 3: guard after second dynamic import
        if (!mounted) return;

        const components = new OBCMod.Components();
        componentsRef.current = components;

        const worlds = components.get(OBCMod.Worlds);
        const world = worlds.create<
          OBC.SimpleScene,
          OBC.OrthoPerspectiveCamera,
          OBCF.PostproductionRenderer
        >();

        world.scene = new OBCMod.SimpleScene(components);
        world.renderer = new OBCFMod.PostproductionRenderer(components, containerRef.current!);
        world.camera = new OBCMod.OrthoPerspectiveCamera(components);

        await world.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
        // Fix 3: guard after async camera setup
        if (!mounted) return;

        components.init();
        world.scene.setup();

        const grids = components.get(OBCMod.Grids);
        grids.create(world);

        const fragmentIfcLoader = components.get(OBCMod.IfcLoader);
        await fragmentIfcLoader.setup();
        // Fix 3: guard after loader setup
        if (!mounted) return;

        // Fix 4: check response.ok before consuming body
        const response = await fetch(modelUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${modelUrl}`);
        // Fix 3: guard after fetch
        if (!mounted) { components.dispose?.(); return; }

        const buffer = await response.arrayBuffer();
        // Fix 3: guard after arrayBuffer read
        if (!mounted) { components.dispose?.(); return; }
        const data = new Uint8Array(buffer);
        const model = await fragmentIfcLoader.load(data);
        // Fix 3: guard after model load
        if (!mounted) { components.dispose?.(); return; }

        world.scene.three.add(model);

        await world.camera.fit(world.meshes);
        // Fix 3: guard after camera fit
        if (!mounted) return;

        const highlighter = components.get(OBCFMod.Highlighter);
        highlighter.setup({ world });
        // Fix 2: store highlighter ref for selectedElements/highlights effect
        highlighterRef.current = highlighter;

        highlighter.events.select.onHighlight.add((selection: Record<string, unknown>) => {
          const ids = Object.keys(selection);
          if (ids.length > 0) {
            // Fix 1: read from ref instead of closing over stale onElementSelect
            onElementSelectRef.current?.(parseInt(ids[0]));
          }
        });

        if (mounted) setLoading(false);
      } catch (err) {
        console.error('BIM Viewer error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load model');
          setLoading(false);
        }
      }
    }

    initViewer();
    return () => {
      mounted = false;
      componentsRef.current?.dispose?.();
    };
  }, [modelUrl]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-destructive text-sm">
          <p className="font-medium">โหลดโมเดลไม่สำเร็จ</p>
          <p className="text-xs opacity-70 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" style={{ minHeight: 400 }} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center space-y-2">
            <div className="animate-spin h-7 w-7 border-2 border-primary border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-muted-foreground">กำลังโหลดโมเดล IFC...</p>
          </div>
        </div>
      )}
    </div>
  );
}
