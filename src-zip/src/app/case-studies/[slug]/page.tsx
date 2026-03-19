/**
 * Individual Case Study Detail Page (Server Component)
 *
 * Dynamic route for detailed case study content.
 * Delegates rendering to CaseStudyContent client component.
 */

import { notFound } from 'next/navigation';
import CaseStudyContent from './CaseStudyContent';
import { CASE_STUDIES } from './data';

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = CASE_STUDIES[slug];

  if (!study) {
    notFound();
  }

  return <CaseStudyContent study={study} />;
}

// Generate static params for all case studies
export async function generateStaticParams() {
  return Object.keys(CASE_STUDIES).map((slug) => ({
    slug,
  }));
}
