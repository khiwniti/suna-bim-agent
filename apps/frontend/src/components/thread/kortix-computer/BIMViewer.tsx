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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;

    async function initViewer() {
      try {
        const OBCMod = await import('@thatopen/components');
        const OBCFMod = await import('@thatopen/components-front');

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
        components.init();
        world.scene.setup();

        const grids = components.get(OBCMod.Grids);
        grids.create(world);

        const fragmentIfcLoader = components.get(OBCMod.IfcLoader);
        await fragmentIfcLoader.setup();

        const response = await fetch(modelUrl);
        const buffer = await response.arrayBuffer();
        const data = new Uint8Array(buffer);
        const model = await fragmentIfcLoader.load(data);
        world.scene.three.add(model);

        await world.camera.fit(world.meshes);

        const highlighter = components.get(OBCFMod.Highlighter);
        highlighter.setup({ world });
        highlighter.events.select.onHighlight.add((selection: Record<string, unknown>) => {
          const ids = Object.keys(selection);
          if (ids.length > 0 && onElementSelect) {
            onElementSelect(parseInt(ids[0]));
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
