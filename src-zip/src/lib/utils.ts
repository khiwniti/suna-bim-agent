import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format numbers for display (e.g., 1234567 -> 1,234,567)
 */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format area with units
 */
export function formatArea(value: number, unit: 'metric' | 'imperial' = 'metric'): string {
  if (unit === 'imperial') {
    const sqft = value * 10.764; // Convert m² to ft²
    return `${formatNumber(sqft, 0)} ft²`;
  }
  return `${formatNumber(value, 1)} m²`;
}

/**
 * Format carbon emissions
 */
export function formatCarbon(kgCO2e: number): string {
  if (kgCO2e >= 1000000) {
    return `${formatNumber(kgCO2e / 1000000, 1)} tCO₂e`;
  }
  if (kgCO2e >= 1000) {
    return `${formatNumber(kgCO2e / 1000, 1)} tCO₂e`;
  }
  return `${formatNumber(kgCO2e, 0)} kgCO₂e`;
}

/**
 * Format energy consumption
 */
export function formatEnergy(kwh: number): string {
  if (kwh >= 1000000) {
    return `${formatNumber(kwh / 1000000, 1)} GWh`;
  }
  if (kwh >= 1000) {
    return `${formatNumber(kwh / 1000, 1)} MWh`;
  }
  return `${formatNumber(kwh, 0)} kWh`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get sustainability rating color
 */
export function getSustainabilityColor(
  rating: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
): string {
  const colors: Record<string, string> = {
    A: '#059669', // Emerald
    B: '#10b981',
    C: '#84cc16', // Lime
    D: '#eab308', // Yellow
    E: '#f97316', // Orange
    F: '#ef4444', // Red
    G: '#dc2626',
  };
  return colors[rating] || colors.D;
}

/**
 * Get element type display name
 */
export function getElementTypeName(type: string): string {
  const names: Record<string, string> = {
    wall: 'Wall',
    door: 'Door',
    window: 'Window',
    slab: 'Floor Slab',
    roof: 'Roof',
    stair: 'Staircase',
    column: 'Column',
    beam: 'Beam',
    furniture: 'Furniture',
    equipment: 'Equipment',
    space: 'Space',
    zone: 'Zone',
    hvac: 'HVAC',
    pipe: 'Pipe',
    duct: 'Duct',
    other: 'Other',
  };
  return names[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Get element type color for 3D visualization
 */
export function getElementTypeColor(type: string): string {
  const colors: Record<string, string> = {
    wall: '#94a3b8',
    door: '#f59e0b',
    window: '#38bdf8',
    slab: '#a1a1aa',
    roof: '#ef4444',
    stair: '#8b5cf6',
    column: '#71717a',
    beam: '#6b7280',
    furniture: '#10b981',
    equipment: '#06b6d4',
    space: '#dbeafe',
    zone: '#fef3c7',
    hvac: '#2563eb',
    pipe: '#22c55e',
    duct: '#64748b',
    other: '#d1d5db',
  };
  return colors[type] || '#d1d5db';
}
