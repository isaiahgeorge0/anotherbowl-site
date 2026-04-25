import 'server-only';
import { blogPosts as fallbackBlogPosts } from '@/data/blogPosts';
import { getSupabaseServiceClient } from '@/lib/supabaseService';

export type ManagedBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  status: 'draft' | 'published';
  featuredImageUrl: string;
  featuredImageAlt: string;
  createdAt: string;
  updatedAt: string;
};

export type ManagedContentSettings = {
  homepage: {
    announcementTitle: string;
    shortMessage: string;
  };
  runClub: {
    announcement: string;
    nextEventDateTime: string;
    meetingPoint: string;
  };
  blogPosts: ManagedBlogPost[];
};

export const CONTENT_KEYS = {
  homepageAnnouncementTitle: 'content_homepage_announcement_title',
  homepageShortMessage: 'content_homepage_short_message',
  runClubAnnouncement: 'content_runclub_announcement',
  runClubNextEventDateTime: 'content_runclub_next_event_datetime',
  runClubMeetingPoint: 'content_runclub_meeting_point',
  blogPosts: 'content_blog_posts',
} as const;

const toTrimmedString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const fallbackDate = () => new Date().toISOString();

const normalizeStatus = (value: unknown): 'draft' | 'published' =>
  value === 'published' ? 'published' : 'draft';

const normalizePost = (value: unknown): ManagedBlogPost | null => {
  if (!value || typeof value !== 'object') return null;
  const asRecord = value as Record<string, unknown>;
  const id = toTrimmedString(asRecord.id);
  const title = toTrimmedString(asRecord.title);
  if (!id || !title) return null;

  const createdAt =
    toTrimmedString(asRecord.createdAt) || toTrimmedString(asRecord.created_at) || fallbackDate();
  const updatedAt =
    toTrimmedString(asRecord.updatedAt) || toTrimmedString(asRecord.updated_at) || createdAt;
  const slug = slugify(toTrimmedString(asRecord.slug) || id || title);
  const excerpt = toTrimmedString(asRecord.excerpt) || toTrimmedString(asRecord.summary);
  const body = toTrimmedString(asRecord.body) || toTrimmedString(asRecord.content);
  const featuredImageUrl =
    toTrimmedString(asRecord.featuredImageUrl) || toTrimmedString(asRecord.featured_image_url);
  const featuredImageAlt =
    toTrimmedString(asRecord.featuredImageAlt) || toTrimmedString(asRecord.featured_image_alt);

  return {
    id,
    title,
    slug: slug || slugify(id),
    excerpt,
    body,
    status: normalizeStatus(asRecord.status),
    featuredImageUrl,
    featuredImageAlt,
    createdAt,
    updatedAt,
  };
};

const fallbackManagedPosts = (): ManagedBlogPost[] =>
  fallbackBlogPosts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: slugify(post.id),
    excerpt: post.summary,
    body: post.content,
    status: 'published',
    featuredImageUrl: '',
    featuredImageAlt: '',
    createdAt: post.date,
    updatedAt: post.date,
  }));

const defaultContentSettings = (): ManagedContentSettings => ({
  homepage: {
    announcementTitle: '',
    shortMessage: '',
  },
  runClub: {
    announcement: '',
    nextEventDateTime: '',
    meetingPoint: '',
  },
  blogPosts: fallbackManagedPosts(),
});

export const readStringSetting = (rows: Array<{ key: string; value: unknown }>, key: string) => {
  const row = rows.find((entry) => entry.key === key);
  return toTrimmedString(row?.value);
};

export const readBlogPostsSetting = (rows: Array<{ key: string; value: unknown }>) => {
  const row = rows.find((entry) => entry.key === CONTENT_KEYS.blogPosts);
  if (!row || !Array.isArray(row.value)) return [];
  return row.value.map(normalizePost).filter((post): post is ManagedBlogPost => post !== null);
};

export const loadManagedContentSettings = async (): Promise<ManagedContentSettings> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SERVER_SUPABASE_SERVICE_ROLE_KEY) {
    return defaultContentSettings();
  }

  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('key,value')
      .in('key', Object.values(CONTENT_KEYS));

    if (error) {
      return defaultContentSettings();
    }

    const rows = data ?? [];
    const fromSettings = readBlogPostsSetting(rows).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      homepage: {
        announcementTitle: readStringSetting(rows, CONTENT_KEYS.homepageAnnouncementTitle),
        shortMessage: readStringSetting(rows, CONTENT_KEYS.homepageShortMessage),
      },
      runClub: {
        announcement: readStringSetting(rows, CONTENT_KEYS.runClubAnnouncement),
        nextEventDateTime: readStringSetting(rows, CONTENT_KEYS.runClubNextEventDateTime),
        meetingPoint: readStringSetting(rows, CONTENT_KEYS.runClubMeetingPoint),
      },
      blogPosts: fromSettings.length ? fromSettings : fallbackManagedPosts(),
    };
  } catch {
    return defaultContentSettings();
  }
};

export const ensureUniqueSlug = (slugCandidate: string, posts: ManagedBlogPost[], currentPostId?: string) => {
  const base = slugify(slugCandidate) || `post-${Math.random().toString(36).slice(2, 8)}`;
  let nextSlug = base;
  let suffix = 2;
  while (posts.some((post) => post.id !== currentPostId && post.slug === nextSlug)) {
    nextSlug = `${base}-${suffix}`;
    suffix += 1;
  }
  return nextSlug;
};

