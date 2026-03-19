'use client';

import { useState } from 'react';
import { useTranslation } from '@/i18n/provider';
import { Button } from '@/components/ui/button';

interface FormData {
  name: string;
  email: string;
  message: string;
}

export default function ContactPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl py-16 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {t('contact.title')}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t('contact.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
              {t('contact.name')}
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              {t('contact.email')}
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
              {t('contact.message')}
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          {status === 'success' && (
            <div className="rounded-md bg-green-900/50 p-4 text-green-300">
              {t('contact.success')}
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md bg-red-900/50 p-4 text-red-300">
              {t('contact.error')}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? t('contact.sending') : t('contact.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}
