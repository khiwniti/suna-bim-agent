'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileImage,
  X,
  Check,
  AlertCircle,
  Loader2,
  Building2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { cn, generateId } from '@/lib/utils';
import { useAuth } from '@/hooks';
import { useTranslation } from '@/i18n/provider';
import type { FloorPlan, BIMModel, BIMElement } from '@/types';
import type { PipelineResult } from '@/lib/pipeline';

interface FloorPlanUploadProps {
  onClose: () => void;
  onComplete: (model: BIMModel) => void;
}

/**
 * Convert file to base64
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert pipeline result to BIMModel
 */
function convertToBIMModel(result: PipelineResult, floorPlan: FloorPlan): BIMModel {
  const elements: BIMElement[] = [];

  if (result.analysis) {
    // Convert walls to BIM elements
    result.analysis.walls.forEach((wall, i) => {
      elements.push({
        id: wall.id || `wall-${i}`,
        globalId: generateId(),
        type: 'wall',
        name: `Wall ${i + 1}`,
        level: 'Ground Floor',
        material: wall.type === 'exterior' ? 'Concrete' : 'Drywall',
        properties: {
          isExternal: wall.type === 'exterior',
          thickness: wall.thickness,
          height: wall.height,
        },
        geometry: {
          position: {
            x: (wall.start.x + wall.end.x) / 2,
            y: wall.height / 2,
            z: (wall.start.y + wall.end.y) / 2,
          },
          rotation: { x: 0, y: 0, z: 0 },
          scale: {
            x: Math.abs(wall.end.x - wall.start.x) || wall.thickness,
            y: wall.height,
            z: Math.abs(wall.end.y - wall.start.y) || wall.thickness,
          },
          boundingBox: {
            min: { x: Math.min(wall.start.x, wall.end.x), y: 0, z: Math.min(wall.start.y, wall.end.y) },
            max: { x: Math.max(wall.start.x, wall.end.x), y: wall.height, z: Math.max(wall.start.y, wall.end.y) },
          },
        },
        sustainability: {
          embodiedCarbon: wall.type === 'exterior' ? 450 : 45,
          material: {
            type: wall.type === 'exterior' ? 'Concrete' : 'Drywall',
            quantity: wall.thickness * wall.height,
            unit: 'm³',
            carbonFactor: wall.type === 'exterior' ? 30 : 1.8,
            source: 'ICE Database',
            recyclable: true,
            recycledContent: 20,
          },
        },
      });
    });

    // Convert openings to BIM elements
    result.analysis.openings.forEach((opening, i) => {
      elements.push({
        id: opening.id || `opening-${i}`,
        globalId: generateId(),
        type: opening.type === 'door' ? 'door' : 'window',
        name: `${opening.type === 'door' ? 'Door' : 'Window'} ${i + 1}`,
        level: 'Ground Floor',
        material: opening.type === 'door' ? 'Wood' : 'Double Glazed',
        properties: {
          width: opening.width,
          height: opening.height,
          wallId: opening.wallId,
        },
        geometry: {
          position: {
            x: opening.position.x,
            y: opening.height / 2,
            z: opening.position.y,
          },
          rotation: { x: 0, y: 0, z: 0 },
          scale: {
            x: opening.width,
            y: opening.height,
            z: 0.1,
          },
          boundingBox: {
            min: { x: opening.position.x - opening.width / 2, y: 0, z: opening.position.y - 0.05 },
            max: { x: opening.position.x + opening.width / 2, y: opening.height, z: opening.position.y + 0.05 },
          },
        },
        sustainability: {
          embodiedCarbon: opening.type === 'door' ? 25 : 35,
          material: {
            type: opening.type === 'door' ? 'Timber' : 'Glass',
            quantity: opening.width * opening.height,
            unit: 'm²',
            carbonFactor: opening.type === 'door' ? -500 : 19,
            source: 'ICE Database',
            recyclable: true,
            recycledContent: 10,
          },
        },
      });
    });

    // Convert rooms to space elements
    result.analysis.rooms.forEach((room, i) => {
      elements.push({
        id: room.id || `room-${i}`,
        globalId: generateId(),
        type: 'space',
        name: room.label || room.type,
        level: 'Ground Floor',
        properties: {
          area: room.areaSquareMeters,
          function: room.type,
        },
        geometry: {
          position: {
            x: room.centroid.x,
            y: 0.01,
            z: room.centroid.y,
          },
          rotation: { x: 0, y: 0, z: 0 },
          scale: {
            x: Math.sqrt(room.areaSquareMeters),
            y: 0.02,
            z: Math.sqrt(room.areaSquareMeters),
          },
          boundingBox: {
            min: { x: room.centroid.x - 5, y: 0, z: room.centroid.y - 5 },
            max: { x: room.centroid.x + 5, y: 0.02, z: room.centroid.y + 5 },
          },
        },
      });
    });
  }

  const totalArea = result.scene3D?.metadata?.floorArea ||
    (result.analysis?.rooms.reduce((sum, r) => sum + r.areaSquareMeters, 0) || 100);

  return {
    id: generateId(),
    name: floorPlan.name.replace(/\.[^.]+$/, ''),
    description: 'Generated from floor plan via AI analysis',
    createdAt: new Date(),
    updatedAt: new Date(),
    source: 'floorplan',
    fileUrl: floorPlan.imageUrl,
    elements,
    levels: [{ id: 'level-0', name: 'Ground Floor', elevation: 0, height: result.scene3D?.metadata?.wallHeight || 2.8 }],
    metadata: {
      totalArea,
      totalVolume: totalArea * (result.scene3D?.metadata?.wallHeight || 2.8),
      elementCount: elements.length,
      levelCount: 1,
      boundingBox: result.scene3D?.boundingBox || { min: { x: 0, y: 0, z: 0 }, max: { x: 10, y: 3, z: 10 } },
      units: 'metric',
    },
    sustainability: {
      totalEmbodiedCarbon: elements.reduce((sum, e) => sum + (e.sustainability?.embodiedCarbon || 0), 0),
      totalOperationalCarbon: totalArea * 25, // Estimate
      energyUseIntensity: 145,
      carbonIntensity: 10.4,
      certifications: [],
      rating: 'B',
      recommendations: [],
    },
  };
}

