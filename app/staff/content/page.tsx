'use client';

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import StaffNav from '@/components/StaffNav';
import { supabaseServer } from '@/lib/supabaseServer';

type BlogPost = {
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

type ContentPayload = {
  homepage?: {
    announcementTitle?: string;
    shortMessage?: string;
  };
  runClub?: {
    announcement?: string;
    nextEventDateTime?: string;
    meetingPoint?: string;
  };
  blogPosts?: BlogPost[];
  error?: string;
};

const actionButtonClass =
  'button-staff inline-flex min-h-[42px] items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold shadow-sm';
const inputClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20';
const textareaClass =
  'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20';

export default function StaffContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingHomepage, setSavingHomepage] = useState(false);
  const [savingRunClub, setSavingRunClub] = useState(false);
  const [creatingPost, setCreatingPost] = useState(false);
  const [updatingPostId, setUpdatingPostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [homepageAnnouncementTitle, setHomepageAnnouncementTitle] = useState('');
  const [homepageShortMessage, setHomepageShortMessage] = useState('');
  const [runClubAnnouncement, setRunClubAnnouncement] = useState('');
  const [runClubNextEventDateTime, setRunClubNextEventDateTime] = useState('');
  const [runClubMeetingPoint, setRunClubMeetingPoint] = useState('');

  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostSlug, setNewPostSlug] = useState('');
  const [newPostExcerpt, setNewPostExcerpt] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [newPostStatus, setNewPostStatus] = useState<'draft' | 'published'>('draft');
  const [newPostFeaturedImageUrl, setNewPostFeaturedImageUrl] = useState('');
  const [newPostFeaturedImageAlt, setNewPostFeaturedImageAlt] = useState('');
  const [newPostImageFile, setNewPostImageFile] = useState<File | null>(null);
  const [uploadingNewPostImage, setUploadingNewPostImage] = useState(false);

  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editStatus, setEditStatus] = useState<'draft' | 'published'>('draft');
  const [editFeaturedImageUrl, setEditFeaturedImageUrl] = useState('');
  const [editFeaturedImageAlt, setEditFeaturedImageAlt] = useState('');
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [uploadingEditPostImage, setUploadingEditPostImage] = useState(false);

  const publishedCount = useMemo(
    () => blogPosts.filter((post) => post.status === 'published').length,
    [blogPosts]
  );

  const getStaffAuthHeaders = async () => {
    const headers: Record<string, string> = {};
    const { data } = await supabaseServer.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      headers.authorization = `Bearer ${accessToken}`;
    }
    const legacyStaffKey = process.env.NEXT_PUBLIC_STAFF_API_KEY;
    if (legacyStaffKey) {
      headers['x-staff-key'] = legacyStaffKey;
    }
    return headers;
  };

  const loadContent = async () => {
    setLoading(true);
    setError('');
    try {
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch('/api/staff/content', { cache: 'no-store', headers: authHeaders });
      const payload = (await response.json()) as ContentPayload;
      if (!response.ok) {
        setError(payload.error ?? 'Could not load content settings.');
        setLoading(false);
        return;
      }

      setHomepageAnnouncementTitle(payload.homepage?.announcementTitle ?? '');
      setHomepageShortMessage(payload.homepage?.shortMessage ?? '');
      setRunClubAnnouncement(payload.runClub?.announcement ?? '');
      setRunClubNextEventDateTime(payload.runClub?.nextEventDateTime ?? '');
      setRunClubMeetingPoint(payload.runClub?.meetingPoint ?? '');
      setBlogPosts(payload.blogPosts ?? []);
      setLoading(false);
    } catch {
      setError('Could not load content settings.');
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabaseServer.auth.getSession();
      if (!data.session) {
        router.replace('/staff/login');
        return;
      }
      if (!active) return;
      await loadContent();
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const saveHomepage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingHomepage) return;
    setSavingHomepage(true);
    setError('');
    setSuccess('');
    try {
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch('/api/staff/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          homepage: {
            announcementTitle: homepageAnnouncementTitle,
            shortMessage: homepageShortMessage,
          },
        }),
      });
      const payload = (await response.json()) as ContentPayload;
      if (!response.ok) {
        setError(payload.error ?? 'Could not save homepage content.');
        setSavingHomepage(false);
        return;
      }
      setSuccess('Homepage content saved.');
      setSavingHomepage(false);
    } catch {
      setError('Could not save homepage content.');
      setSavingHomepage(false);
    }
  };

  const saveRunClub = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingRunClub) return;
    setSavingRunClub(true);
    setError('');
    setSuccess('');
    try {
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch('/api/staff/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          runClub: {
            announcement: runClubAnnouncement,
            nextEventDateTime: runClubNextEventDateTime,
            meetingPoint: runClubMeetingPoint,
          },
        }),
      });
      const payload = (await response.json()) as ContentPayload;
      if (!response.ok) {
        setError(payload.error ?? 'Could not save run club content.');
        setSavingRunClub(false);
        return;
      }
      setSuccess('Run Club content saved.');
      setSavingRunClub(false);
    } catch {
      setError('Could not save run club content.');
      setSavingRunClub(false);
    }
  };

  const createPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creatingPost) return;
    if ((newPostFeaturedImageUrl || newPostImageFile) && !newPostFeaturedImageAlt.trim()) {
      setError('Featured image alt text is required when an image is provided.');
      return;
    }
    setCreatingPost(true);
    setError('');
    setSuccess('');
    try {
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch('/api/staff/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          title: newPostTitle,
          slug: newPostSlug,
          excerpt: newPostExcerpt,
          body: newPostBody,
          status: newPostStatus,
          featuredImageUrl: newPostFeaturedImageUrl,
          featuredImageAlt: newPostFeaturedImageAlt,
        }),
      });
      const payload = (await response.json()) as { error?: string; blogPost?: BlogPost };
      if (!response.ok || !payload.blogPost) {
        setError(payload.error ?? 'Could not create blog post.');
        setCreatingPost(false);
        return;
      }
      setBlogPosts((prev) => [payload.blogPost as BlogPost, ...prev]);
      setNewPostTitle('');
      setNewPostSlug('');
      setNewPostExcerpt('');
      setNewPostBody('');
      setNewPostStatus('draft');
      setNewPostFeaturedImageUrl('');
      setNewPostFeaturedImageAlt('');
      setNewPostImageFile(null);
      setCreatingPost(false);
      setSuccess('Blog post created.');
    } catch {
      setError('Could not create blog post.');
      setCreatingPost(false);
    }
  };

  const beginEditPost = (post: BlogPost) => {
    setEditingPostId(post.id);
    setEditTitle(post.title);
    setEditSlug(post.slug);
    setEditExcerpt(post.excerpt);
    setEditBody(post.body);
    setEditStatus(post.status);
    setEditFeaturedImageUrl(post.featuredImageUrl ?? '');
    setEditFeaturedImageAlt(post.featuredImageAlt ?? '');
    setEditImageFile(null);
    setSuccess('');
    setError('');
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setUpdatingPostId(null);
  };

  const savePost = async (postId: string) => {
    if (updatingPostId) return;
    if (editFeaturedImageUrl && !editFeaturedImageAlt.trim()) {
      setError('Featured image alt text is required when an image is provided.');
      return;
    }
    setUpdatingPostId(postId);
    setError('');
    setSuccess('');
    try {
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch(`/api/staff/content/posts/${encodeURIComponent(postId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({
          title: editTitle,
          slug: editSlug,
          excerpt: editExcerpt,
          body: editBody,
          status: editStatus,
          featuredImageUrl: editFeaturedImageUrl,
          featuredImageAlt: editFeaturedImageAlt,
        }),
      });
      const payload = (await response.json()) as { error?: string; blogPost?: BlogPost };
      if (!response.ok || !payload.blogPost) {
        setError(payload.error ?? 'Could not update blog post.');
        setUpdatingPostId(null);
        return;
      }
      setBlogPosts((prev) =>
        prev.map((post) => (post.id === postId ? (payload.blogPost as BlogPost) : post))
      );
      setEditingPostId(null);
      setUpdatingPostId(null);
      setSuccess('Blog post updated.');
    } catch {
      setError('Could not update blog post.');
      setUpdatingPostId(null);
    }
  };

  const deletePost = async (post: BlogPost) => {
    if (deletingPostId) return;
    const confirmed = window.confirm(
      `Delete "${post.title}"? This will remove it from the blog posts list.`
    );
    if (!confirmed) return;

    setDeletingPostId(post.id);
    setError('');
    setSuccess('');
    try {
      const authHeaders = await getStaffAuthHeaders();
      const response = await fetch(`/api/staff/content/posts/${encodeURIComponent(post.id)}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      const payload = (await response.json()) as { error?: string; deletedId?: string; warning?: string };
      if (!response.ok || !payload.deletedId) {
        setError(payload.error ?? 'Could not delete blog post.');
        setDeletingPostId(null);
        return;
      }
      setBlogPosts((prev) => prev.filter((entry) => entry.id !== post.id));
      setEditingPostId((current) => (current === post.id ? null : current));
      setDeletingPostId(null);
      setSuccess(payload.warning ?? 'Blog post deleted.');
    } catch {
      setError('Could not delete blog post.');
      setDeletingPostId(null);
    }
  };

  const uploadBlogImage = async (
    file: File | null,
    setUrl: (value: string) => void,
    setUploading: (value: boolean) => void
  ) => {
    if (!file) {
      setError('Select an image file first.');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const authHeaders = await getStaffAuthHeaders();
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/staff/content/upload-image', {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });
      const payload = (await response.json()) as { error?: string; featuredImageUrl?: string };
      if (!response.ok || !payload.featuredImageUrl) {
        setError(payload.error ?? 'Could not upload image.');
        setUploading(false);
        return;
      }
      setUrl(payload.featuredImageUrl);
      setSuccess('Image uploaded.');
      setUploading(false);
    } catch {
      setError('Could not upload image.');
      setUploading(false);
    }
  };

  const keepTextareaEnter = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter') {
      // Ensure textarea enter key always inserts a newline without triggering parent handlers.
      event.stopPropagation();
    }
  };

  const getPublicPostUrl = (slug: string) => {
    if (typeof window === 'undefined') return `/blog/${slug}`;
    return `${window.location.origin}/blog/${slug}`;
  };

  const copyPublicLink = async (slug: string) => {
    const link = getPublicPostUrl(slug);
    try {
      await navigator.clipboard.writeText(link);
      setSuccess('Public blog link copied.');
      setError('');
    } catch {
      setError('Could not copy link automatically. Please copy it manually.');
      setSuccess(link);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
        <NavBar />
        <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
          <p className="text-sm text-stone-600">Loading content editor...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen scroll-smooth bg-gradient-to-br from-light via-white to-light">
      <NavBar />
      <main className="mx-auto max-w-6xl px-6 py-12 sm:px-8 sm:py-16">
        <section className="rounded-2xl border border-stone-200/70 bg-light/90 p-5 shadow-[0_6px_28px_rgba(28,26,24,0.06)] sm:p-6">
          <div className="mb-4">
            <h1 className="text-3xl font-black text-stone-900 sm:text-4xl">Content Editor</h1>
            <p className="mt-1 text-sm text-stone-600">
              Update simple website text content for homepage, blog, and run club.
            </p>
          </div>

          <StaffNav />

          <div className="mb-5 rounded-xl border border-stone-200/80 bg-white p-4 text-sm text-stone-700">
            <p>
              Blog posts: <span className="font-bold text-stone-900">{blogPosts.length}</span> total (
              <span className="font-bold text-stone-900">{publishedCount}</span> published)
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Blog images can be uploaded to Supabase Storage. If the bucket is missing, follow
              `supabase/storage-blog-images-setup.sql`.
            </p>
          </div>

          {error && (
            <p className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>
          )}
          {success && (
            <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              {success}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <form onSubmit={saveHomepage} className="space-y-3 rounded-xl border border-stone-200/80 bg-white p-4">
              <h2 className="text-lg font-bold text-stone-900">Homepage updates</h2>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Announcement / title text
                </label>
                <textarea
                  value={homepageAnnouncementTitle}
                  onChange={(event) => setHomepageAnnouncementTitle(event.target.value)}
                  onKeyDown={keepTextareaEnter}
                  className={textareaClass}
                  rows={3}
                  placeholder="e.g. Fresh bowls made daily"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Short homepage message
                </label>
                <textarea
                  value={homepageShortMessage}
                  onChange={(event) => setHomepageShortMessage(event.target.value)}
                  onKeyDown={keepTextareaEnter}
                  className={textareaClass}
                  rows={4}
                  placeholder="Short supporting homepage message..."
                />
              </div>
              <button type="submit" disabled={savingHomepage} className={actionButtonClass}>
                {savingHomepage ? 'Saving...' : 'Save homepage text'}
              </button>
            </form>

            <form onSubmit={saveRunClub} className="space-y-3 rounded-xl border border-stone-200/80 bg-white p-4">
              <h2 className="text-lg font-bold text-stone-900">Run Club updates</h2>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Run club announcement
                </label>
                <textarea
                  value={runClubAnnouncement}
                  onChange={(event) => setRunClubAnnouncement(event.target.value)}
                  onKeyDown={keepTextareaEnter}
                  className={textareaClass}
                  rows={3}
                  placeholder="This week we meet at..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Next event date/time (optional)
                </label>
                <input
                  value={runClubNextEventDateTime}
                  onChange={(event) => setRunClubNextEventDateTime(event.target.value)}
                  className={inputClass}
                  placeholder="e.g. Thursday 6:30 PM"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Meeting point (optional)
                </label>
                <input
                  value={runClubMeetingPoint}
                  onChange={(event) => setRunClubMeetingPoint(event.target.value)}
                  className={inputClass}
                  placeholder="e.g. Another Bowl front entrance"
                />
              </div>
              <button type="submit" disabled={savingRunClub} className={actionButtonClass}>
                {savingRunClub ? 'Saving...' : 'Save run club text'}
              </button>
            </form>
          </div>

          <section className="mt-6 rounded-xl border border-stone-200/80 bg-white p-4">
            <h2 className="text-lg font-bold text-stone-900">Blog posts</h2>
            <p className="mt-1 text-sm text-stone-600">Create and manage simple posts with draft/published status.</p>

            <form onSubmit={createPost} className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-stone-200/80 bg-stone-50/70 p-3 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Title
                </label>
                <input
                  value={newPostTitle}
                  onChange={(event) => setNewPostTitle(event.target.value)}
                  className={inputClass}
                  placeholder="Post title"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Slug (optional)
                </label>
                <input
                  value={newPostSlug}
                  onChange={(event) => setNewPostSlug(event.target.value)}
                  className={inputClass}
                  placeholder="run-club-week-1-recap"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Excerpt
                </label>
                <textarea
                  value={newPostExcerpt}
                  onChange={(event) => setNewPostExcerpt(event.target.value)}
                  onKeyDown={keepTextareaEnter}
                  className={textareaClass}
                  rows={2}
                  placeholder="Short excerpt shown in listing"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Body
                </label>
                <textarea
                  value={newPostBody}
                  onChange={(event) => setNewPostBody(event.target.value)}
                  onKeyDown={keepTextareaEnter}
                  className={textareaClass}
                  rows={5}
                  placeholder="Post content"
                />
              </div>
              <div className="md:col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                    Featured image URL (optional)
                  </label>
                  <input
                    value={newPostFeaturedImageUrl}
                    onChange={(event) => setNewPostFeaturedImageUrl(event.target.value)}
                    className={inputClass}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                    Upload image
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => setNewPostImageFile(event.target.files?.[0] ?? null)}
                      className={inputClass}
                    />
                    <button
                      type="button"
                      className={actionButtonClass}
                      onClick={() =>
                        uploadBlogImage(newPostImageFile, setNewPostFeaturedImageUrl, setUploadingNewPostImage)
                      }
                      disabled={uploadingNewPostImage}
                    >
                      {uploadingNewPostImage ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Featured image alt text
                </label>
                <input
                  value={newPostFeaturedImageAlt}
                  onChange={(event) => setNewPostFeaturedImageAlt(event.target.value)}
                  className={inputClass}
                  placeholder="Describe the image for accessibility"
                />
              </div>
              {newPostFeaturedImageUrl && (
                <div className="md:col-span-2">
                  <p className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                    Image preview
                  </p>
                  <div className="overflow-hidden rounded-lg border border-stone-200">
                    <img
                      src={newPostFeaturedImageUrl}
                      alt={newPostFeaturedImageAlt || newPostTitle || 'Featured image preview'}
                      className="h-auto w-full max-h-48 object-cover"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                  Status
                </label>
                <select
                  value={newPostStatus}
                  onChange={(event) => setNewPostStatus(event.target.value === 'published' ? 'published' : 'draft')}
                  className={inputClass}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <button type="submit" disabled={creatingPost} className={actionButtonClass}>
                  {creatingPost ? 'Creating...' : 'Create post'}
                </button>
              </div>
            </form>

            <div className="mt-4 space-y-3">
              {blogPosts.map((post) => {
                const isEditing = editingPostId === post.id;
                return (
                  <article key={post.id} className="rounded-xl border border-stone-200/80 bg-stone-50/40 p-3">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          value={editTitle}
                          onChange={(event) => setEditTitle(event.target.value)}
                          className={inputClass}
                        />
                        <input
                          value={editSlug}
                          onChange={(event) => setEditSlug(event.target.value)}
                          className={inputClass}
                          placeholder="Slug"
                        />
                        <textarea
                          value={editExcerpt}
                          onChange={(event) => setEditExcerpt(event.target.value)}
                          onKeyDown={keepTextareaEnter}
                          className={textareaClass}
                          rows={2}
                        />
                        <textarea
                          value={editBody}
                          onChange={(event) => setEditBody(event.target.value)}
                          onKeyDown={keepTextareaEnter}
                          className={textareaClass}
                          rows={5}
                        />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                              Featured image URL
                            </label>
                            <input
                              value={editFeaturedImageUrl}
                              onChange={(event) => setEditFeaturedImageUrl(event.target.value)}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600">
                              Upload replacement
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => setEditImageFile(event.target.files?.[0] ?? null)}
                                className={inputClass}
                              />
                              <button
                                type="button"
                                className={actionButtonClass}
                                onClick={() =>
                                  uploadBlogImage(editImageFile, setEditFeaturedImageUrl, setUploadingEditPostImage)
                                }
                                disabled={uploadingEditPostImage}
                              >
                                {uploadingEditPostImage ? 'Uploading...' : 'Upload'}
                              </button>
                            </div>
                          </div>
                        </div>
                        <input
                          value={editFeaturedImageAlt}
                          onChange={(event) => setEditFeaturedImageAlt(event.target.value)}
                          className={inputClass}
                          placeholder="Featured image alt text"
                        />
                        {editFeaturedImageUrl && (
                          <div className="overflow-hidden rounded-lg border border-stone-200">
                            <img
                              src={editFeaturedImageUrl}
                              alt={editFeaturedImageAlt || editTitle || 'Featured image preview'}
                              className="h-auto w-full max-h-48 object-cover"
                            />
                          </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <select
                            value={editStatus}
                            onChange={(event) =>
                              setEditStatus(event.target.value === 'published' ? 'published' : 'draft')
                            }
                            className={inputClass}
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                          </select>
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => savePost(post.id)}
                            disabled={updatingPostId === post.id}
                          >
                            {updatingPostId === post.id ? 'Saving...' : 'Save'}
                          </button>
                          <button type="button" className={actionButtonClass} onClick={cancelEditPost}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-base font-bold text-stone-900">{post.title}</h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              post.status === 'published'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-200 text-stone-700'
                            }`}
                          >
                            {post.status === 'published' ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        {post.excerpt && <p className="mt-2 text-sm text-stone-600">{post.excerpt}</p>}
                        {!!post.featuredImageUrl && (
                          <div className="mt-2 overflow-hidden rounded-lg border border-stone-200">
                            <img
                              src={post.featuredImageUrl}
                              alt={post.featuredImageAlt || post.title}
                              className="h-auto w-full object-cover"
                            />
                          </div>
                        )}
                        {post.body && <p className="mt-2 text-sm text-stone-700 line-clamp-4">{post.body}</p>}
                        <p className="mt-2 text-xs text-stone-500">Slug: {post.slug}</p>
                        <p className="mt-2 text-xs text-stone-500">
                          Created {new Date(post.createdAt).toLocaleString()}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          Updated {new Date(post.updatedAt).toLocaleString()}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" className={actionButtonClass} onClick={() => beginEditPost(post)}>
                            Edit post
                          </button>
                          {post.status === 'published' && (
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className={actionButtonClass}
                            >
                              View public post
                            </a>
                          )}
                          {post.status === 'published' && (
                            <button
                              type="button"
                              className={actionButtonClass}
                              onClick={() => copyPublicLink(post.slug)}
                            >
                              Copy public link
                            </button>
                          )}
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => deletePost(post)}
                            disabled={deletingPostId === post.id}
                          >
                            {deletingPostId === post.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                );
              })}
              {!blogPosts.length && <p className="text-sm text-stone-600">No blog posts yet.</p>}
            </div>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
}
