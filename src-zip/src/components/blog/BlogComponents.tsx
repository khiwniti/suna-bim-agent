/**
 * Blog Components
 *
 * Reusable components for blog listing and display.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Tag, ArrowRight, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlogPostMeta } from '@/lib/blog/utils';

// ============================================
// Blog Card Component
// ============================================

interface BlogCardProps {
  post: BlogPostMeta;
  featured?: boolean;
  className?: string;
}

export function BlogCard({ post, featured = false, className }: BlogCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article
      className={cn(
        'group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-emerald-300 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800',
        featured && 'md:col-span-2 md:grid md:grid-cols-2',
        className
      )}
    >
      {/* Image */}
      <Link
        href={`/blog/${post.slug}`}
        className={cn(
          'relative block overflow-hidden bg-slate-100 dark:bg-slate-700',
          featured ? 'aspect-[16/10] md:aspect-auto md:h-full' : 'aspect-[16/9]'
        )}
      >
        {post.image ? (
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-6xl text-slate-300 dark:text-slate-600">📝</div>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-6">
        {/* Tags */}
        <div className="mb-3 flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <Link
              key={tag}
              href={`/blog/tag/${tag.toLowerCase()}`}
              className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              {tag}
            </Link>
          ))}
        </div>

        {/* Title */}
        <Link href={`/blog/${post.slug}`}>
          <h2
            className={cn(
              'mb-2 font-bold text-slate-900 transition-colors group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400',
              featured ? 'text-2xl' : 'text-xl'
            )}
          >
            {post.title}
          </h2>
        </Link>

        {/* Description */}
        <p className="mb-4 line-clamp-2 text-slate-600 dark:text-slate-400">
          {post.description}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{post.readingTime}</span>
            </div>
          </div>

          <Link
            href={`/blog/${post.slug}`}
            className="flex items-center gap-1 font-medium text-emerald-600 transition-colors hover:text-emerald-700 dark:text-emerald-400"
          >
            Read more
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

// ============================================
// Blog Grid Component
// ============================================

interface BlogGridProps {
  posts: BlogPostMeta[];
  showFeatured?: boolean;
  className?: string;
}

export function BlogGrid({ posts, showFeatured = true, className }: BlogGridProps) {
  if (posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mb-4 text-6xl">📭</div>
        <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">
          No posts yet
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          Check back soon for new content!
        </p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-8 md:grid-cols-2', className)}>
      {posts.map((post, index) => (
        <BlogCard
          key={post.slug}
          post={post}
          featured={showFeatured && index === 0}
        />
      ))}
    </div>
  );
}

// ============================================
// Author Card Component
// ============================================

interface AuthorCardProps {
  author: BlogPostMeta['author'];
  className?: string;
}

export function AuthorCard({ author, className }: AuthorCardProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        {author.avatar ? (
          <Image
            src={author.avatar}
            alt={author.name}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        )}
      </div>
      <div>
        <div className="font-medium text-slate-900 dark:text-white">
          {author.name}
        </div>
        {author.role && (
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {author.role}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// Tag List Component
// ============================================

interface TagListProps {
  tags: { tag: string; count: number }[];
  activeTag?: string;
  className?: string;
}

export function TagList({ tags, activeTag, className }: TagListProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      <Link
        href="/blog"
        className={cn(
          'rounded-full px-4 py-2 text-sm font-medium transition-colors',
          !activeTag
            ? 'bg-emerald-500 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
        )}
      >
        All Posts
      </Link>
      {tags.map(({ tag, count }) => (
        <Link
          key={tag}
          href={`/blog/tag/${tag}`}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition-colors',
            activeTag === tag
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
          )}
        >
          {tag} ({count})
        </Link>
      ))}
    </div>
  );
}

// ============================================
// Related Posts Component
// ============================================

interface RelatedPostsProps {
  posts: BlogPostMeta[];
  className?: string;
}

export function RelatedPosts({ posts, className }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section className={cn('mt-16 border-t border-slate-200 pt-12 dark:border-slate-700', className)}>
      <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-white">
        Related Posts
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
