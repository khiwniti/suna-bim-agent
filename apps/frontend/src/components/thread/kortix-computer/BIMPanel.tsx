'use client';

import { Suspense, lazy } from 'react';
import { useKortixComputerStore } from '@/stores/kortix-computer-store';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Box, Layers, TreePine, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const BIMViewer = lazy(() => import('./BIMViewer'));

export function BIMPanel() {
  const { loadedModel, analysisResults, selectedElements } = useKortixComputerStore();

  const latestResult = analysisResults[analysisResults.length - 1] ?? null;

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="viewer" className="flex-1 flex flex-col">
        <TabsList className="grid grid-cols-4 w-full rounded-none border-b">
          <TabsTrigger value="viewer" className="flex items-center gap-1.5 text-xs">
            <Box className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">3D</span>
          </TabsTrigger>
          <TabsTrigger value="elements" className="flex items-center gap-1.5 text-xs">
            <Layers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Elements</span>
          </TabsTrigger>
          <TabsTrigger value="carbon" className="flex items-center gap-1.5 text-xs">
            <TreePine className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Carbon</span>
          </TabsTrigger>
          <TabsTrigger value="issues" className="flex items-center gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Issues</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="viewer" className="flex-1 mt-0 overflow-hidden">
          <Suspense fallback={<BIMViewerSkeleton />}>
            {loadedModel ? (
              <BIMViewer
                modelUrl={loadedModel.filePath}
                selectedElements={selectedElements}
                highlights={[]}
              />
            ) : (
              <NoModelPlaceholder />
            )}
          </Suspense>
        </TabsContent>

        <TabsContent value="elements" className="flex-1 mt-0 overflow-auto p-3">
          <ElementList />
        </TabsContent>

        <TabsContent value="carbon" className="flex-1 mt-0 overflow-auto p-3">
          <CarbonSummary result={latestResult} />
        </TabsContent>

        <TabsContent value="issues" className="flex-1 mt-0 overflow-auto p-3">
          <IssuesList result={latestResult} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BIMViewerSkeleton() {
  return (
    <div className="flex items-center justify-center h-full bg-muted/30">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-8 rounded-full mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  );
}

function NoModelPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-muted/20 text-muted-foreground gap-3">
      <Box className="h-12 w-12 opacity-30" />
      <div className="text-center">
        <p className="font-medium text-sm">ยังไม่ได้โหลดโมเดล</p>
        <p className="text-xs opacity-70">อัปโหลดไฟล์ IFC หรือขอให้เอเจนต์วิเคราะห์</p>
      </div>
    </div>
  );
}

function ElementList() {
  const { selectedElements } = useKortixComputerStore();
  if (selectedElements.length === 0) {
    return <p className="text-sm text-muted-foreground">ไม่ได้เลือกองค์ประกอบ</p>;
  }
  return (
    <ul className="space-y-1">
      {selectedElements.map((id) => (
        <li key={id} className="text-xs font-mono bg-muted rounded px-2 py-1">{id}</li>
      ))}
    </ul>
  );
}

function CarbonSummary({ result }: { result: any }) {
  if (!result || result.type !== 'carbon_footprint') {
    return <p className="text-sm text-muted-foreground">ยังไม่มีผลการวิเคราะห์คาร์บอน</p>;
  }
  const data = result as import('@/types/bim').CarbonAnalysisResult;
  return (
    <div className="space-y-3">
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
        <p className="text-xs text-muted-foreground">คาร์บอนทั้งหมด</p>
        <p className="text-2xl font-bold text-green-700 dark:text-green-400">
          {data.totalEmbodiedCarbon?.toLocaleString()}{' '}
          <span className="text-sm font-normal">kgCO₂e</span>
        </p>
      </div>
      {data.byElementType?.map((item) => (
        <div key={item.elementType} className="flex justify-between text-sm">
          <span>{item.elementType}</span>
          <span className="font-medium">{item.percentage}%</span>
        </div>
      ))}
    </div>
  );
}

function IssuesList({ result }: { result: any }) {
  if (!result || (result.type !== 'clash_detection' && result.type !== 'code_compliance')) {
    return <p className="text-sm text-muted-foreground">ยังไม่มีผลการตรวจสอบ</p>;
  }

  type ClashItem = { id: string; severity: string };
  const items: ClashItem[] =
    result.type === 'clash_detection'
      ? (result as import('@/types/bim').ClashDetectionResult).clashes
      : (result as import('@/types/bim').CodeComplianceResult).violations;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">พบ {items.length} รายการ</p>
      {items.map((item, i) => (
        <div key={item.id ?? i} className="bg-red-50 dark:bg-red-900/20 rounded p-2 text-xs">
          <span className="font-medium">{item.id || `#${i + 1}`}</span>
          {item.severity && (
            <span className="ml-2 text-red-600 dark:text-red-400">{item.severity}</span>
          )}
        </div>
      ))}
    </div>
  );
}
