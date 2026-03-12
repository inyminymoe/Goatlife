import { createServerSupabase } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/validate';
import { NextResponse } from 'next/server';

const COMMENTS_PER_PAGE = 10;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  if (!isValidUuid(postId))
    return NextResponse.json({ error: 'Invalid postId' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get('page')) || 1;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('board_post_comments')
    .select('*')
    .eq('post_id', postId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: true })
    .range((page - 1) * COMMENTS_PER_PAGE, page * COMMENTS_PER_PAGE - 1);

  if (error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });

  return NextResponse.json(data);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  if (!isValidUuid(postId)) {
    return NextResponse.json({ error: 'Invalid postId' }, { status: 400 });
  }

  const body = await req.json();
  const content = body?.content?.trim();
  if (!content)
    return NextResponse.json({ error: 'content is required' }, { status: 400 });

  const imageUrls = Array.isArray(body?.image_urls) ? body.image_urls : [];

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const metadata = user.user_metadata ?? {};
  const { error } = await supabase.from('board_post_comments').insert({
    post_id: postId,
    user_id: user.id,
    author_name: metadata.firstName + metadata.lastName,
    content,
    image_urls: imageUrls,
  });

  if (error) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
