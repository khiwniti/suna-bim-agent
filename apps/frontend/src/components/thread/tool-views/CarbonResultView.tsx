'use client';

import React from 'react';
import { TreePine } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ToolViewProps } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CarbonAnalysisResult } from '@/types/bim';

const COLORS = ['#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#86efac', '#4ade80'];

function parseCarbonResult(toolResult: ToolViewProps['toolResult']): CarbonAnalysisResult | null {
  if (!toolResult?.output) return null;
  try {
    const raw = typeof toolResult.output === 'string' ? JSON.parse(toolResult.output) : toolResult.output;
    const data = raw?.result ?? raw;
    if (data?.type === 'carbon_footprint') return data as CarbonAnalysisResult;
  } catch {
    // ignore parse errors
  }
  return null;
}

export function CarbonResultView({ toolCall, toolResult, isStreaming }: ToolViewProps) {
  const result = parseCarbonResult(toolResult);

  if (isStreaming || !result) {
    return (
      <Card className="m-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TreePine className="h-4 w-4 text-green-600" />
            การวิเคราะห์คาร์บอน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {isStreaming ? 'กำลังวิเคราะห์...' : 'ไม่มีข้อมูลผลการวิเคราะห์'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalCarbon = result.totalEmbodiedCarbon;
  const unit = 'kgCO2e';

  const byMaterial = result.byMaterial ?? [];
  const byElementType = result.byElementType ?? [];

  const pieData = byMaterial.slice(0, 7).map((m) => ({
    name: m.materialName,
    value: m.embodiedCarbon,
    percentage: m.percentage,
  }));

  const barData = byElementType.slice(0, 8).map((e) => ({
    name: e.elementType.replace('Ifc', ''),
    carbon: Math.round(e.totalCarbon),
  }));

  const benchmarkLabel: Record<string, string> = {
    below_average: 'ต่ำกว่าค่าเฉลี่ย',
    average: 'ค่าเฉลี่ย',
    above_average: 'สูงกว่าค่าเฉลี่ย',
    excellent: 'ดีเยี่ยม',
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Total card */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardContent className="pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <TreePine className="h-5 w-5 text-green-700 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs text-green-700 dark:text-green-400">ปริมาณคาร์บอนทั้งหมด</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                {totalCarbon.toLocaleString()} <span className="text-sm font-normal">{unit}</span>
              </p>
            </div>
          </div>
          {result.thaiContext && (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-green-400 text-green-700 dark:text-green-400">
                {benchmarkLabel[result.thaiContext.benchmarkComparison] ?? result.thaiContext.benchmarkComparison}
              </Badge>
              {result.thaiContext.complianceWithEITStandards && (
                <Badge variant="outline" className="text-xs border-green-400 text-green-700 dark:text-green-400">
                  มาตรฐาน EIT ✓
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {/* Pie chart */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground">สัดส่วนตามวัสดุ</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65}>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value.toLocaleString()} ${unit}`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Bar chart */}
        {barData.length > 0 && (
          <Card>
            <CardHeader className="pb-1 pt-3 px-3">
              <CardTitle className="text-xs text-muted-foreground">ตามประเภทองค์ประกอบ</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-2">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
                  <Tooltip formatter={(v: number) => [`${v.toLocaleString()} ${unit}`, 'คาร์บอน']} />
                  <Bar dataKey="carbon" fill="#22c55e" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Breakdown list */}
      {byMaterial.length > 0 && (
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-sm">รายละเอียดตามหมวดหมู่</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="flex flex-col gap-1.5">
              {byMaterial.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="flex-1 truncate text-xs">{m.materialName}</span>
                  <span className="text-xs text-muted-foreground">{m.percentage.toFixed(1)}%</span>
                  <span className="text-xs font-medium">{m.embodiedCarbon.toLocaleString()} {unit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {(result.recommendations ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-1 pt-3 px-3">
            <CardTitle className="text-sm">ข้อเสนอแนะ</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="flex flex-col gap-2">
              {(result.recommendations ?? []).slice(0, 3).map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <Badge
                    variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'secondary' : 'outline'}
                    className="mt-0.5 shrink-0 text-[10px]"
                  >
                    {rec.priority === 'high' ? 'สูง' : rec.priority === 'medium' ? 'กลาง' : 'ต่ำ'}
                  </Badge>
                  <p className="text-muted-foreground">{rec.description}</p>
                  <span className="ml-auto shrink-0 font-medium text-green-700">
                    -{rec.potentialSavings.toLocaleString()} {unit}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