export function FloorPlanUpload({ onClose, onComplete }: FloorPlanUploadProps) {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [floorPlan, setFloorPlan] = useState<FloorPlan | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // Real API processing
  const processFloorPlan = useCallback(async (fp: FloorPlan, file: File) => {
    setError(null);
    setProcessingStage(t('floorPlanUpload.uploading'));
    setFloorPlan({ ...fp, status: 'uploading' });

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);

      setProcessingStage(t('floorPlanUpload.analyzing'));
      setFloorPlan(prev => prev ? { ...prev, status: 'processing' } : prev);

      // Call the API
      const response = await fetch('/api/floor-plan/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: base64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const result: PipelineResult = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      setProcessingStage(t('floorPlanUpload.generating'));
      setFloorPlan(prev => prev ? { ...prev, status: 'detected' } : prev);

      // Convert to BIM model
      const bimModel = convertToBIMModel(result, fp);

      setProcessingStage(t('floorPlanUpload.ready'));
      setFloorPlan(prev => prev ? { ...prev, status: 'ready', processedModel: bimModel } : prev);

      // Auto-complete after a moment
      setTimeout(() => {
        onComplete(bimModel);
      }, 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setFloorPlan(prev => prev ? { ...prev, status: 'error', error: errorMessage } : prev);
    }
  }, [onComplete, t]);

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PNG, JPG, or WebP image.');
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setError('File size must be less than 20MB.');
      return;
    }

    // Create floor plan object
    const newFloorPlan: FloorPlan = {
      id: generateId(),
      name: file.name,
      imageUrl: URL.createObjectURL(file),
      status: 'uploading',
    };

    setFloorPlan(newFloorPlan);

    // Process with real API
    await processFloorPlan(newFloorPlan, file);
  }, [processFloorPlan]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-card rounded-2xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-muted-foreground">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  // Require authentication
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md mx-4 bg-card rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-lg">{t('floorPlanUpload.signInRequired')}</h2>
            <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('common.authRequired')}</h3>
            <p className="text-muted-foreground mb-6">
              {t('floorPlanUpload.signInMessage')}
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => window.location.href = '/auth/signup'}>
                {t('common.createAccount')}
              </Button>
              <Button variant="primary" onClick={() => window.location.href = '/auth/login'}>
                {t('nav.signIn')}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl mx-4 bg-card rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{t('floorPlanUpload.title')}</h2>
              <p className="text-sm text-muted-foreground">
                {t('floorPlanUpload.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!floorPlan ? (
            // Upload zone
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent/30'
              )}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleFileInput}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-4">
                <div className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
                  dragActive ? 'bg-primary text-primary-foreground' : 'bg-accent'
                )}>
                  <FileImage className="w-8 h-8" />
                </div>

                <div>
                  <p className="font-medium text-lg">
                    {dragActive ? t('floorPlanUpload.dropHere') : t('floorPlanUpload.dragAndDrop')}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {t('floorPlanUpload.clickToBrowse')}
                  </p>
                </div>

                <Button variant="outline" className="mt-2">
                  {t('common.browseFiles')}
                </Button>
              </div>
            </div>
          ) : (
            // Processing view
            <div className="space-y-6">
              {/* Preview */}
              <div className="flex gap-4 p-4 bg-accent/30 rounded-xl">
                <div className="w-24 h-24 bg-background rounded-lg overflow-hidden flex-shrink-0">
                  {floorPlan.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={floorPlan.imageUrl}
                      alt="Floor plan preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{floorPlan.name}</h3>
                  <p className="text-sm text-muted-foreground">Floor plan image</p>

                  {/* Status */}
                  <div className="mt-3 flex items-center gap-2">
                    {floorPlan.status === 'ready' ? (
                      <>
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-sm text-emerald-600 font-medium">{t('floorPlanUpload.processingComplete')}</span>
                      </>
                    ) : floorPlan.status === 'error' ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-destructive" />
                        <span className="text-sm text-destructive">{error || floorPlan.error}</span>
                      </>
                    ) : (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">{processingStage}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && floorPlan.status === 'error' && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">{t('common.processingFailed')}</p>
                      <p className="mt-1">{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setFloorPlan(null);
                          setError(null);
                        }}
                      >
                        {t('common.tryAgain')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Processing stages */}
              <div className="space-y-3">
                <ProcessingStage
                  icon={<Upload className="w-4 h-4" />}
                  label={t('floorPlanUpload.stages.upload')}
                  status={getStageStatus(floorPlan.status, 'uploading')}
                />
                <ProcessingStage
                  icon={<Sparkles className="w-4 h-4" />}
                  label={t('floorPlanUpload.stages.aiAnalysis')}
                  status={getStageStatus(floorPlan.status, 'processing')}
                />
                <ProcessingStage
                  icon={<Building2 className="w-4 h-4" />}
                  label={t('floorPlanUpload.stages.generate3D')}
                  status={getStageStatus(floorPlan.status, 'detected')}
                />
                <ProcessingStage
                  icon={<Check className="w-4 h-4" />}
                  label={t('floorPlanUpload.stages.readyForAnalysis')}
                  status={getStageStatus(floorPlan.status, 'ready')}
                />
              </div>

              {/* Model stats preview */}
              {floorPlan.status === 'ready' && floorPlan.processedModel && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-4 gap-3 p-4 bg-accent/30 rounded-xl"
                >
                  <StatCard label={t('floorPlanUpload.stats.elements')} value={floorPlan.processedModel.elements.length.toString()} />
                  <StatCard label={t('floorPlanUpload.stats.floors')} value={floorPlan.processedModel.levels.length.toString()} />
                  <StatCard label={t('floorPlanUpload.stats.area')} value={`${(floorPlan.processedModel.metadata.totalArea ?? 0).toFixed(0)} m²`} />
                  <StatCard label={t('floorPlanUpload.stats.rating')} value={floorPlan.processedModel.sustainability?.rating || 'N/A'} />
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-accent/20">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          {floorPlan?.status === 'ready' && (
            <Button variant="primary" onClick={() => floorPlan.processedModel && onComplete(floorPlan.processedModel)}>
              {t('common.openInViewer')}
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ProcessingStage({
  icon,
  label,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-lg transition-colors',
      status === 'complete' && 'bg-emerald-500/10',
      status === 'active' && 'bg-primary/10',
      status === 'error' && 'bg-destructive/10',
      status === 'pending' && 'opacity-50'
    )}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center',
        status === 'complete' && 'bg-emerald-500 text-white',
        status === 'active' && 'bg-primary text-white',
        status === 'error' && 'bg-destructive text-white',
        status === 'pending' && 'bg-muted text-muted-foreground'
      )}>
        {status === 'complete' ? <Check className="w-4 h-4" /> :
         status === 'active' ? <Loader2 className="w-4 h-4 animate-spin" /> :
         status === 'error' ? <AlertCircle className="w-4 h-4" /> :
         icon}
      </div>
      <span className={cn(
        'font-medium',
        status === 'complete' && 'text-emerald-600',
        status === 'active' && 'text-primary',
        status === 'error' && 'text-destructive',
        status === 'pending' && 'text-muted-foreground'
      )}>
        {label}
      </span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function getStageStatus(
  currentStatus: FloorPlan['status'],
  checkStage: FloorPlan['status']
): 'pending' | 'active' | 'complete' | 'error' {
  if (currentStatus === 'error') {
    const stages: FloorPlan['status'][] = ['uploading', 'processing', 'detected', 'ready'];
    const currentIndex = stages.indexOf(checkStage);
    // Mark the current active stage as error
    if (currentIndex === stages.indexOf('processing') || currentIndex === stages.indexOf('detected')) {
      return 'error';
    }
  }

  const stages: FloorPlan['status'][] = ['uploading', 'processing', 'detected', 'ready'];
  const currentIndex = stages.indexOf(currentStatus);
  const checkIndex = stages.indexOf(checkStage);

  if (currentIndex > checkIndex) return 'complete';
  if (currentIndex === checkIndex) return 'active';
  return 'pending';
}

export default FloorPlanUpload;
