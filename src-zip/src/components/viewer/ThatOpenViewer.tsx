'use client';

/**
 * ThatOpenViewer - Revit-like BIM 3D Viewer using That Open Components
 *
 * Based on official That Open documentation:
 * https://docs.thatopen.com/Tutorials/Components
 *
 * Initialization order (critical):
 * 1. Create Components instance
 * 2. Create World with typed generics
 * 3. Setup Scene, Renderer, Camera (in that order)
 * 4. AWAIT camera.controls.setLookAt()
 * 5. Call components.init()
 * 6. Setup Grids
 * 7. Initialize Raycasters.get(world) BEFORE Highlighter
 * 8. Setup Highlighter
 * 9. Initialize FragmentsManager with worker URL
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useBIMStore } from '@/stores/bim-store';
import { usePanelEvent } from '@/lib/panel/event-bus';
import type { PanelEvent } from '@/lib/panel/event-bus';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle, Upload } from 'lucide-react';
import { useTranslation } from '@/i18n/provider';
import type {
  ThatOpenViewerState,
  ThatOpenLoadProgress,
} from '@/types/thatopen';

// ============================================
// Constants
// ============================================

// CDN fallback for FragmentsManager worker
// Primary: local worker file (avoids CORS issues with cross-origin workers)
const FRAGMENTS_WORKER_LOCAL_URL = '/workers/fragments-worker.mjs';
const FRAGMENTS_WORKER_CDN_URL = 'https://thatopen.github.io/engine_fragment/resources/worker.mjs';

// Local WASM configuration for IFC loader
// We use forceSingleThread: true in Init() to prevent worker spawning
const WASM_CONFIG = {
  path: '/wasm/',
  absolute: true,
};

// ============================================
// Dynamic imports for That Open (client-side only)
// ============================================

let OBC: typeof import('@thatopen/components') | null = null;
let OBF: typeof import('@thatopen/components-front') | null = null;
let THREE: typeof import('three') | null = null;

// ============================================
// Component Props
// ============================================

interface ThatOpenViewerProps {
  className?: string;
  onModelLoaded?: (modelId: string) => void;
  onElementSelected?: (expressID: number | null) => void;
  onError?: (error: Error) => void;
}

// ============================================
// Main Component
// ============================================

export function ThatOpenViewer({
  className,
  onModelLoaded,
  onElementSelected,
  onError,
}: ThatOpenViewerProps) {
  const { t } = useTranslation();

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const componentsRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const worldRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fragmentsRef = useRef<any>(null);
  // Track if IFC loader WASM is ready
  const ifcLoaderReadyRef = useRef<boolean>(false);
  // Track if viewer has been initialized (to prevent re-init)
  const isInitializedRef = useRef<boolean>(false);
  // Store ResizeObserver for cleanup
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Local state
  const [viewerState, setViewerState] = useState<ThatOpenViewerState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    activeModel: null,
  });
  const [loadProgress, setLoadProgress] = useState<ThatOpenLoadProgress | null>(null);

  // Global state
  const setThatOpenComponents = useBIMStore((s) => s.setThatOpenComponents);
  const setThatOpenSelection = useBIMStore((s) => s.setThatOpenSelection);
  const setCurrentModel = useBIMStore((s) => s.setCurrentModel);
  const currentModel = useBIMStore((s) => s.currentModel);
  const pendingCommands = useBIMStore((s) => s.pendingCommands);
  const clearCommands = useBIMStore((s) => s.clearCommands);

  // Store blob URL ref for cleanup (memory leak prevention)
  const blobUrlRef = useRef<string | null>(null);
  // Store event listener refs for cleanup
  const eventListenersRef = useRef<Array<{ target: EventTarget; type: string; listener: EventListener }>>([]);

  // Get addPendingCommand for event bus -> store bridge
  const addPendingCommand = useBIMStore((s) => s.addPendingCommand);

  // ============================================
  // Panel Event Bus Subscription
  // Enables AI tools to control viewer via event bus
  // ============================================

  /**
   * Handle HIGHLIGHT_ELEMENTS events from panel event bus
   * Bridges event-based commands to the pendingCommands queue
   */
  const handleHighlightEvent = useCallback((event: PanelEvent) => {
    if (event.event.type === 'HIGHLIGHT_ELEMENTS') {
      const { elementIds, isolate, zoomTo } = event.event;
      console.log('[ThatOpenViewer] Received HIGHLIGHT_ELEMENTS event:', { elementIds, isolate, zoomTo });

      // Add highlight command
      addPendingCommand({
        type: 'highlight',
        data: { elementIds },
      });

      // Optionally isolate
      if (isolate) {
        addPendingCommand({
          type: 'isolate',
          data: { elementIds },
        });
      }

      // Optionally zoom to
      if (zoomTo) {
        addPendingCommand({
          type: 'zoomTo',
          data: { elementIds },
        });
      }
    }
  }, [addPendingCommand]);

  // Subscribe to HIGHLIGHT_ELEMENTS events from the panel event bus
  usePanelEvent('HIGHLIGHT_ELEMENTS', handleHighlightEvent);

  // ============================================
  // Initialize That Open Components
  // Following official documentation pattern
  // ============================================

  useEffect(() => {
    let mounted = true;

    async function initViewer() {
      if (!containerRef.current) return;
      
      // Prevent re-initialization
      if (isInitializedRef.current) return;

      // CRITICAL: Wait for container to have non-zero dimensions
      // This prevents WebGL framebuffer errors
      const container = containerRef.current;
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        // Container not sized yet, wait and retry
        const retryTimeout = setTimeout(() => {
          if (mounted) initViewer();
        }, 100);
        return () => clearTimeout(retryTimeout);
      }

      try {
        setViewerState((s) => ({ ...s, isLoading: true, error: null }));

        // Step 1: Dynamic imports
        const [obcModule, obfModule, threeModule] = await Promise.all([
          import('@thatopen/components'),
          import('@thatopen/components-front'),
          import('three'),
        ]);

        if (!mounted) return;

        OBC = obcModule;
        OBF = obfModule;
        THREE = threeModule;

        // Step 2: Create Components instance
        const components = new OBC.Components();
        componentsRef.current = components;

        // Step 3: Create World (per official docs)
        const worlds = components.get(OBC.Worlds);
        const world = worlds.create();
        worldRef.current = world;

        // Step 4: Setup Scene
        world.scene = new OBC.SimpleScene(components);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (world.scene as any).setup();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (world.scene.three as any).background = new THREE.Color(0xf5f5f5);

        // Step 5: Setup Renderer (but DON'T enable postproduction yet - needs camera)
        world.renderer = new OBF.PostproductionRenderer(components, containerRef.current);

        // Step 6: Setup Camera
        world.camera = new OBC.OrthoPerspectiveCamera(components);

        // Step 7: AWAIT camera controls setup (critical per official docs)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (world.camera as any).controls.setLookAt(15, 15, 15, 0, 0, 0);

        // Step 8: Initialize components (starts the rendering loop)
        components.init();

        // Step 9: NOW enable postproduction (after camera is ready and components initialized)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (world.renderer as any).postproduction.enabled = true;

        // Step 10: Setup Grids (after init)
        const grids = components.get(OBC.Grids);
        grids.create(world);

        // Step 11: Initialize Raycasters BEFORE Highlighter (critical per official docs)
        // This creates the raycaster for this world
        components.get(OBC.Raycasters).get(world);

        // Step 11: Setup Highlighter with proper configuration
        const highlighter = components.get(OBF.Highlighter);
        highlighter.setup({
          world,
          selectMaterialDefinition: {
            color: new THREE.Color('#10b981'), // emerald-500
            opacity: 0.5,
            transparent: true,
            renderedFaces: 0,
          },
        });
        highlighter.zoomToSelection = true;

        // Step 12: Initialize FragmentsManager with official blob URL pattern
        // Official docs: Fetch worker, convert to blob, then create object URL
        const fragments = components.get(OBC.FragmentsManager);
        let fragmentsInitSuccess = false;

        try {
          // Official pattern: fetch from GitHub, convert to blob URL
          const response = await fetch(FRAGMENTS_WORKER_CDN_URL);
          if (!response.ok) throw new Error(`Failed to fetch worker: ${response.status}`);
          const workerCode = await response.text();
          const blob = new Blob([workerCode], { type: 'application/javascript' });
          const blobUrl = URL.createObjectURL(blob);

          // Store for cleanup to prevent memory leaks
          blobUrlRef.current = blobUrl;

          fragments.init(blobUrl);

          if (fragments.initialized) {
            fragmentsInitSuccess = true;
            console.log('[ThatOpenViewer] FragmentsManager initialized with official blob URL pattern');
          } else {
            throw new Error('FragmentsManager.initialized is false after init()');
          }
        } catch (err) {
          console.warn('[ThatOpenViewer] CDN blob worker failed, trying local:', err);
          try {
            // Fallback to local worker
            fragments.init(FRAGMENTS_WORKER_LOCAL_URL);

            if (fragments.initialized) {
              fragmentsInitSuccess = true;
              console.log('[ThatOpenViewer] FragmentsManager initialized with local worker fallback');
            }
          } catch (localErr) {
            console.error('[ThatOpenViewer] FragmentsManager worker failed:', localErr);
          }
        }

        if (!fragmentsInitSuccess) {
          console.error('[ThatOpenViewer] WARNING: FragmentsManager not initialized - IFC loading may fail');
        }

        fragmentsRef.current = fragments;

        // Official: Camera update listener for fragment culling/LOD
        // Use 'update' event per official docs (not just 'rest')
        // THROTTLED to prevent 60fps updates (performance optimization)
        let updatePending = false;
        const throttledUpdate = () => {
          if (!updatePending) {
            updatePending = true;
            requestAnimationFrame(() => {
              fragments.core.update();
              updatePending = false;
            });
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const controls = (world.camera as any).controls;
        controls.addEventListener('update', throttledUpdate);
        eventListenersRef.current.push({ target: controls, type: 'update', listener: throttledUpdate as EventListener });

        // Also update on camera rest for final quality render
        const restUpdate = () => {
          fragments.core.update(true);
        };
        controls.addEventListener('rest', restUpdate);
        eventListenersRef.current.push({ target: controls, type: 'rest', listener: restUpdate as EventListener });

        // Setup fragment loading handler (per official docs)
        fragments.list.onItemSet.add(async ({ value: model }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          model.useCamera(world.camera.three as any);
          world.scene.three.add(model.object);
          await fragments.core.update(true);
        });

        // Official: Handle camera changes to update model camera bindings
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (world as any).onCameraChanged?.add((camera: any) => {
          for (const [, model] of fragments.list) {
            model.useCamera(camera.three);
          }
        });

        // Apply polygon offset to materials to prevent z-fighting (per official docs)
        fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mat = material as any;
          if (!('isLodMaterial' in mat && mat.isLodMaterial)) {
            mat.polygonOffset = true;
            mat.polygonOffsetUnits = 1;
            mat.polygonOffsetFactor = Math.random();
          }
        });

        // Step 13: Initialize other core tools
        components.get(OBC.Classifier);
        components.get(OBC.Hider);

        // Step 14: Pre-initialize IFC loader
        // We need to:
        // 1. Configure settings
        // 2. Call webIfc.Init() with forceSingleThread=true (prevents worker errors)
        // 3. Call setup() to configure the IfcLoader fully
        const ifcLoader = components.get(OBC.IfcLoader);

        try {
          // Configure settings BEFORE calling Init
          ifcLoader.settings.wasm = {
            path: WASM_CONFIG.path,
            absolute: WASM_CONFIG.absolute,
          };
          ifcLoader.settings.autoSetWasm = false;

          // Custom locate file handler for WASM path resolution
          ifcLoader.settings.customLocateFileHandler = (path: string) => {
            return WASM_CONFIG.path + path;
          };

          // CRITICAL: Call webIfc.Init() directly with forceSingleThread=true
          // This prevents web-ifc from spawning workers that fail in Next.js
          await ifcLoader.webIfc.Init(ifcLoader.settings.customLocateFileHandler, true);

          // Now call setup() to finish IfcLoader configuration
          // Pass the settings we already configured
          await ifcLoader.setup({
            autoSetWasm: false,
            wasm: ifcLoader.settings.wasm,
            customLocateFileHandler: ifcLoader.settings.customLocateFileHandler,
          });

          ifcLoaderReadyRef.current = true;
          console.log('[ThatOpenViewer] IFC loader ready (single-thread, setup complete)');
        } catch (err: unknown) {
          console.warn('[ThatOpenViewer] Local WASM failed, trying CDN...', err);
          try {
            // Fallback to CDN WASM with single-threaded mode
            const cdnPath = 'https://unpkg.com/web-ifc@0.0.74/';

            ifcLoader.settings.wasm = {
              path: cdnPath,
              absolute: true,
            };

            const cdnLocateFileHandler = (path: string) => cdnPath + path;
            ifcLoader.settings.customLocateFileHandler = cdnLocateFileHandler;

            await ifcLoader.webIfc.Init(cdnLocateFileHandler, true);
            await ifcLoader.setup({
              autoSetWasm: false,
              wasm: ifcLoader.settings.wasm,
              customLocateFileHandler: cdnLocateFileHandler,
            });

            ifcLoaderReadyRef.current = true;
            console.log('[ThatOpenViewer] IFC loader ready (CDN, single-thread)');
          } catch (fallbackErr: unknown) {
            console.error('[ThatOpenViewer] IFC loader setup failed:', fallbackErr);
            // Continue anyway - will try again on first upload
          }
        }

        // Step 15: Setup Highlighter event handlers
        highlighter.events.select.onHighlight.add(async (modelIdMap) => {
          const expressIDs: number[] = [];
          const fragmentIDs: string[] = [];

          for (const [modelId, localIds] of Object.entries(modelIdMap)) {
            fragmentIDs.push(modelId);
            for (const id of localIds) {
              expressIDs.push(id);
            }
          }

          setThatOpenSelection({ expressIDs, fragmentIDs });

          if (expressIDs.length > 0) {
            onElementSelected?.(expressIDs[0]);
          }
        });

        highlighter.events.select.onClear.add(() => {
          setThatOpenSelection({ expressIDs: [], fragmentIDs: [] });
          onElementSelected?.(null);
        });

        // Store reference in global state
        setThatOpenComponents(components);

        // Setup ResizeObserver for container size changes
        // Three.js renderers need to be notified of size changes
        resizeObserverRef.current = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0 && worldRef.current?.renderer) {
              // Update renderer size
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const renderer = worldRef.current.renderer as any;
              if (renderer.three) {
                renderer.three.setSize(width, height);
              }
              // Update camera aspect ratio
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const camera = worldRef.current.camera?.three as any;
              if (camera) {
                if (camera.isPerspectiveCamera) {
                  camera.aspect = width / height;
                  camera.updateProjectionMatrix();
                } else if (camera.isOrthographicCamera) {
                  // Update orthographic camera bounds if needed
                  camera.updateProjectionMatrix();
                }
              }
            }
          }
        });
        resizeObserverRef.current.observe(containerRef.current);

        // Mark as initialized
        isInitializedRef.current = true;

        setViewerState({
          isInitialized: true,
          isLoading: false,
          error: null,
          activeModel: null,
        });

        console.log('[ThatOpenViewer] Initialized successfully with official pattern');
      } catch (err) {
        console.error('[ThatOpenViewer] Initialization error:', err);
        const error = err instanceof Error ? err : new Error('Failed to initialize viewer');
        setViewerState((s) => ({ ...s, isLoading: false, error: error.message }));
        onError?.(error);
      }
    }

    initViewer();

    return () => {
      mounted = false;
      // Cleanup ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      // Cleanup event listeners (memory leak prevention)
      for (const { target, type, listener } of eventListenersRef.current) {
        try {
          target.removeEventListener(type, listener);
        } catch (e) {
          console.warn('[ThatOpenViewer] Event listener cleanup error:', e);
        }
      }
      eventListenersRef.current = [];
      // Revoke blob URL (memory leak prevention)
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      if (componentsRef.current) {
        try {
          componentsRef.current.dispose();
        } catch (e) {
          console.warn('[ThatOpenViewer] Dispose error:', e);
        }
        componentsRef.current = null;
        worldRef.current = null;
        fragmentsRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [setThatOpenComponents, setThatOpenSelection, onElementSelected, onError]);

  // ============================================
  // Auto-load model from bim-store
  // ============================================

  useEffect(() => {
    if (!viewerState.isInitialized || !currentModel || !currentModel.fileUrl) {
      return;
    }

    // Check if this model is already loaded
    if (viewerState.activeModel === currentModel.id) {
      return;
    }

    const loadStoredModel = async () => {
      console.log('[ThatOpenViewer] Auto-loading model from store:', currentModel.name, currentModel.fileUrl);
      try {
        setViewerState((s) => ({ ...s, isLoading: true }));
        await loadModel(currentModel.fileUrl!, 'ifc');
        setViewerState((s) => ({ ...s, activeModel: currentModel.id, isLoading: false }));
        onModelLoaded?.(currentModel.id);
      } catch (err) {
        console.error('[ThatOpenViewer] Failed to auto-load model:', err);
        setViewerState((s) => ({ 
          ...s, 
          isLoading: false, 
          error: err instanceof Error ? err.message : 'Failed to load model' 
        }));
        onError?.(err instanceof Error ? err : new Error('Failed to load model'));
      }
    };

    loadStoredModel();
  }, [currentModel, viewerState.isInitialized]);

  // ============================================
  // Consume Pending Viewport Commands from Chat/AI
  // ============================================

  useEffect(() => {
    // Early return if viewer not ready or no commands
    if (!viewerState.isInitialized || !worldRef.current) {
      // Only log when there are commands that got skipped (not on every render)
      if (pendingCommands.length > 0 && process.env.NODE_ENV === 'development') {
        console.log('[ThatOpenViewer] Command skipped:', {
          isInitialized: viewerState.isInitialized,
          hasWorld: !!worldRef.current,
          pendingCount: pendingCommands.length,
          reason: !viewerState.isInitialized ? 'viewer not initialized' : 'world not ready',
        });
      }
      return;
    }
    if (pendingCommands.length === 0) return;

    if (process.env.NODE_ENV === 'development') {
      console.log('[ThatOpenViewer] Processing commands:', {
        count: pendingCommands.length,
        commands: pendingCommands.map(cmd => ({ type: cmd.type, data: cmd.data })),
      });
    }

    const executeCommands = async () => {
      for (const command of pendingCommands) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const camera = worldRef.current?.camera as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const highlighter = componentsRef.current?.get(OBF?.Highlighter) as any;

          switch (command.type) {
            case 'zoomTo':
            case 'focus':
              // Focus/zoom to specific elements
              if (command.data?.elementIds && camera?.controls) {
                // For now, just reset to a good view angle - full implementation
                // would calculate bounding box of elements
                await camera.controls.setLookAt(15, 15, 15, 0, 0, 0);
                console.log('[ThatOpenViewer] ✅ Focus command executed:', command.data.elementIds);
              }
              break;
            case 'highlight':
            case 'select':
              if (command.data?.elementIds && highlighter && fragmentsRef.current) {
                console.log('[ThatOpenViewer] Executing highlight for:', command.data.elementIds);

                // Clear existing highlights first
                await highlighter.clear('select');

                // Get all loaded models from FragmentsManager
                const fragments = fragmentsRef.current;
                const elementIds = command.data.elementIds as string[];

                // Build highlight map: { fragmentId: Set<expressID> }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const fragmentIdMap: { [fragmentId: string]: Set<number> } = {};

                // For each model, try to find matching elements
                for (const [modelId, model] of fragments.list) {
                  // Try to parse element IDs as express IDs (numbers)
                  const expressIds = new Set<number>();
                  for (const id of elementIds) {
                    // Try parsing as number (expressID)
                    const numId = parseInt(id, 10);
                    if (!isNaN(numId)) {
                      expressIds.add(numId);
                    }
                  }

                  if (expressIds.size > 0) {
                    fragmentIdMap[modelId] = expressIds;
                  }
                }

                // Highlight elements using the built map
                if (Object.keys(fragmentIdMap).length > 0) {
                  await highlighter.highlight('select', fragmentIdMap);
                  console.log('[ThatOpenViewer] ✅ Highlight applied:', fragmentIdMap);
                } else {
                  console.log('[ThatOpenViewer] ⚠️ No matching elements found for highlight');
                }
              }
              break;
            case 'isolate':
              if (command.data?.elementIds && OBC && componentsRef.current && fragmentsRef.current) {
                console.log('[ThatOpenViewer] Executing isolate for:', command.data.elementIds);

                const hider = componentsRef.current.get(OBC.Hider);
                const fragments = fragmentsRef.current;
                const elementIds = command.data.elementIds as string[];

                // First, hide all elements
                for (const [, model] of fragments.list) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  hider.set(false, (model as any).items);
                }

                // Then show only the specified elements
                for (const [modelId, model] of fragments.list) {
                  const expressIds = new Set<number>();
                  for (const id of elementIds) {
                    const numId = parseInt(id, 10);
                    if (!isNaN(numId)) {
                      expressIds.add(numId);
                    }
                  }

                  if (expressIds.size > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const items = (model as any).items;
                    // Show only the isolated elements
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const isolatedItems: { [fragId: string]: Set<number> } = {};
                    for (const [fragId, ids] of Object.entries(items)) {
                      const matching = new Set<number>();
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      for (const id of (ids as any)) {
                        if (expressIds.has(id)) {
                          matching.add(id);
                        }
                      }
                      if (matching.size > 0) {
                        isolatedItems[fragId] = matching;
                      }
                    }
                    if (Object.keys(isolatedItems).length > 0) {
                      hider.set(true, isolatedItems);
                    }
                  }
                }
                console.log('[ThatOpenViewer] ✅ Isolate applied');
              }
              break;
            case 'showAll':
              if (OBC && componentsRef.current && fragmentsRef.current) {
                console.log('[ThatOpenViewer] Executing showAll');

                const hider = componentsRef.current.get(OBC.Hider);
                const fragments = fragmentsRef.current;

                // Show all elements in all models
                for (const [, model] of fragments.list) {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  hider.set(true, (model as any).items);
                }

                // Also clear any highlights
                if (highlighter) {
                  await highlighter.clear('select');
                }

                console.log('[ThatOpenViewer] ✅ ShowAll executed');
              }
              break;
            case 'setView':
              if (camera?.controls && command.data?.preset) {
                // Preset camera positions with proper architectural views
                const presetPositions: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
                  top: { pos: [0, 50, 0], target: [0, 0, 0] },
                  front: { pos: [0, 10, 50], target: [0, 10, 0] },
                  side: { pos: [50, 10, 0], target: [0, 10, 0] },
                  right: { pos: [50, 10, 0], target: [0, 10, 0] },
                  isometric: { pos: [30, 30, 30], target: [0, 0, 0] },
                  iso: { pos: [30, 30, 30], target: [0, 0, 0] },
                };
                const presetKey = String(command.data.preset).toLowerCase();
                const preset = presetPositions[presetKey] || presetPositions.isometric;
                await camera.controls.setLookAt(
                  preset.pos[0], preset.pos[1], preset.pos[2],
                  preset.target[0], preset.target[1], preset.target[2]
                );
                console.log('[ThatOpenViewer] ✅ SetView executed:', presetKey);
              }
              break;
            default:
              console.warn('[ThatOpenViewer] Unknown command type:', command.type);
          }
        } catch (err) {
          console.error('[ThatOpenViewer] Command execution error:', err);
        }
      }
      // Clear processed commands
      console.log('[ThatOpenViewer] Commands executed, clearing queue');
      clearCommands();
    };

    executeCommands();
  }, [pendingCommands, viewerState.isInitialized, clearCommands]);

  // ============================================
  // Load Model
  // ============================================

  const loadModel = useCallback(
    async (url: string, format: 'fragments' | 'ifc' = 'fragments') => {
      if (!componentsRef.current || !OBC || !worldRef.current) {
        throw new Error('Viewer not initialized');
      }

      setViewerState((s) => ({ ...s, isLoading: true }));
      setLoadProgress({ stage: 'downloading', percent: 0, currentOperation: 'Fetching model...' });

      try {
        setLoadProgress({ stage: 'downloading', percent: 30, currentOperation: 'Downloading...' });

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

        const data = await response.arrayBuffer();

        setLoadProgress({ stage: 'parsing', percent: 60, currentOperation: 'Parsing model...' });

        if (format === 'ifc') {
          // Direct IFC loading using IfcLoader
          const ifcLoader = componentsRef.current.get(OBC.IfcLoader);
          const fragments = componentsRef.current.get(OBC.FragmentsManager);
          
          // Validate FragmentsManager is initialized (required by IfcLoader.load)
          if (!fragments.initialized) {
            throw new Error('FragmentsManager not initialized. Worker may have failed to load.');
          }
          console.log('[ThatOpenViewer] FragmentsManager confirmed initialized, proceeding with IFC load');

          // Only run setup if not already initialized (WASM download)
          if (!ifcLoaderReadyRef.current) {
            setLoadProgress({ stage: 'parsing', percent: 35, currentOperation: 'Downloading IFC engine...' });

            // Configure settings and init with single-thread mode
            ifcLoader.settings.wasm = {
              path: WASM_CONFIG.path,
              absolute: WASM_CONFIG.absolute,
            };
            ifcLoader.settings.autoSetWasm = false;

            const customLocateFileHandler = (path: string) => WASM_CONFIG.path + path;
            ifcLoader.settings.customLocateFileHandler = customLocateFileHandler;

            await ifcLoader.webIfc.Init(customLocateFileHandler, true);
            await ifcLoader.setup({
              autoSetWasm: false,
              wasm: ifcLoader.settings.wasm,
              customLocateFileHandler: customLocateFileHandler,
            });

            ifcLoaderReadyRef.current = true;
            console.log('[ThatOpenViewer] IFC loader initialized in loadModel (single-thread, setup complete)');
          }

          setLoadProgress({ stage: 'parsing', percent: 45, currentOperation: 'Parsing IFC structure...' });

          // Prepare data - IfcLoader.load expects Uint8Array
          const uint8Data = new Uint8Array(data);
          const modelName = `ifc-model-${Date.now()}`;
          console.log(`[ThatOpenViewer] Loading IFC file: ${uint8Data.length} bytes as "${modelName}"`);

          // Load with progress callback for real-time feedback
          // Parameters: data, coordinate, name (required!), config
          const model = await ifcLoader.load(uint8Data, true, modelName, {
            processData: {
              progressCallback: (progress: number) => {
                // Map IFC parsing progress (0-1) to our range (45-85)
                const mappedPercent = 45 + Math.round(progress * 40);
                setLoadProgress({
                  stage: 'parsing',
                  percent: mappedPercent,
                  currentOperation: `Parsing IFC: ${Math.round(progress * 100)}%`,
                });
              },
            },
          });

          console.log('[ThatOpenViewer] IFC model loaded successfully:', model);

          setLoadProgress({ stage: 'processing', percent: 90, currentOperation: 'Finalizing model...' });

          // Add model to scene if not already added by IFC loader
          if (model.object && !worldRef.current.scene.three.children.includes(model.object)) {
            worldRef.current.scene.three.add(model.object);
          }

          // Update fragments core for proper rendering (fragments already declared at line 471)
          if (fragments.initialized) {
            await fragments.core.update(true);
          }
        } else {
          // Fragments format loading (.frag files)
          const fragments = componentsRef.current.get(OBC.FragmentsManager);
          
          // Validate FragmentsManager is initialized
          if (!fragments.initialized) {
            throw new Error('FragmentsManager not initialized. Worker may have failed to load.');
          }
          
          const buffer = new Uint8Array(data);
          const modelId = `model-${Date.now()}`;
          console.log(`[ThatOpenViewer] Loading fragments file: ${buffer.length} bytes, modelId: ${modelId}`);

          const model = await fragments.core.load(buffer, {
            modelId,
            camera: worldRef.current.camera.three,
          });
          
          console.log('[ThatOpenViewer] Fragments model loaded:', model);

          worldRef.current.scene.three.add(model.object);
          await fragments.core.update(true);

          setLoadProgress({ stage: 'processing', percent: 90, currentOperation: 'Finalizing model...' });
        }

        setLoadProgress({ stage: 'ready', percent: 100, currentOperation: 'Complete' });

        const modelId = `model-${Date.now()}`;
        setViewerState((s) => ({ ...s, isLoading: false, activeModel: modelId }));

        // CRITICAL FIX: Sync with global BIM store so Analytics and Chat have model context
        // This creates a BIMModel structure from the loaded IFC data
        const bimModel = {
          id: modelId,
          name: url.split('/').pop() || 'IFC Model',
          source: format === 'ifc' ? 'ifc' : 'ifc', // Source type for BIMModel
          createdAt: new Date(),
          updatedAt: new Date(),
          elements: [], // Elements will be extracted via FragmentsManager queries
          levels: [],
          metadata: {
            fileSize: data.byteLength,
            format: format,
            loadedAt: new Date().toISOString(),
          },
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCurrentModel(bimModel as any);
        console.log('[ThatOpenViewer] Model synced to BIM store:', modelId);

        onModelLoaded?.(modelId);

        setTimeout(() => setLoadProgress(null), 1000);
      } catch (err) {
        console.error('[ThatOpenViewer] Load error:', err);
        const error = err instanceof Error ? err : new Error('Failed to load model');
        setViewerState((s) => ({ ...s, isLoading: false, error: error.message }));
        setLoadProgress(null);
        onError?.(error);
        throw error;
      }
    },
    [onModelLoaded, onError, setCurrentModel]
  );

  // ============================================
  // Handle File Upload
  // ============================================

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const extension = file.name.split('.').pop()?.toLowerCase();

      if (extension === 'ifc') {
        const url = URL.createObjectURL(file);
        try {
          await loadModel(url, 'ifc');
        } finally {
          URL.revokeObjectURL(url);
        }
      } else if (extension === 'frag') {
        const url = URL.createObjectURL(file);
        try {
          await loadModel(url, 'fragments');
        } finally {
          URL.revokeObjectURL(url);
        }
      } else {
        setViewerState((s) => ({
          ...s,
          error: `Unsupported format: .${extension}. Use IFC or FRAG files.`,
        }));
      }
    },
    [loadModel]
  );

  // ============================================
  // Render
  // ============================================

  return (
    <div className={cn('relative w-full h-full bg-muted', className)}>
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {(viewerState.isLoading || loadProgress) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <div className="flex-1">
                <span className="font-medium block">
                  {loadProgress?.currentOperation || t('viewer.loading')}
                </span>
                {loadProgress && (
                  <span className="text-xs text-muted-foreground">
                    {loadProgress.stage === 'downloading' && t('viewer.fetchingFile')}
                    {loadProgress.stage === 'parsing' && t('viewer.processingIFC')}
                    {loadProgress.stage === 'processing' && t('viewer.buildingScene')}
                    {loadProgress.stage === 'ready' && t('viewer.readyToView')}
                  </span>
                )}
              </div>
              {loadProgress && (
                <span className="text-sm font-medium text-emerald-600">
                  {loadProgress.percent}%
                </span>
              )}
            </div>
            {loadProgress && (
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-150 ease-out"
                  style={{ width: `${loadProgress.percent}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {viewerState.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-md mx-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">{t('common.error')}</h3>
                <p className="text-sm text-muted-foreground/60">{viewerState.error}</p>
              </div>
            </div>
            <button
              onClick={() => setViewerState((s) => ({ ...s, error: null }))}
              className="mt-4 w-full px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors"
            >
              {t('common.dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* Empty State with Upload */}
      {viewerState.isInitialized && !viewerState.activeModel && !viewerState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <label className="pointer-events-auto cursor-pointer">
            <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors">
              <Upload className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium text-foreground">{t('viewer.uploadBIMModel')}</p>
                <p className="text-sm text-muted-foreground">{t('viewer.supportedFormats')}</p>
              </div>
            </div>
            <input
              type="file"
              accept=".ifc,.frag"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      )}
    </div>
  );
}

export default ThatOpenViewer;
