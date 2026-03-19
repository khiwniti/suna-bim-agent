'use client';

/**
 * Tambo HITL Components
 *
 * Human-in-the-Loop generative components rendered inline in chat.
 * These components enable user confirmation, choice selection, and parameter input
 * during AI-assisted workflows.
 *
 * Uses useTamboComponentState for bidirectional sync with Tambo AI,
 * so the AI can receive user responses.
 */

import { useState, useCallback, type ReactNode } from 'react';
import { useTamboComponentState } from '@tambo-ai/react';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

export interface ConfirmationCardProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface Choice {
  id: string;
  label: string;
  description?: string;
}

export interface ChoiceCardProps {
  title: string;
  description: string;
  choices: Choice[];
  onSelect?: (choiceId: string) => void;
}

export interface Parameter {
  id: string;
  label: string;
  type: 'text' | 'number' | 'checkbox' | 'select';
  defaultValue?: string;
  options?: string[];
}

export interface ParameterInputCardProps {
  title: string;
  description: string;
  parameters: Parameter[];
  onSubmit?: (values: Record<string, string | boolean>) => void;
}

// ============================================
// Card Wrapper Component
// ============================================

interface CardWrapperProps {
  children: ReactNode;
  className?: string;
}

function CardWrapper({ children, className }: CardWrapperProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-card text-card-foreground shadow-md border border-border/50',
        'p-4 space-y-3',
        className
      )}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-lg font-semibold leading-tight tracking-tight">
      {children}
    </h3>
  );
}

