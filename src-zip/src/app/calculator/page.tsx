'use client';

import Link from 'next/link';
import { CarbonCalculator } from '@/components/calculator';
import { useTranslation } from '@/i18n/provider';

export default function CalculatorPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-white font-bold">🌱</span>
              </div>
              <div>
                <h1 className="font-bold text-lg">{t('calculator.title')}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('calculator.page.headerSubtitle')}
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('calculator.page.backToHome')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
            <span>🇹🇭</span>
            <span>{t('calculator.page.badge')}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('calculator.page.heroTitle')}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              {' '}{t('calculator.page.heroHighlight')}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('calculator.page.heroDescription')}
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="pb-20 px-4">
        <CarbonCalculator />
      </section>

      {/* Footer Info */}
      <footer className="border-t bg-muted/30 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">{t('calculator.page.dataSources')}</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {t('calculator.page.dataSourcesList.tgo')}</li>
                <li>• {t('calculator.page.dataSourcesList.mtec')}</li>
                <li>• {t('calculator.page.dataSourcesList.scg')}</li>
                <li>• {t('calculator.page.dataSourcesList.tgbi')}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('calculator.page.methodology')}</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {t('calculator.page.methodologyList.en15978')}</li>
                <li>• {t('calculator.page.methodologyList.cradleToGate')}</li>
                <li>• {t('calculator.page.methodologyList.trees')}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('calculator.page.needMore')}</h3>
              <p className="text-muted-foreground mb-3">
                {t('calculator.page.needMoreDescription')}
              </p>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                {t('calculator.page.tryFullPlatform')}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
