import { NextResponse } from 'next/server';
import { authorizeStaffMenuRequest, getStaffMenuSupabase } from '../../menu/_lib';

const BUCKET_NAME = 'blog-images';

const sanitizeFileName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

export async function POST(request: Request) {
  const unauthorized = await authorizeStaffMenuRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Image file is required.' }, { status: 400 });
    }
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are supported.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const fileExt = file.name.includes('.') ? file.name.split('.').pop() ?? 'jpg' : 'jpg';
    const safeExt = sanitizeFileName(fileExt || 'jpg') || 'jpg';
    const baseName = sanitizeFileName(file.name.replace(/\.[^.]+$/, '')) || 'upload';
    const objectPath = `${new Date().toISOString().slice(0, 10)}/${Date.now()}-${baseName}.${safeExt}`;

    const supabase = getStaffMenuSupabase();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(objectPath, bytes, { contentType: file.type, upsert: false });

    if (uploadError) {
      const message = uploadError.message?.toLowerCase() ?? '';
      const bucketMissing = message.includes('bucket') && message.includes('not found');
      if (bucketMissing) {
        return NextResponse.json(
          {
            error:
              'Storage bucket "blog-images" is missing. Follow supabase/storage-blog-images-setup.sql before uploading images.',
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: 'Could not upload blog image.' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(objectPath);
    return NextResponse.json({
      featuredImageUrl: publicUrlData.publicUrl,
      objectPath,
    });
  } catch {
    return NextResponse.json({ error: 'Could not upload blog image.' }, { status: 500 });
  }
}