function CardDescription({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

// ============================================
// ConfirmationCard
// ============================================

/**
 * Yes/no confirmation card for destructive or important actions.
 * Uses Tambo component state to sync user response back to AI.
 */
export function ConfirmationCard({
  title = '',
  description = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmationCardProps) {
  // Sync response to Tambo so AI can receive the user's decision
  const [response, setResponse] = useTamboComponentState<'confirmed' | 'cancelled' | null>(
    'response',
    null
  );

  const handleConfirm = useCallback(() => {
    setResponse('confirmed');
    onConfirm?.();
  }, [setResponse, onConfirm]);

  const handleCancel = useCallback(() => {
    setResponse('cancelled');
    onCancel?.();
  }, [setResponse, onCancel]);

  const isSubmitted = response !== null;

  return (
    <CardWrapper>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
      {isSubmitted ? (
        <div className="pt-2 text-sm text-muted-foreground">
          {response === 'confirmed' ? '✓ Confirmed' : '✗ Cancelled'}
        </div>
      ) : (
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitted}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium rounded-lg',
              'border border-border bg-secondary text-secondary-foreground',
              'hover:bg-secondary/80 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitted}
            className={cn(
              'flex-1 px-4 py-2 text-sm font-medium rounded-lg',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {confirmLabel}
          </button>
        </div>
      )}
    </CardWrapper>
  );
}

// ============================================
// ChoiceCard
// ============================================

/**
 * Multiple choice selection card.
 * Uses Tambo component state to sync selected choice back to AI.
 */
export function ChoiceCard({
  title = '',
  description = '',
  choices = [],
  onSelect,
}: ChoiceCardProps) {
  // Sync selected choice to Tambo so AI can receive the selection
  const [selectedId, setSelectedId] = useTamboComponentState<string | null>(
    'selectedChoice',
    null
  );

  const handleSelect = useCallback(
    (choiceId: string) => {
      setSelectedId(choiceId);
      onSelect?.(choiceId);
    },
    [setSelectedId, onSelect]
  );

  return (
    <CardWrapper>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
      <div className="space-y-2 pt-2">
        {choices.map((choice, index) => (
          <button
            key={choice.id ?? `choice-${index}`}
            type="button"
            onClick={() => handleSelect(choice.id)}
            disabled={selectedId !== null}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg border transition-all',
              'hover:border-primary/50 hover:bg-accent/50',
              'disabled:cursor-not-allowed',
              selectedId === choice.id
                ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                : selectedId !== null
                  ? 'opacity-50'
                  : 'border-border bg-background'
            )}
          >
            <div className="font-medium text-sm">{choice.label}</div>
            {choice.description && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {choice.description}
              </div>
            )}
          </button>
        ))}
      </div>
      {selectedId && (
        <div className="pt-2 text-sm text-muted-foreground">
          ✓ Selected: {choices.find(c => c.id === selectedId)?.label}
        </div>
      )}
    </CardWrapper>
  );
}

// ============================================
// ParameterInputCard
// ============================================

/**
 * Parameter input form card.
 * Uses Tambo component state to sync submitted values back to AI.
 */
export function ParameterInputCard({
  title = '',
  description = '',
  parameters = [],
  onSubmit,
}: ParameterInputCardProps) {
  // Local state for form values during editing
  const [localValues, setLocalValues] = useState<Record<string, string | boolean>>(() => {
    const initial: Record<string, string | boolean> = {};
    if (!Array.isArray(parameters)) return initial;
    for (const param of parameters) {
      if (param.type === 'checkbox') {
        initial[param.id] = param.defaultValue === 'true';
      } else {
        initial[param.id] = param.defaultValue || '';
      }
    }
    return initial;
  });

  // Sync submitted values to Tambo so AI can receive them
  const [submittedValues, setSubmittedValues] = useTamboComponentState<Record<string, string | boolean> | null>(
    'submittedValues',
    null
  );

  // Helper to get value with fallback to prevent uncontrolled input warning
  const getValue = useCallback((paramId: string, type: string): string | boolean => {
    const value = localValues[paramId];
    if (value !== undefined) return value;
    return type === 'checkbox' ? false : '';
  }, [localValues]);

  const handleChange = useCallback(
    (paramId: string, value: string | boolean) => {
      setLocalValues((prev) => ({ ...prev, [paramId]: value }));
    },
    []
  );

  const handleSubmit = useCallback(() => {
    setSubmittedValues(localValues);
    onSubmit?.(localValues);
  }, [localValues, setSubmittedValues, onSubmit]);

  const isSubmitted = submittedValues !== null;

  return (
    <CardWrapper>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
      {isSubmitted ? (
        <div className="pt-2 text-sm text-muted-foreground">
          ✓ Submitted
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          {parameters.map((param) => (
            <div key={param.id} className="space-y-1.5">
              {param.type === 'checkbox' ? (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id={param.id}
                    checked={getValue(param.id, 'checkbox') as boolean}
                    onChange={(e) => handleChange(param.id, e.target.checked)}
                    disabled={isSubmitted}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">{param.label}</span>
                </label>
              ) : param.type === 'select' && param.options ? (
                <>
                  <label
                    htmlFor={param.id}
                    className="text-sm font-medium text-foreground"
                  >
                    {param.label}
                  </label>
                  <select
                    id={param.id}
                    value={getValue(param.id, 'select') as string}
                    onChange={(e) => handleChange(param.id, e.target.value)}
                    disabled={isSubmitted}
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-lg',
                      'border border-border bg-background',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    {param.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label
                    htmlFor={param.id}
                    className="text-sm font-medium text-foreground"
                  >
                    {param.label}
                  </label>
                  <input
                    type={param.type}
                    id={param.id}
                    value={getValue(param.id, param.type) as string}
                    onChange={(e) => handleChange(param.id, e.target.value)}
                    disabled={isSubmitted}
                    className={cn(
                      'w-full px-3 py-2 text-sm rounded-lg',
                      'border border-border bg-background',
                      'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  />
                </>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitted}
            className={cn(
              'w-full px-4 py-2 text-sm font-medium rounded-lg',
              'bg-primary text-primary-foreground',
              'hover:bg-primary/90 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            Submit
          </button>
        </div>
      )}
    </CardWrapper>
  );
}

// ============================================
// Component Registry
// ============================================

/**
 * Registry mapping component names to components.
 * Used by Tambo to render generative UI components inline.
 */
export const hitlComponentRegistry = {
  ConfirmationCard,
  ChoiceCard,
  ParameterInputCard,
} as const;

export type HITLComponentName = keyof typeof hitlComponentRegistry;
