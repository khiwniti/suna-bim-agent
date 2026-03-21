'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

export interface PropertySet {
  psetName: string;
  properties: Array<{ name: string; value: string | number | boolean | null }>;
}

export interface ElementProps {
  expressId: number;
  type: string;
  name: string | null;
  globalId: string | null;
  storey: string | null;
  material: string | null;
  quantities: Record<string, number | string>;
  propertySets: PropertySet[];
}

interface CollapsibleSectionProps {
  title: string;
  badge?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, badge, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border/50">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {title}
        </span>
        {badge !== undefined && (
          <span className="text-[10px] bg-muted rounded px-1.5 py-0.5">{badge}</span>
        )}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

function PropertyRow({ name, value }: { name: string; value: string | number | boolean | null }) {
  const displayVal =
    value === null ? '—' :
    typeof value === 'boolean' ? (value ? 'Yes' : 'No') :
    String(value);
  return (
    <div className="flex items-start justify-between gap-2 py-0.5">
      <span className="text-[11px] text-muted-foreground shrink-0 max-w-[45%] truncate" title={name}>{name}</span>
      <span className="text-[11px] text-foreground text-right break-all">{displayVal}</span>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  IfcWall:        'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  IfcSlab:        'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  IfcBeam:        'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  IfcColumn:      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  IfcWindow:      'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  IfcDoor:        'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  IfcRoof:        'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  IfcStair:       'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  IfcCurtainWall: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
};

function typeColor(type: string) {
  return TYPE_COLORS[type] ?? 'bg-muted text-muted-foreground';
}

interface ElementPropertyPanelProps {
  props: ElementProps;
  onClose: () => void;
}

export default function ElementPropertyPanel({ props, onClose }: ElementPropertyPanelProps) {
  const shortType = props.type.replace(/^Ifc/, '');
  const quantityKeys = Object.keys(props.quantities);

  return (
    <div className="absolute top-2 right-2 bottom-2 w-64 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg flex flex-col overflow-hidden z-10">
      {/* Header */}
      <div className="flex items-start justify-between px-3 py-2.5 border-b border-border/50">
        <div className="flex flex-col gap-1 min-w-0">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded self-start ${typeColor(props.type)}`}>
            {shortType}
          </span>
          <p className="text-xs font-medium text-foreground truncate" title={props.name ?? undefined}>
            {props.name ?? <span className="text-muted-foreground italic">Unnamed</span>}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono truncate">
            #{props.expressId}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto text-xs">

        {/* Overview */}
        <CollapsibleSection title="Overview" defaultOpen>
          <div className="space-y-0.5 pt-1">
            <PropertyRow name="Type" value={props.type} />
            {props.globalId && (
              <PropertyRow name="Global ID" value={props.globalId.substring(0, 22) + '…'} />
            )}
            {props.storey && <PropertyRow name="Storey" value={props.storey} />}
            {props.material && <PropertyRow name="Material" value={props.material} />}
          </div>
        </CollapsibleSection>

        {/* Quantities */}
        {quantityKeys.length > 0 && (
          <CollapsibleSection title="Quantities" badge={quantityKeys.length} defaultOpen>
            <div className="space-y-0.5 pt-1">
              {quantityKeys.map(k => (
                <PropertyRow key={k} name={k} value={props.quantities[k]} />
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Property Sets */}
        {props.propertySets.map((pset, i) => (
          <CollapsibleSection
            key={i}
            title={pset.psetName}
            badge={pset.properties.length}
          >
            <div className="space-y-0.5 pt-1">
              {pset.properties.map((p, j) => (
                <PropertyRow key={j} name={p.name} value={p.value} />
              ))}
            </div>
          </CollapsibleSection>
        ))}

        {/* Empty state */}
        {props.propertySets.length === 0 && quantityKeys.length === 0 && !props.storey && !props.material && (
          <div className="px-3 py-4 text-center">
            <p className="text-[11px] text-muted-foreground">No additional properties found</p>
          </div>
        )}
      </div>
    </div>
  );
}
