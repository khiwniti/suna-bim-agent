/**
 * BOQ Analyzer Component
 *
 * Upload and analyze Bill of Quantities documents using AI.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Leaf,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/provider';
import { BOQAnalysisResult } from '@/lib/boq/types';

interface BOQAnalyzerProps {
  onAnalysisComplete?: (result: BOQAnalysisResult) => void;
  className?: string;
}

export function BOQAnalyzer({ onAnalysisComplete, className }: BOQAnalyzerProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'converting' | 'analyzing' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BOQAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [pdfjsLib, setPdfjsLib] = useState<typeof import('pdfjs-dist') | null>(null);

  // Load pdfjs dynamically on client side
  useEffect(() => {
    const loadPdfjs = async () => {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
      setPdfjsLib(pdfjs);
    };
    loadPdfjs();
  }, []);

  const convertPDFToImages = async (file: File): Promise<string[]> => {
    if (!pdfjsLib) throw new Error('PDF library not loaded');

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];

    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
      setProgress((i / pdf.numPages) * 50);

      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext('2d');
      if (!context) continue;

      await page.render({
        canvasContext: context,
        viewport,
        canvas,
      } as Parameters<typeof page.render>[0]).promise;

      images.push(canvas.toDataURL('image/png'));
    }

    return images;
  };

  const analyzeDocument = async (pageImages: string[]) => {
    const formData = new FormData();
    pageImages.forEach((img) => formData.append('pageImages', img));

    const response = await fetch('/api/boq/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Analysis failed');
    }

    return response.json() as Promise<BOQAnalysisResult>;
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setStatus('converting');
    setProgress(0);
    setError(null);
    setResult(null);

    try {
      // Convert PDF to images
      const pageImages = await convertPDFToImages(file);

      setStatus('analyzing');
      setProgress(50);

      // Analyze with AI
      const analysisResult = await analyzeDocument(pageImages);

      setProgress(100);
      setResult(analysisResult);
      setStatus('complete');
      onAnalysisComplete?.(analysisResult);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Analysis failed');
      setStatus('error');
    }
  }, [onAnalysisComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800', className)}>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
          <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('boqAnalyzer.title')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('boqAnalyzer.description')}
          </p>
        </div>
      </div>

      {/* Upload Area */}
      {status === 'idle' && (
        <div
          {...getRootProps()}
          className={cn(
            'cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            isDragActive
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-slate-300 hover:border-emerald-400 dark:border-slate-600'
          )}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto mb-4 h-12 w-12 text-slate-400" />
          <p className="mb-2 text-slate-900 dark:text-white">
            {isDragActive ? t('boqAnalyzer.dropFile') : t('boqAnalyzer.dragDrop')}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('boqAnalyzer.supportedFormats')}
          </p>
        </div>
      )}

      {/* Processing State */}
      {(status === 'converting' || status === 'analyzing') && (
        <div className="rounded-lg bg-slate-50 p-8 text-center dark:bg-slate-900/50">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-emerald-500" />
          <p className="mb-2 text-slate-900 dark:text-white">
            {status === 'converting' ? t('boqAnalyzer.converting') : t('boqAnalyzer.analyzing')}
          </p>
          <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-slate-500">{Math.round(progress)}%</p>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="rounded-lg bg-red-50 p-8 text-center dark:bg-red-900/20">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="mb-2 text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => setStatus('idle')}
            className="text-sm text-red-600 underline hover:no-underline"
          >
            {t('common.tryAgain')}
          </button>
        </div>
      )}

      {/* Results */}
      {status === 'complete' && result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-4 dark:bg-emerald-900/20">
            <CheckCircle className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-700 dark:text-emerald-300">
                {t('boqAnalyzer.analysisComplete')}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {t('boqAnalyzer.foundItems', { items: result.summary.totalItems, pages: result.metadata.pageCount })}
              </p>
            </div>
          </div>

          {/* Carbon Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('boqAnalyzer.totalCarbon')}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatNumber(result.summary.totalCarbon)} <span className="text-sm font-normal">kgCO2e</span>
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('boqAnalyzer.matchedItems')}</p>
              <p className="text-2xl font-bold text-emerald-600">
                {result.summary.matchedItems} <span className="text-sm font-normal">/ {result.summary.totalItems}</span>
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900/50">
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('boqAnalyzer.categories')}</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {result.summary.categories.length}
              </p>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="space-y-2">
            <h3 className="font-medium text-slate-900 dark:text-white">{t('boqAnalyzer.categoryBreakdown')}</h3>
            {result.summary.categories.map((cat) => (
              <div key={cat.category} className="rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => toggleCategory(cat.category)}
                  className="flex w-full items-center justify-between p-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Leaf className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium text-slate-900 dark:text-white">{cat.category}</span>
                    <span className="text-sm text-slate-500">({cat.count} items)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {formatNumber(cat.carbon)} kgCO2e
                    </span>
                    {expandedCategories.has(cat.category) ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {expandedCategories.has(cat.category) && (
                  <div className="border-t border-slate-200 p-3 dark:border-slate-700">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500">
                          <th className="pb-2">{t('boqAnalyzer.item')}</th>
                          <th className="pb-2">{t('boqAnalyzer.itemDescription')}</th>
                          <th className="pb-2 text-right">{t('boqAnalyzer.qty')}</th>
                          <th className="pb-2 text-right">{t('boqAnalyzer.co2e')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.items
                          .filter((item) => item.category === cat.category)
                          .map((item) => (
                            <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                              <td className="py-2 text-slate-600 dark:text-slate-400">{item.itemNumber}</td>
                              <td className="py-2 text-slate-900 dark:text-white">{item.description}</td>
                              <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                                {formatNumber(item.quantity)} {item.unit}
                              </td>
                              <td className="py-2 text-right text-emerald-600">
                                {formatNumber(item.carbonFootprint?.total || 0)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStatus('idle')}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              {t('boqAnalyzer.analyzeAnother')}
            </button>
            <button
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
            >
              <Download className="h-4 w-4" />
              {t('boqAnalyzer.exportResults')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
