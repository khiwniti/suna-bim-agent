/**
 * Sitemap Configuration
 *
 * Generates dynamic sitemap.xml for SEO.
 */

import { MetadataRoute } from 'next';
import { getBlogSlugs, getAllTags } from '@/lib/blog';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bim.getintheq.space';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/calculator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/boq-analyzer`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/case-studies`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    // Solution pages
    {
      url: `${BASE_URL}/solutions/contractors`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/solutions/architects`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/solutions/developers`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/solutions/consultants`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Auth pages
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/auth/signup`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Blog posts
  const blogSlugs = getBlogSlugs();
  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Blog tags
  const tags = getAllTags();
  const tagPages: MetadataRoute.Sitemap = tags.map(({ tag }) => ({
    url: `${BASE_URL}/blog/tag/${encodeURIComponent(tag)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  // Case studies
  const caseStudies = [
    'abc-construction-green-contracts',
    'studio-verde-carbon-optimization',
    'green-heights-financing',
  ];
  const caseStudyPages: MetadataRoute.Sitemap = caseStudies.map((slug) => ({
    url: `${BASE_URL}/case-studies/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...tagPages, ...caseStudyPages];
}
