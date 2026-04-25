import { NextResponse } from 'next/server';
import { authorizeStaffMenuRequest, getStaffMenuSupabase } from '../../../menu/_lib';
import {
  CONTENT_KEYS,
  ensureUniqueSlug,
  loadManagedContentSettings,
  type ManagedBlogPost,
  slugify,
} from '@/lib/contentSettings';

type UpdateBlogPostBody = {
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  status?: 'draft' | 'published';
  featuredImageUrl?: string;
  featuredImageAlt?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = await authorizeStaffMenuRequest(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const postId = decodeURIComponent(id ?? '').trim();
  if (!postId) {
    return NextResponse.json({ error: 'Post id is required.' }, { status: 400 });
  }

  try {
    const body = (await request.json()) as UpdateBlogPostBody;
    const current = await loadManagedContentSettings();

    const currentPost = current.blogPosts.find((post) => post.id === postId);
    if (!currentPost) {
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
    }

    const nextTitle = typeof body.title === 'string' ? body.title.trim() : currentPost.title;
    const requestedSlug = typeof body.slug === 'string' ? body.slug.trim() : currentPost.slug;
    const nextSlug = ensureUniqueSlug(requestedSlug || slugify(nextTitle), current.blogPosts, currentPost.id);
    const nextFeaturedImageUrl =
      typeof body.featuredImageUrl === 'string' ? body.featuredImageUrl.trim() : currentPost.featuredImageUrl;
    const nextFeaturedImageAlt =
      typeof body.featuredImageAlt === 'string' ? body.featuredImageAlt.trim() : currentPost.featuredImageAlt;
    if (nextFeaturedImageUrl && !nextFeaturedImageAlt) {
      return NextResponse.json(
        { error: 'Featured image alt text is required when an image URL is provided.' },
        { status: 400 }
      );
    }

    const nextPost: ManagedBlogPost = {
      ...currentPost,
      title: nextTitle,
      slug: nextSlug,
      excerpt: typeof body.excerpt === 'string' ? body.excerpt.trim() : currentPost.excerpt,
      body: typeof body.body === 'string' ? body.body.trim() : currentPost.body,
      status: body.status === 'published' || body.status === 'draft' ? body.status : currentPost.status,
      featuredImageUrl: nextFeaturedImageUrl,
      featuredImageAlt: nextFeaturedImageAlt,
      updatedAt: new Date().toISOString(),
    };

    if (!nextPost.title) {
      return NextResponse.json({ error: 'Post title is required.' }, { status: 400 });
    }

    const nextPosts = current.blogPosts.map((post) => (post.id === postId ? nextPost : post));
    const supabase = getStaffMenuSupabase();
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: CONTENT_KEYS.blogPosts, value: nextPosts }, { onConflict: 'key' });
    if (error) {
      return NextResponse.json({ error: 'Could not update blog post.' }, { status: 500 });
    }

    return NextResponse.json({ blogPost: nextPost });
  } catch {
    return NextResponse.json({ error: 'Could not update blog post.' }, { status: 500 });
  }
}

const BLOG_IMAGE_PUBLIC_SEGMENT = '/storage/v1/object/public/blog-images/';

const getBlogImageObjectPath = (url: string) => {
  const trimmed = url.trim();
  if (!trimmed) return null;
  const markerIndex = trimmed.indexOf(BLOG_IMAGE_PUBLIC_SEGMENT);
  if (markerIndex === -1) return null;
  const objectPath = trimmed.slice(markerIndex + BLOG_IMAGE_PUBLIC_SEGMENT.length).trim();
  return objectPath || null;
};

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = await authorizeStaffMenuRequest(request);
  if (unauthorized) return unauthorized;

  const { id } = await context.params;
  const postId = decodeURIComponent(id ?? '').trim();
  if (!postId) {
    return NextResponse.json({ error: 'Post id is required.' }, { status: 400 });
  }

  try {
    const current = await loadManagedContentSettings();
    const currentPost = current.blogPosts.find((post) => post.id === postId);
    if (!currentPost) {
      return NextResponse.json({ error: 'Blog post not found.' }, { status: 404 });
    }

    const nextPosts = current.blogPosts.filter((post) => post.id !== postId);
    const supabase = getStaffMenuSupabase();
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: CONTENT_KEYS.blogPosts, value: nextPosts }, { onConflict: 'key' });
    if (error) {
      return NextResponse.json({ error: 'Could not delete blog post.' }, { status: 500 });
    }

    let imageCleanupWarning = '';
    const imageObjectPath = getBlogImageObjectPath(currentPost.featuredImageUrl);
    if (imageObjectPath) {
      const { error: removeError } = await supabase.storage.from('blog-images').remove([imageObjectPath]);
      if (removeError) {
        imageCleanupWarning =
          'Post deleted, but featured image cleanup failed. Please review Supabase Storage manually.';
      }
    }

    return NextResponse.json({
      deletedId: postId,
      warning: imageCleanupWarning || undefined,
    });
  } catch {
    return NextResponse.json({ error: 'Could not delete blog post.' }, { status: 500 });
  }
}
