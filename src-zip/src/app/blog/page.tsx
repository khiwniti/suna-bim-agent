/**
 * Blog Listing Page
 *
 * Main blog index showing all posts with tag filtering.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getAllBlogPosts, getAllTags } from '@/lib/blog';
import { BlogGrid, TagList } from '@/components/blog/BlogComponents';

export const metadata: Metadata = {
  title: 'Blog | CarbonBIM',
  description:
    'Insights on sustainable construction, carbon calculation, BIM technology, and green building practices in Thailand.',
};

export default function BlogPage() {
  const posts = getAllBlogPosts();
  const tags = getAllTags();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-900/10">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <section className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-slate-900 dark:text-white md:text-5xl">
            CarbonBIM Blog
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Insights on sustainable construction, carbon calculation, and green building practices.
          </p>
        </section>

        <section className="mb-12">
          <TagList tags={tags} />
        </section>

        <section>
          <BlogGrid posts={posts} showFeatured={true} />
        </section>
      </main>
    </div>
  );
}
