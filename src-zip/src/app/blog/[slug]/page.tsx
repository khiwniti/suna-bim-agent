/**
 * Blog Post Detail Page
 *
 * Individual blog post with MDX content rendering.
 */

import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Share2 } from 'lucide-react';
import { getBlogPost, getBlogSlugs, getRelatedPosts } from '@/lib/blog';
import { AuthorCard, RelatedPosts } from '@/components/blog/BlogComponents';
import { MDXContent } from '@/components/blog/MDXContent';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: `${post.title} | CarbonBIM Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : [],
      type: 'article',
      publishedTime: post.date,
      authors: [post.author.name],
      tags: post.tags,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(slug, 3);
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-900/10">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                href={`/blog/tag/${tag.toLowerCase()}`}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300"
              >
                {tag}
              </Link>
            ))}
          </div>

          <h1 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl lg:text-5xl">
            {post.title}
          </h1>

          <p className="mb-6 text-xl text-slate-600 dark:text-slate-400">
            {post.description}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-700">
            <AuthorCard author={post.author} />

            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{post.readingTime}</span>
              </div>
              <button className="flex items-center gap-1 hover:text-emerald-600">
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.image && (
          <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-xl">
            <Image
              src={post.image}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* Content */}
        <MDXContent content={post.content} />

        {/* Related Posts */}
        <RelatedPosts posts={relatedPosts} />
      </article>
    </div>
  );
}
