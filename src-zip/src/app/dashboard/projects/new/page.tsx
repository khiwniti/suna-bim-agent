'use client';

/**
 * New Project Page
 *
 * Create a new BIM project with form validation
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/i18n/provider';

type BuildingTypeKey = 'residential' | 'commercial' | 'industrial' | 'healthcare' | 'educational' | 'mixed' | 'other';

const BUILDING_TYPE_KEYS: { value: string; key: BuildingTypeKey }[] = [
  { value: 'RESIDENTIAL', key: 'residential' },
  { value: 'COMMERCIAL', key: 'commercial' },
  { value: 'INDUSTRIAL', key: 'industrial' },
  { value: 'HEALTHCARE', key: 'healthcare' },
  { value: 'EDUCATIONAL', key: 'educational' },
  { value: 'MIXED_USE', key: 'mixed' },
  { value: 'OTHER', key: 'other' },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { createProject, isLoading: loading } = useProjects();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    buildingType: '',
    totalArea: '',
    floors: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('projects.new.nameRequired');
    }

    if (formData.totalArea && isNaN(Number(formData.totalArea))) {
      newErrors.totalArea = t('projects.new.areaInvalid');
    }

    if (formData.floors && (!Number.isInteger(Number(formData.floors)) || Number(formData.floors) < 1)) {
      newErrors.floors = t('projects.new.floorsInvalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      const project = await createProject({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        location: formData.location.trim() || undefined,
        buildingType: formData.buildingType || undefined,
        totalArea: formData.totalArea ? Number(formData.totalArea) : undefined,
        floors: formData.floors ? Number(formData.floors) : undefined,
      });

      if (project) {
        router.push(`/dashboard/projects/${project.id}`);
      }
    } catch (err) {
      setErrors({ submit: err instanceof Error ? err.message : t('projects.new.submitFailed') });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('projects.back')}
        </button>
        <h1 className="text-2xl font-bold text-foreground">{t('projects.new.title')}</h1>
        <p className="mt-1 text-muted-foreground">
          {t('projects.new.subtitle')}
        </p>
      </div>

      {/* Form */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">{t('projects.new.detailsTitle')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('projects.new.detailsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">
                {t('projects.new.nameLabel')} <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md border bg-muted px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 ${
                  errors.name
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-input focus:border-primary focus:ring-primary'
                }`}
                placeholder={t('projects.new.namePlaceholder')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-muted-foreground">
                {t('projects.new.descriptionLabel')}
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-input bg-card px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t('projects.new.descriptionPlaceholder')}
              />
            </div>

            {/* Building Type */}
            <div>
              <label htmlFor="buildingType" className="block text-sm font-medium text-muted-foreground">
                {t('projects.new.typeLabel')}
              </label>
              <select
                id="buildingType"
                name="buildingType"
                value={formData.buildingType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-input bg-card px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">{t('projects.new.typePlaceholder')}</option>
                {BUILDING_TYPE_KEYS.map((type) => (
                  <option key={type.value} value={type.value}>
                    {t(`projects.types.${type.key}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-muted-foreground">
                {t('projects.new.locationLabel')}
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-input bg-card px-3 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={t('projects.new.locationPlaceholder')}
              />
            </div>

            {/* Area and Floors */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="totalArea" className="block text-sm font-medium text-muted-foreground">
                  {t('projects.new.areaLabel')}
                </label>
                <input
                  id="totalArea"
                  name="totalArea"
                  type="number"
                  value={formData.totalArea}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border bg-muted px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 ${
                    errors.totalArea
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-input focus:border-primary focus:ring-primary'
                  }`}
                  placeholder={t('projects.new.areaPlaceholder')}
                />
                {errors.totalArea && (
                  <p className="mt-1 text-sm text-red-400">{errors.totalArea}</p>
                )}
              </div>
              <div>
                <label htmlFor="floors" className="block text-sm font-medium text-muted-foreground">
                  {t('projects.new.floorsLabel')}
                </label>
                <input
                  id="floors"
                  name="floors"
                  type="number"
                  value={formData.floors}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border bg-muted px-3 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 ${
                    errors.floors
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                      : 'border-input focus:border-primary focus:ring-primary'
                  }`}
                  placeholder={t('projects.new.floorsPlaceholder')}
                />
                {errors.floors && (
                  <p className="mt-1 text-sm text-red-400">{errors.floors}</p>
                )}
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-300">
                {errors.submit}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-border pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-input bg-transparent text-muted-foreground hover:bg-muted"
              >
                {t('projects.new.cancel')}
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary/90"
              >
                {loading ? t('projects.new.submitting') : t('projects.new.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
