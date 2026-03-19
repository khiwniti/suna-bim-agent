/**
 * Blog Tag Filter Page
 *
 * Shows posts filtered by tag.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getPostsByTag, getAllTags } from '@/lib/blog';
import { BlogGrid, TagList } from '@/components/blog/BlogComponents';

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map(({ tag }) => ({ tag: tag.toLowerCase() }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);

  return {
    title: `${decodedTag} Posts | CarbonBIM Blog`,
    description: `Articles about ${decodedTag} in sustainable construction and carbon analysis.`,
  };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = getPostsByTag(decodedTag);
  const allTags = getAllTags();

  if (posts.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-900/10">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12">
        <section className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Tag
          </div>
          <h1 className="mb-4 text-4xl font-bold capitalize text-slate-900 dark:text-white">
            {decodedTag}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'} tagged with &ldquo;{decodedTag}&rdquo;
          </p>
        </section>

        <section className="mb-12">
          <TagList tags={allTags} activeTag={decodedTag} />
        </section>

        <section>
          <BlogGrid posts={posts} showFeatured={false} />
        </section>
      </main>
    </div>
  );
}
