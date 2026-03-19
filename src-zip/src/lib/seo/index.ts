/**
 * SEO Utilities
 *
 * Shared SEO configuration and structured data generators.
 */

import { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bim.getintheq.space';

// Default metadata
export const defaultMetadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'CarbonBIM - Carbon Footprint Calculator for Thai Construction',
    template: '%s | CarbonBIM',
  },
  description:
    'AI-powered carbon footprint analysis for BIM models. Calculate emissions, generate TGO-compliant reports, and achieve TREES certification for Thai construction projects.',
  keywords: [
    'carbon footprint',
    'BIM',
    'building information modeling',
    'Thailand construction',
    'TGO',
    'TREES certification',
    'green building',
    'sustainability',
    'carbon calculator',
    'IFC',
    'embodied carbon',
    'lifecycle assessment',
  ],
  authors: [{ name: 'CarbonBIM Team' }],
  creator: 'CarbonBIM',
  publisher: 'CarbonBIM',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: 'th_TH',
    url: BASE_URL,
    siteName: 'CarbonBIM',
    title: 'CarbonBIM - Carbon Footprint Calculator for Thai Construction',
    description:
      'AI-powered carbon footprint analysis for BIM models. Calculate emissions and achieve TGO compliance.',
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CarbonBIM - Sustainable Construction Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CarbonBIM - Carbon Calculator for Construction',
    description: 'AI-powered carbon analysis for Thai construction projects',
    images: [`${BASE_URL}/og-image.png`],
    creator: '@carbonbim',
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      'en-US': `${BASE_URL}/en`,
      'th-TH': `${BASE_URL}/th`,
    },
  },
  category: 'technology',
};

// Organization structured data
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'CarbonBIM',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description:
      'AI-powered carbon footprint analysis platform for Thai construction industry',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'TH',
    },
    sameAs: [
      'https://linkedin.com/company/carbonbim',
      'https://twitter.com/carbonbim',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@carbonbim.com',
    },
  };
}

// Software application structured data
export function generateSoftwareAppSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CarbonBIM',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'THB',
      description: 'Free tier with 5 analyses per month',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
    },
    featureList: [
      'IFC/BIM model carbon analysis',
      'Thai material emission factors',
      'TGO-compliant reports',
      'TREES certification support',
      'AI recommendations',
    ],
  };
}

// Blog post structured data
export function generateBlogPostSchema(post: {
  title: string;
  description: string;
  slug: string;
  date: string;
  author: { name: string };
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: `${BASE_URL}/blog/${post.slug}`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'CarbonBIM',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    image: post.image || `${BASE_URL}/og-image.png`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${BASE_URL}/blog/${post.slug}`,
    },
  };
}

// FAQ structured data
export function generateFAQSchema(
  faqs: { question: string; answer: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Breadcrumb structured data
export function generateBreadcrumbSchema(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

// Service structured data for solutions pages
export function generateServiceSchema(service: {
  name: string;
  description: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    url: service.url,
    provider: {
      '@type': 'Organization',
      name: 'CarbonBIM',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Thailand',
    },
    serviceType: 'Carbon Footprint Analysis',
  };
}
