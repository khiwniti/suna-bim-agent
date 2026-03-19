'use client';

/**
 * MessageActions Component
 *
 * Action toolbar for chat messages with copy, regenerate, edit, and feedback buttons.
 * Appears on hover over messages (ChatGPT/Claude pattern).
 */

import { useState } from 'react';
import {
  Copy,
  Check,
  RefreshCw,
  Pencil,
  ThumbsUp,
  ThumbsDown,
  MoreHorizontal,
  Share2,
  Flag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useClipboard } from '@/hooks/useClipboard';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/provider';

interface MessageActionsProps {
  /** Message content to copy */
  content: string;
  /** Whether this is a user message */
  isUserMessage?: boolean;
  /** Callback to regenerate response */
  onRegenerate?: () => void;
  /** Callback to edit message */
  onEdit?: () => void;
  /** Callback for feedback */
  onFeedback?: (type: 'up' | 'down') => void;
  /** Callback for share */
  onShare?: () => void;
  /** Callback for report */
  onReport?: () => void;
  /** Whether regeneration is in progress */
  isRegenerating?: boolean;
  /** Custom className */
  className?: string;
  /** Always visible (vs hover-only) */
  alwaysVisible?: boolean;
}

export function MessageActions({
  content,
  isUserMessage = false,
  onRegenerate,
  onEdit,
  onFeedback,
  onShare,
  onReport,
  isRegenerating = false,
  className,
  alwaysVisible = false,
}: MessageActionsProps) {
  const { t } = useTranslation();
  const { copy, copied } = useClipboard();
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showMore, setShowMore] = useState(false);

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    onFeedback?.(type);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        !alwaysVisible && 'opacity-0 group-hover:opacity-100',
        'transition-opacity duration-200',
        className
      )}
    >
      {/* Copy button */}
      <ActionButton
        icon={copied ? Check : Copy}
        label={copied ? t('common.copied') : t('common.copy')}
        onClick={() => copy(content)}
        active={copied}
        activeColor="text-green-500"
      />

      {/* Edit button (for user messages) */}
      {isUserMessage && onEdit && (
        <ActionButton
          icon={Pencil}
          label={t('common.edit')}
          onClick={onEdit}
        />
      )}

      {/* Regenerate button (for assistant messages) */}
      {!isUserMessage && onRegenerate && (
        <ActionButton
          icon={RefreshCw}
          label={t('messageActions.regenerate')}
          onClick={onRegenerate}
          disabled={isRegenerating}
          spinning={isRegenerating}
        />
      )}

      {/* Feedback buttons (for assistant messages) */}
      {!isUserMessage && onFeedback && (
        <>
          <ActionButton
            icon={ThumbsUp}
            label={t('messageActions.goodResponse')}
            onClick={() => handleFeedback('up')}
            active={feedback === 'up'}
            activeColor="text-green-500"
          />
          <ActionButton
            icon={ThumbsDown}
            label={t('messageActions.badResponse')}
            onClick={() => handleFeedback('down')}
            active={feedback === 'down'}
            activeColor="text-red-500"
          />
        </>
      )}

      {/* More actions dropdown */}
      {(onShare || onReport) && (
        <div className="relative">
          <ActionButton
            icon={MoreHorizontal}
            label={t('common.more')}
            onClick={() => setShowMore(!showMore)}
          />

          <AnimatePresence>
            {showMore && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
              >
                {onShare && (
                  <button
                    onClick={() => { onShare(); setShowMore(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    {t('messageActions.share')}
                  </button>
                )}
                {onReport && (
                  <button
                    onClick={() => { onReport(); setShowMore(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors text-destructive"
                  >
                    <Flag className="w-4 h-4" />
                    {t('messageActions.report')}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/**
 * Individual action button
 */
interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  activeColor?: string;
  spinning?: boolean;
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  active = false,
  activeColor = 'text-primary',
  spinning = false,
}: ActionButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'h-7 w-7 rounded-md',
        'text-muted-foreground hover:text-foreground',
        active && activeColor
      )}
    >
      <Icon className={cn('w-4 h-4', spinning && 'animate-spin')} />
    </Button>
  );
}

/**
 * Feedback buttons only (simplified version)
 */
interface FeedbackButtonsProps {
  onFeedback: (type: 'up' | 'down') => void;
  className?: string;
}

export function FeedbackButtons({ onFeedback, className }: FeedbackButtonsProps) {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  const handleFeedback = (type: 'up' | 'down') => {
    setFeedback(type);
    onFeedback(type);
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('up')}
        className={cn(
          'h-7 px-2 text-xs gap-1',
          feedback === 'up' && 'text-green-500 bg-green-500/10'
        )}
      >
        <ThumbsUp className="w-3 h-3" />
        {feedback === 'up' && t('messageActions.thanks')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('down')}
        className={cn(
          'h-7 px-2 text-xs gap-1',
          feedback === 'down' && 'text-red-500 bg-red-500/10'
        )}
      >
        <ThumbsDown className="w-3 h-3" />
      </Button>
    </div>
  );
}

export default MessageActions;
