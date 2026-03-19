'use client';

import { useTranslation } from '@/i18n/provider';

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl py-16 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-8">
          {t('terms.title')}
        </h1>

        <p className="text-muted-foreground mb-8">
          Last Updated: March 7, 2026
        </p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.acceptableUse')}
            </h2>
            <p className="text-muted-foreground">
              You agree to use our platform only for lawful purposes. You may not use
              our services to upload malicious content, attempt to gain unauthorized access,
              or violate any applicable laws or regulations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.intellectualProperty')}
            </h2>
            <p className="text-muted-foreground">
              All content, features, and functionality of our platform are owned by us
              and protected by intellectual property laws. You retain ownership of your
              BIM models and project data that you upload.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {t('terms.limitationOfLiability')}
            </h2>
            <p className="text-muted-foreground">
              Our platform is provided "as is" without warranties of any kind. We shall
              not be liable for any indirect, incidental, or consequential damages arising
              from your use of our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Termination
            </h2>
            <p className="text-muted-foreground">
              We reserve the right to terminate or suspend your access to our platform
              at any time for violations of these terms. You may also terminate your
              account at any time through your account settings.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
