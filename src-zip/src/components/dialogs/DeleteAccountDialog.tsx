'use client';

/**
 * Delete Account Dialog
 *
 * Confirmation dialog requiring user to type "DELETE" to confirm
 * account deletion. Signs out user and redirects to home page.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/i18n/provider';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmValid = confirmText === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmValid) return;

    setIsDeleting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Sign out user (actual deletion would be handled by server/admin)
      await supabase.auth.signOut();

      // Clear local storage
      localStorage.clear();

      // Redirect to home
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deletion failed');
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">
            {t('settings.deleteAccount')}
          </DialogTitle>
          <DialogDescription>
            {t('settings.deleteAccountDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Type <strong className="text-foreground">DELETE</strong> to confirm:
          </p>
          <input
            type="text"
            placeholder="DELETE"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-foreground placeholder:text-muted-foreground focus:border-destructive focus:outline-none focus:ring-1 focus:ring-destructive"
            autoComplete="off"
            data-testid="delete-confirm-input"
          />
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            data-testid="confirm-delete"
          >
            {isDeleting ? t('settings.deleting') || 'Deleting...' : t('settings.deleteAccount')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
