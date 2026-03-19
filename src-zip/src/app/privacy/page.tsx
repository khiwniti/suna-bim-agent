'use client';

import { useTranslation } from '@/i18n/provider';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl py-16 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-8">
          {t('privacy.title')}
        </h1>

        <p className="text-muted-foreground mb-8">
          Last Updated: March 7, 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.dataCollection')}
            </h2>
            <p className="text-muted-foreground">
              We collect information you provide directly to us, including your name,
              email address, and any BIM models or project data you upload to our platform.
              We use this information to provide and improve our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.cookies')}
            </h2>
            <p className="text-muted-foreground">
              We use cookies and similar technologies to maintain your session,
              remember your preferences, and analyze how our platform is used.
              You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.yourRights')}
            </h2>
            <p className="text-muted-foreground">
              You have the right to access, correct, or delete your personal data.
              You can also request data portability or object to certain processing activities.
              Contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('privacy.contact')}
            </h2>
            <p className="text-muted-foreground">
              For privacy-related inquiries, contact us at{' '}
              <a href="mailto:privacy@example.com" className="text-primary hover:underline">
                privacy@example.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
