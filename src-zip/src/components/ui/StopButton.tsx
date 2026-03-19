'use client';

/**
 * StopButton Component
 *
 * A button to stop/abort ongoing AI generation or streaming.
 * Provides clear visual feedback that generation can be stopped.
 */

import { StopCircle, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useTranslation } from '@/i18n/provider';

interface StopButtonProps extends Omit<ButtonProps, 'onClick'> {
  /** Callback to stop generation */
  onStop: () => void;
  /** Whether currently generating/streaming */
  isGenerating: boolean;
  /** Button variant style */
  buttonVariant?: 'filled' | 'outline' | 'minimal';
  /** Show loading spinner when stopping */
  showSpinner?: boolean;
}

export function StopButton({
  onStop,
  isGenerating,
  buttonVariant = 'outline',
  showSpinner = false,
  className,
  ...props
}: StopButtonProps) {
  const { t } = useTranslation();
  if (!isGenerating) return null;

  const variants = {
    filled: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
    outline: 'border-destructive text-destructive hover:bg-destructive/10',
    minimal: 'text-muted-foreground hover:text-destructive',
  };

  return (
    <Button
      type="button"
      variant={buttonVariant === 'filled' ? 'destructive' : 'outline'}
      onClick={onStop}
      className={cn(
        'gap-2 transition-all duration-200',
        buttonVariant === 'minimal' && 'border-0 shadow-none',
        variants[buttonVariant],
        className
      )}
      {...props}
    >
      {showSpinner ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Square className="w-4 h-4 fill-current" />
      )}
      <span>{t('stopButton.stopGenerating')}</span>
    </Button>
  );
}

/**
 * Compact stop button for inline use
 */
export function StopButtonIcon({
  onStop,
  isGenerating,
  className,
  ...props
}: Omit<StopButtonProps, 'buttonVariant' | 'showSpinner'>) {
  const { t } = useTranslation();
  if (!isGenerating) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onStop}
      className={cn(
        'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
        className
      )}
      title={t('stopButton.stopGenerating')}
      {...props}
    >
      <StopCircle className="w-5 h-5" />
    </Button>
  );
}

export default StopButton;
