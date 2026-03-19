'use client';

/**
 * Settings Page
 *
 * User account and application settings
 */

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/provider';
import { DeleteAccountDialog } from '@/components/dialogs/DeleteAccountDialog';

export default function SettingsPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [profile, setProfile] = useState({
    name: user?.user_metadata?.name || '',
    email: user?.email || '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    analysisAlerts: true,
    darkMode: true,
    autoSave: true,
  });

  const handleProfileSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (!authUser) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('users')
        .update({
          name: profile.name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      if (error) throw error;

      setMessage({ type: 'success', text: t('settings.profileUpdated') });
    } catch (err) {
      console.error('Profile save error:', err);
      setMessage({ type: 'error', text: t('settings.profileUpdateFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Save to localStorage for immediate effect
      localStorage.setItem('user-preferences', JSON.stringify(preferences));

      setMessage({ type: 'success', text: t('settings.preferencesSaved') });
    } catch (err) {
      console.error('Preferences save error:', err);
      setMessage({ type: 'error', text: t('settings.preferencesSaveFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('settings.title')}</h1>
        <p className="mt-1 text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success'
            ? 'bg-green-900/50 text-green-300'
            : 'bg-red-900/50 text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Profile Settings */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">{t('settings.profile')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('settings.profileDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              {user?.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full"
                />
              ) : (
                <span className="text-2xl font-medium text-foreground">
                  {profile.name?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div>
              <p className="font-medium text-foreground">{profile.name || 'User'}</p>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <div className="grid gap-4 pt-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">
                {t('settings.name')}
              </label>
              <input
                id="name"
                type="text"
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-input bg-card px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t('settings.namePlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
                {t('settings.email')}
              </label>
              <input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="mt-1 block w-full rounded-md border border-input bg-muted px-3 py-2 text-muted-foreground cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-muted-foreground/80">{t('settings.emailDisabledHint')}</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handleProfileSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? t('settings.saving') : t('settings.saveProfile')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">{t('settings.notifications')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('settings.notificationsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{t('settings.emailNotifications')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.emailNotificationsDescription')}</p>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.emailNotifications ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{t('settings.analysisAlerts')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.analysisAlertsDescription')}</p>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, analysisAlerts: !prev.analysisAlerts }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.analysisAlerts ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.analysisAlerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Application Settings */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">{t('settings.application')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('settings.applicationDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{t('settings.darkMode')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.darkModeDescription')}</p>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, darkMode: !prev.darkMode }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.darkMode ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.darkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{t('settings.autoSave')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.autoSaveDescription')}</p>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, autoSave: !prev.autoSave }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences.autoSave ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences.autoSave ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              onClick={handlePreferencesSave}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? t('settings.saving') : t('settings.savePreferences')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-900/50 bg-card">
        <CardHeader>
          <CardTitle className="text-red-400">{t('settings.dangerZone')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('settings.dangerZoneDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">{t('settings.deleteAccount')}</p>
              <p className="text-sm text-muted-foreground">{t('settings.deleteAccountDescription')}</p>
            </div>
            <Button
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-900/50"
              onClick={() => setShowDeleteDialog(true)}
            >
              {t('settings.deleteAccount')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Confirmation Dialog */}
      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </div>
  );
}
