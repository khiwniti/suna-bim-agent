/**
 * Blog Utilities
 *
 * Functions for reading and parsing MDX blog posts.
 * Uses gray-matter for frontmatter and reading-time for estimates.
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

// ============================================
// Types
// ============================================

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
  tags: string[];
  image?: string;
  readingTime: string;
  content: string;
  featured?: boolean;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: {
    name: string;
    avatar?: string;
    role?: string;
  };
  tags: string[];
  image?: string;
  readingTime: string;
  featured?: boolean;
}

// ============================================
// Constants
// ============================================

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

// ============================================
// Functions
// ============================================

/**
 * Get all blog post slugs
 */
export function getBlogSlugs(): string[] {
  try {
    if (!fs.existsSync(BLOG_DIR)) {
      return [];
    }

    const files = fs.readdirSync(BLOG_DIR);
    return files
      .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
      .map((file) => file.replace(/\.mdx?$/, ''));
  } catch (error) {
    console.error('[Blog] Error reading blog directory:', error);
    return [];
  }
}

/**
 * Get a single blog post by slug
 */
export function getBlogPost(slug: string): BlogPost | null {
  try {
    const mdxPath = path.join(BLOG_DIR, `${slug}.mdx`);
    const mdPath = path.join(BLOG_DIR, `${slug}.md`);

    let filePath = '';
    if (fs.existsSync(mdxPath)) {
      filePath = mdxPath;
    } else if (fs.existsSync(mdPath)) {
      filePath = mdPath;
    } else {
      return null;
    }

    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    const stats = readingTime(content);

    return {
      slug,
      title: data.title || 'Untitled',
      description: data.description || '',
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
      author: {
        name: data.author?.name || data.author || 'CarbonBIM Team',
        avatar: data.author?.avatar,
        role: data.author?.role,
      },
      tags: data.tags || [],
      image: data.image,
      readingTime: stats.text,
      content,
      featured: data.featured || false,
    };
  } catch (error) {
    console.error(`[Blog] Error reading post ${slug}:`, error);
    return null;
  }
}

/**
 * Get all blog posts (metadata only, sorted by date)
 */
export function getAllBlogPosts(): BlogPostMeta[] {
  const slugs = getBlogSlugs();
  const posts = slugs
    .map((slug) => {
      const post = getBlogPost(slug);
      if (!post) return null;

      // Return metadata only (exclude content)
      const { content, ...meta } = post;
      return meta;
    })
    .filter((post): post is BlogPostMeta => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
}

/**
 * Get featured blog posts
 */
export function getFeaturedPosts(limit: number = 3): BlogPostMeta[] {
  const posts = getAllBlogPosts();
  const featured = posts.filter((post) => post.featured);

  // If not enough featured posts, fill with recent posts
  if (featured.length < limit) {
    const nonFeatured = posts.filter((post) => !post.featured);
    return [...featured, ...nonFeatured].slice(0, limit);
  }

  return featured.slice(0, limit);
}

/**
 * Get posts by tag
 */
export function getPostsByTag(tag: string): BlogPostMeta[] {
  const posts = getAllBlogPosts();
  return posts.filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  );
}

/**
 * Get all unique tags
 */
export function getAllTags(): { tag: string; count: number }[] {
  const posts = getAllBlogPosts();
  const tagCounts = new Map<string, number>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      const normalizedTag = tag.toLowerCase();
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
    });
  });

  return Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get related posts (by shared tags)
 */
export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPostMeta[] {
  const currentPost = getBlogPost(currentSlug);
  if (!currentPost) return [];

  const allPosts = getAllBlogPosts().filter((post) => post.slug !== currentSlug);

  // Score posts by number of shared tags
  const scored = allPosts.map((post) => {
    const sharedTags = post.tags.filter((tag) =>
      currentPost.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
    );
    return { post, score: sharedTags.length };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);
}
