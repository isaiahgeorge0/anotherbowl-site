import { NextResponse } from 'next/server';
import { authorizeStaffMenuRequest, getStaffMenuSupabase } from '../menu/_lib';
import {
  CONTENT_KEYS,
  ensureUniqueSlug,
  loadManagedContentSettings,
  type ManagedBlogPost,
  slugify,
} from '@/lib/contentSettings';

type UpdateContentBody = {
  homepage?: {
    announcementTitle?: string;
    shortMessage?: string;
  };
  runClub?: {
    announcement?: string;
    nextEventDateTime?: string;
    meetingPoint?: string;
  };
};

type CreateBlogPostBody = {
  title?: string;
  slug?: string;
  excerpt?: string;
  body?: string;
  status?: 'draft' | 'published';
  featuredImageUrl?: string;
  featuredImageAlt?: string;
};

const toTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export async function GET(request: Request) {
  const unauthorized = await authorizeStaffMenuRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await loadManagedContentSettings();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Could not load content settings.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const unauthorized = await authorizeStaffMenuRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as UpdateContentBody;
    const updates: Array<{ key: string; value: unknown }> = [];
    if (body.homepage) {
      if (typeof body.homepage.announcementTitle === 'string') {
        updates.push({
          key: CONTENT_KEYS.homepageAnnouncementTitle,
          value: body.homepage.announcementTitle.trim(),
        });
      }
      if (typeof body.homepage.shortMessage === 'string') {
        updates.push({
          key: CONTENT_KEYS.homepageShortMessage,
          value: body.homepage.shortMessage.trim(),
        });
      }
    }
    if (body.runClub) {
      if (typeof body.runClub.announcement === 'string') {
        updates.push({ key: CONTENT_KEYS.runClubAnnouncement, value: body.runClub.announcement.trim() });
      }
      if (typeof body.runClub.nextEventDateTime === 'string') {
        updates.push({
          key: CONTENT_KEYS.runClubNextEventDateTime,
          value: body.runClub.nextEventDateTime.trim(),
        });
      }
      if (typeof body.runClub.meetingPoint === 'string') {
        updates.push({ key: CONTENT_KEYS.runClubMeetingPoint, value: body.runClub.meetingPoint.trim() });
      }
    }

    if (!updates.length) {
      return NextResponse.json({ error: 'No content fields provided.' }, { status: 400 });
    }

    const supabase = getStaffMenuSupabase();
    const { error } = await supabase.from('app_settings').upsert(updates, { onConflict: 'key' });
    if (error) {
      return NextResponse.json({ error: 'Could not save content settings.' }, { status: 500 });
    }

    const result = await loadManagedContentSettings();

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Could not save content settings.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await authorizeStaffMenuRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const body = (await request.json()) as CreateBlogPostBody;
    const title = toTrimmedString(body.title);
    const requestedSlug = toTrimmedString(body.slug);
    const excerpt = toTrimmedString(body.excerpt);
    const postBody = toTrimmedString(body.body);
    const featuredImageUrl = toTrimmedString(body.featuredImageUrl);
    const featuredImageAlt = toTrimmedString(body.featuredImageAlt);
    const status: ManagedBlogPost['status'] = body.status === 'published' ? 'published' : 'draft';
    if (!title) {
      return NextResponse.json({ error: 'Post title is required.' }, { status: 400 });
    }
    if (featuredImageUrl && !featuredImageAlt) {
      return NextResponse.json(
        { error: 'Featured image alt text is required when an image URL is provided.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const supabase = getStaffMenuSupabase();
    const current = await loadManagedContentSettings();

    const newPost: ManagedBlogPost = {
      id: crypto.randomUUID(),
      title,
      slug: ensureUniqueSlug(requestedSlug || slugify(title), current.blogPosts),
      excerpt,
      body: postBody,
      status,
      featuredImageUrl,
      featuredImageAlt,
      createdAt: now,
      updatedAt: now,
    };

    const nextPosts = [newPost, ...current.blogPosts];
    const { error } = await supabase.from('app_settings').upsert(
      {
        key: CONTENT_KEYS.blogPosts,
        value: nextPosts,
      },
      { onConflict: 'key' }
    );

    if (error) {
      return NextResponse.json({ error: 'Could not create blog post.' }, { status: 500 });
    }

    return NextResponse.json({ blogPost: newPost }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Could not create blog post.' }, { status: 500 });
  }
}
