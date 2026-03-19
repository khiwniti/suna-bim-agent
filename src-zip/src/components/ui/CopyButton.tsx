'use client';

/**
 * CopyButton Component
 *
 * A reusable copy-to-clipboard button with visual feedback.
 * Shows check icon when copied successfully.
 */

import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClipboard } from '@/hooks/useClipboard';
import { Button, type ButtonProps } from '@/components/ui/button';
import { useTranslation } from '@/i18n/provider';

interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'size' | 'onCopy'> {
  /** Text to copy to clipboard */
  text: string;
  /** Duration to show success state in ms (default: 2000) */
  successDuration?: number;
  /** Optional callback on successful copy */
  onCopySuccess?: (text: string) => void;
  /** Show text label (default: false) */
  showLabel?: boolean;
  /** Size variant (default: "icon") */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon' | 'icon-sm' | 'icon-lg';
}

export function CopyButton({
  text,
  successDuration = 2000,
  onCopySuccess,
  showLabel = false,
  size = 'icon',
  className,
  variant = 'ghost',
  ...props
}: CopyButtonProps) {
  const { t } = useTranslation();
  const { copy, copied } = useClipboard({
    successDuration,
    onSuccess: onCopySuccess,
  });

  const handleClick = () => {
    copy(text);
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        'transition-all duration-200',
        copied && 'text-green-500',
        className
      )}
      title={copied ? t('common.copied') : t('common.copyToClipboard')}
      {...props}
    >
      {copied ? (
        <Check className="w-4 h-4" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      {showLabel && (
        <span className="ml-2">{copied ? t('common.copied') : t('common.copy')}</span>
      )}
    </Button>
  );
}

export default CopyButton;
