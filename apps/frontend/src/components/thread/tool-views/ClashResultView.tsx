'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ToolViewProps } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClashDetectionResult } from '@/types/bim';
import { useCarbonBIMComputerStore } from '@/stores/carbon-bim-computer-store';

function parseClashResult(toolResult: ToolViewProps['toolResult']): ClashDetectionResult | null {
  if (!toolResult?.output) return null;
  try {
    const raw = typeof toolResult.output === 'string' ? JSON.parse(toolResult.output) : toolResult.output;
    const data = raw?.result ?? raw;
    if (data?.type === 'clash_detection') return data as ClashDetectionResult;
  } catch {
    // ignore parse errors
  }
  return null;
}

const SEVERITY_CONFIG = {
  hard: {
    label: 'วิกฤต',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    cardClass: 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800',
    textClass: 'text-red-700 dark:text-red-400',
  },
  soft: {
    label: 'สำคัญ',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    cardClass: 'border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800',
    textClass: 'text-orange-700 dark:text-orange-400',
  },
  warning: {
    label: 'เล็กน้อย',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    cardClass: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800',
    textClass: 'text-yellow-700 dark:text-yellow-400',
  },
} as const;

export function ClashResultView({ toolCall, toolResult, isStreaming }: ToolViewProps) {
  const setSelectedElements = useCarbonBIMComputerStore((s) => s.setSelectedElements);
  const setActiveView = useCarbonBIMComputerStore((s) => s.setActiveView);

  const result = parseClashResult(toolResult);

  if (isStreaming || !result) {
    return (
      <Card className="m-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            ผลการตรวจจับการชน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {isStreaming ? 'กำลังตรวจสอบ...' : 'ไม่มีข้อมูลผลการตรวจสอบ'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { bySeverity } = result.summary;

  const handleViewInModel = (clashId: string) => {
    const clash = result.clashes.find((c) => c.id === clashId);
    if (!clash) return;
    const ids = [clash.element1.globalId, clash.element2.globalId].filter(Boolean);
    setSelectedElements(ids);
    setActiveView('bim' as any);
  };

  const handleViewAll = () => {
    const allIds = result.clashes.flatMap((c) => [c.element1.globalId, c.element2.globalId]);
    setSelectedElements([...new Set(allIds)]);
    setActiveView('bim' as any);
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Header with icon and title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h3 className="text-base font-semibold">ผลการตรวจจับการชน</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {result.totalClashes} รายการ
        </Badge>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {(['hard', 'soft', 'warning'] as const).map((severity) => {
          const cfg = SEVERITY_CONFIG[severity];
          return (
            <Card key={severity} className={cfg.cardClass}>
              <CardContent className="px-3 py-2 text-center">
                <p className={`text-2xl font-bold ${cfg.textClass}`}>
                  {bySeverity[severity] ?? 0}
                </p>
                <p className={`text-xs ${cfg.textClass}`}>{cfg.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View all button */}
      {result.totalClashes > 0 && (
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2 text-xs"
          onClick={handleViewAll}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          ดูทั้งหมดในโมเดล ({result.totalClashes} รายการ)
        </Button>
      )}

      {/* Clash list */}
      {result.clashes.length > 0 && (
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-sm">รายการชน</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <ScrollArea className="max-h-72">
              <div className="flex flex-col divide-y">
                {result.clashes.map((clash) => {
                  const cfg = SEVERITY_CONFIG[clash.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG['warning'];
                  return (
                    <div key={clash.id} className="flex flex-col gap-1 px-1 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${cfg.badgeClass}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {clash.clashType}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto h-6 px-2 text-[10px]"
                          onClick={() => handleViewInModel(clash.id)}
                        >
                          ดูในโมเดล
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className="rounded bg-muted/50 px-2 py-1 text-[10px]">
                          <p className="font-medium truncate">{clash.element1.name}</p>
                          <p className="text-muted-foreground capitalize">{clash.element1.discipline}</p>
                        </div>
                        <div className="rounded bg-muted/50 px-2 py-1 text-[10px]">
                          <p className="font-medium truncate">{clash.element2.name}</p>
                          <p className="text-muted-foreground capitalize">{clash.element2.discipline}</p>
                        </div>
                      </div>
                      {clash.location.storey && (
                        <p className="text-[10px] text-muted-foreground">ชั้น: {clash.location.storey}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
