'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { ToolViewProps } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CodeComplianceResult } from '@/types/bim';

function parseComplianceResult(toolResult: ToolViewProps['toolResult']): CodeComplianceResult | null {
  if (!toolResult?.output) return null;
  try {
    const raw = typeof toolResult.output === 'string' ? JSON.parse(toolResult.output) : toolResult.output;
    const data = raw?.result ?? raw;
    if (data?.type === 'code_compliance') return data as CodeComplianceResult;
  } catch {
    // ignore parse errors
  }
  return null;
}

const STATUS_CONFIG = {
  pass: {
    label: 'ผ่าน',
    icon: <CheckCircle className="h-3.5 w-3.5 text-green-600" />,
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  fail: {
    label: 'ไม่ผ่าน',
    icon: <XCircle className="h-3.5 w-3.5 text-red-600" />,
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  },
  warning: {
    label: 'คำเตือน',
    icon: <AlertCircle className="h-3.5 w-3.5 text-yellow-600" />,
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  not_applicable: {
    label: 'ไม่เกี่ยวข้อง',
    icon: <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />,
    badgeClass: 'bg-muted text-muted-foreground',
  },
} as const;

const OVERALL_CONFIG = {
  compliant: {
    label: 'ผ่านการตรวจสอบ',
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    cardClass: 'border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800',
    textClass: 'text-green-800 dark:text-green-300',
  },
  non_compliant: {
    label: 'ไม่ผ่านการตรวจสอบ',
    icon: <XCircle className="h-5 w-5 text-red-600" />,
    cardClass: 'border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800',
    textClass: 'text-red-800 dark:text-red-300',
  },
  needs_review: {
    label: 'ต้องตรวจสอบเพิ่มเติม',
    icon: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    cardClass: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800',
    textClass: 'text-yellow-800 dark:text-yellow-300',
  },
} as const;

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'วิกฤต',
  major: 'สำคัญ',
  minor: 'เล็กน้อย',
};

export function ComplianceResultView({ toolCall, toolResult, isStreaming }: ToolViewProps) {
  const result = parseComplianceResult(toolResult);

  if (isStreaming || !result) {
    return (
      <Card className="m-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-4 w-4 text-blue-500" />
            ผลการตรวจสอบมาตรฐาน
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

  const overallCfg = OVERALL_CONFIG[result.overallCompliance];

  // Group codes by prefix (e.g. "มยผ." group)
  const codesByGroup = result.codesChecked.reduce<Record<string, typeof result.codesChecked>>((acc, c) => {
    const group = c.code.split(' ')[0] ?? c.code;
    if (!acc[group]) acc[group] = [];
    acc[group].push(c);
    return acc;
  }, {});

  const passCount = result.codesChecked.filter((c) => c.status === 'pass').length;
  const failCount = result.codesChecked.filter((c) => c.status === 'fail').length;
  const warnCount = result.codesChecked.filter((c) => c.status === 'warning').length;

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Overall status card */}
      <Card className={overallCfg.cardClass}>
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3">
            {overallCfg.icon}
            <div className="flex-1">
              <p className={`font-semibold ${overallCfg.textClass}`}>{overallCfg.label}</p>
              <p className={`text-xs ${overallCfg.textClass} opacity-80`}>ผลการตรวจสอบมาตรฐาน</p>
            </div>
            <div className={`text-right`}>
              <p className={`text-2xl font-bold ${overallCfg.textClass}`}>{result.complianceScore}%</p>
              <p className={`text-[10px] ${overallCfg.textClass} opacity-80`}>คะแนน</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="px-3 py-2 text-center">
            <p className="text-xl font-bold text-green-700 dark:text-green-400">{passCount}</p>
            <p className="text-[11px] text-green-600 dark:text-green-500">ผ่าน</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="px-3 py-2 text-center">
            <p className="text-xl font-bold text-red-700 dark:text-red-400">{failCount}</p>
            <p className="text-[11px] text-red-600 dark:text-red-500">ไม่ผ่าน</p>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
          <CardContent className="px-3 py-2 text-center">
            <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{warnCount}</p>
            <p className="text-[11px] text-yellow-600 dark:text-yellow-500">คำเตือน</p>
          </CardContent>
        </Card>
      </div>

      {/* Codes grouped by standard */}
      {Object.entries(codesByGroup).map(([group, codes]) => (
        <Card key={group}>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-sm">{group}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="flex flex-col gap-2">
              {codes.map((code) => {
                const cfg = STATUS_CONFIG[code.status];
                return (
                  <div key={code.code} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium truncate">{code.name}</p>
                        <span className={`ml-auto shrink-0 inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${cfg.badgeClass}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{code.code} v{code.version}</p>
                      {code.details && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{code.details}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Violations */}
      {result.violations.length > 0 && (
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-sm text-destructive">ข้อบกพร่อง ({result.violations.length})</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-2">
            <ScrollArea className="max-h-72">
              <div className="flex flex-col divide-y">
                {result.violations.map((v) => (
                  <div key={v.id} className="flex flex-col gap-1 px-1 py-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={v.severity === 'critical' ? 'destructive' : 'secondary'}
                        className="text-[10px]"
                      >
                        {SEVERITY_LABEL[v.severity] ?? v.severity}
                      </Badge>
                      <span className="text-[10px] font-medium text-muted-foreground">{v.code}</span>
                    </div>
                    <p className="text-xs">{v.requirementThai || v.requirement}</p>
                    <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                      <span>ค่าที่ต้องการ: <span className="font-medium">{String(v.requiredValue)}</span></span>
                      <span>ค่าจริง: <span className="font-medium text-red-600">{String(v.actualValue)}</span></span>
                    </div>
                    {v.recommendationThai && (
                      <p className="text-[10px] text-muted-foreground">{v.recommendationThai}</p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Fire safety */}
      {result.fireSafety && (
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-sm">ความปลอดภัยด้านอัคคีภัย</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(result.fireSafety).map(([key, val]) => {
                const labelMap: Record<string, string> = {
                  egressWidth: 'ความกว้างทางออก',
                  exitCount: 'จำนวนทางออก',
                  travelDistance: 'ระยะทางเดิน',
                  fireRating: 'อัตราทนไฟ',
                };
                return (
                  <div key={key} className="flex items-center gap-1.5 text-xs">
                    {val.pass ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    )}
                    <span className="text-muted-foreground">{labelMap[key] ?? key}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
