'use client';

/**
 * BOQTablePanel - Bill of Quantities Table
 *
 * Displays editable BOQ data with:
 * - Item list with quantities and costs
 * - Inline editing capabilities
 * - Sorting and filtering
 * - Export functionality
 * - Virtual scrolling for large datasets (1000+ rows)
 *
 * Features:
 * - Wrapped with Tambo's withTamboInteractable for AI control
 * - Receives data via Tambo props
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePanelStore } from '@/stores/panel-store';
import { useTranslation } from '@/i18n/provider';
import { Table, Download, Check, X } from 'lucide-react';
import {
  withTamboInteractable,
  type WithTamboInteractableProps,
} from '@tambo-ai/react';
import { BOQTableSchema, type BOQTableProps } from '@/lib/tambo/schemas';
import { PanelErrorBoundary } from './PanelErrorBoundary';

interface BOQItem {
  id: string;
  item: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

interface BOQData {
  items: BOQItem[];
  totalCost: number;
  currency: string;
}

// Editable cell state
interface EditingCell {
  rowId: string;
  field: 'quantity' | 'unitCost';
  value: string;
}

// ============================================
// Empty State Component
// ============================================

function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Table className="w-12 h-12 text-blue-500 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{t('workspacePanel.noBoqData')}</h3>
      <p className="text-sm text-muted-foreground">
        {t('workspacePanel.startBoqAnalysis')}
      </p>
    </div>
  );
}

// ============================================
// Inner Panel Content (accepts Tambo props)
// ============================================

interface BOQTableContentProps extends BOQTableProps, WithTamboInteractableProps {}

function BOQTableContent(props: BOQTableContentProps) {
  const {
    items: tamboItems,
    totalCost: tamboTotalCost,
    currency: tamboCurrency,
  } = props;

  const { t } = useTranslation();
  const [localData, setLocalData] = useState<BOQData | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const { updatePanelData } = usePanelStore();

  // Sync Tambo props to local state
  useEffect(() => {
    if (tamboItems && tamboItems.length > 0) {
      const items = tamboItems as BOQItem[];
      const totalCost = tamboTotalCost ?? items.reduce((sum, item) => sum + item.totalCost, 0);
      const currency = tamboCurrency ?? 'USD';
      setLocalData({ items, totalCost, currency });

      // Update panel store
      updatePanelData('boq-table', {
        state: { boqResults: { items, totalCost, currency } },
        lastActive: Date.now(),
        isDirty: false,
      });
    }
  }, [tamboItems, tamboTotalCost, tamboCurrency, updatePanelData]);

  // Use merged data
  const boqData = localData;

  // Handle export
  const handleExport = useCallback((format: 'excel' | 'pdf' | 'csv') => {
    // Update panel data with export request
    updatePanelData('boq-table', {
      state: { exportRequest: format },
      lastActive: Date.now(),
    });
  }, [updatePanelData]);

  // Start editing a cell
  const handleStartEdit = useCallback(
    (rowId: string, field: 'quantity' | 'unitCost', currentValue: number) => {
      setEditingCell({ rowId, field, value: currentValue.toString() });
    },
    []
  );

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingCell(null);
  }, []);

  // Save edited value
  const handleSaveEdit = useCallback(() => {
    if (!editingCell || !boqData) return;

    const newValue = parseFloat(editingCell.value);
    if (isNaN(newValue) || newValue < 0) {
      setEditingCell(null);
      return;
    }

    setLocalData((prev) => {
      if (!prev) return prev;

      const updatedItems = prev.items.map((item) => {
        if (item.id !== editingCell.rowId) return item;

        const updatedItem = { ...item, [editingCell.field]: newValue };
        // Recalculate total cost
        updatedItem.totalCost = updatedItem.quantity * updatedItem.unitCost;
        return updatedItem;
      });

      // Recalculate total project cost
      const newTotalCost = updatedItems.reduce((sum, item) => sum + item.totalCost, 0);

      const updated = { ...prev, items: updatedItems, totalCost: newTotalCost };

      // Mark panel as dirty
      updatePanelData('boq-table', {
        state: { boqResults: updated },
        lastActive: Date.now(),
        isDirty: true,
      });

      return updated;
    });

    setEditingCell(null);
  }, [editingCell, boqData, updatePanelData]);

  // Handle keydown in edit input
  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSaveEdit();
      } else if (e.key === 'Escape') {
        handleCancelEdit();
      }
    },
    [handleSaveEdit, handleCancelEdit]
  );

  // Render editable cell
  const renderEditableCell = (
    item: BOQItem,
    field: 'quantity' | 'unitCost',
    value: number,
    isRight: boolean = true
  ) => {
    const isEditing = editingCell?.rowId === item.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <div className={`px-3 py-2 ${isRight ? 'text-right' : ''}`}>
          <div className="flex items-center gap-1 justify-end">
            <input
              type="number"
              value={editingCell.value}
              onChange={(e) =>
                setEditingCell((prev) => (prev ? { ...prev, value: e.target.value } : null))
              }
              onKeyDown={handleEditKeyDown}
              onBlur={handleSaveEdit}
              autoFocus
              className="w-20 px-2 py-1 text-sm border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              aria-label={`Edit ${field}`}
            />
            <button
              onClick={handleSaveEdit}
              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
              aria-label="Save"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              aria-label="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`px-3 py-2 ${isRight ? 'text-right' : ''} cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20`}
        onDoubleClick={() => handleStartEdit(item.id, field, value)}
        title="Double-click to edit"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleStartEdit(item.id, field, value);
          }
        }}
      >
        {value.toLocaleString()}
      </div>
    );
  };

  // Virtual scrolling row height
  const ROW_HEIGHT = 48;

  // Reference to scrollable container for virtualization
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Virtual scrolling setup
  const rowVirtualizer = useVirtualizer({
    count: boqData?.items.length ?? 0,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
  });

  // Show empty state when no data
  if (!boqData || boqData.items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
              {t('workspacePanel.totalProjectCost')}
            </div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {boqData.totalCost.toLocaleString()} {boqData.currency}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {t('workspacePanel.itemsCount', { count: boqData.items.length })}
          </div>
        </div>
      </div>

      {/* Table with Virtual Scrolling */}
      <div className="flex flex-col h-[calc(100%-180px)] min-h-[300px]">
        {/* Table Header (sticky) */}
        <div className="bg-muted border-b border-border text-sm font-medium">
          <div className="flex">
            <div className="px-3 py-2 w-[15%] text-left">{t('workspacePanel.item')}</div>
            <div className="px-3 py-2 w-[30%] text-left">{t('workspacePanel.description')}</div>
            <div className="px-3 py-2 w-[12%] text-right">{t('workspacePanel.quantity')}</div>
            <div className="px-3 py-2 w-[10%] text-left">{t('workspacePanel.unit')}</div>
            <div className="px-3 py-2 w-[15%] text-right">{t('workspacePanel.unitCost')}</div>
            <div className="px-3 py-2 w-[18%] text-right">{t('workspacePanel.total')}</div>
          </div>
        </div>

        {/* Virtualized Table Body */}
        <div
          ref={tableContainerRef}
          className="flex-1 overflow-auto"
          data-testid="boq-virtual-container"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const item = boqData.items[virtualRow.index];
              return (
                <div
                  key={item.id}
                  data-index={virtualRow.index}
                  className="flex border-b border-border hover:bg-muted/50 text-sm"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="px-3 py-2 w-[15%] truncate">{item.item}</div>
                  <div className="px-3 py-2 w-[30%] text-muted-foreground truncate">
                    {item.description}
                  </div>
                  <div className="w-[12%]">
                    {renderEditableCell(item, 'quantity', item.quantity)}
                  </div>
                  <div className="px-3 py-2 w-[10%]">{item.unit}</div>
                  <div className="w-[15%]">
                    {renderEditableCell(item, 'unitCost', item.unitCost)}
                  </div>
                  <div className="px-3 py-2 w-[18%] text-right font-medium">
                    {item.totalCost.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="flex gap-2 items-center">
        <Download className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => handleExport('excel')}
          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
        >
          {t('workspacePanel.exportExcel')}
        </button>
        <button
          onClick={() => handleExport('pdf')}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t('workspacePanel.exportPDF')}
        </button>
      </div>
    </div>
  );
}

// ============================================
// Tambo Interactable Wrapper
// ============================================

const BOQTableInteractable = withTamboInteractable(BOQTableContent, {
  componentName: 'BOQTable',
  description:
    'Bill of Quantities table showing line items with quantities, unit costs, and totals. ' +
    'Supports inline editing of quantities and unit costs, virtual scrolling for large datasets, ' +
    'and export to Excel/PDF.',
  propsSchema: BOQTableSchema,
});

// ============================================
// Main Exported Component
// ============================================

export function BOQTablePanel() {
  return (
    <PanelErrorBoundary panelName="BOQ Table">
      <div data-testid="boq-table-panel" className="h-full w-full p-4">
        <BOQTableInteractable />
      </div>
    </PanelErrorBoundary>
  );
}
