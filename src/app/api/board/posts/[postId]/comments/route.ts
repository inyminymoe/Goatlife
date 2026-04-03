import { parseJsonBody } from '@/lib/parseJsonBody';
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
  const parentId = searchParams.get('parent_id');

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 답글 더보기 버튼 클릭 시
  if (parentId) {
    if (!isValidUuid(parentId))
      return NextResponse.json({ error: 'Invalid parentId' }, { status: 400 });

    const { data, error } = await supabase
      .from('board_post_comments')
      .select('*, board_post_comment_likes(user_id)')
      .eq('post_id', postId)
      .eq('parent_id', parentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error)
      return NextResponse.json({ error: 'Request failed' }, { status: 500 });

    const result = data.map(c => {
      const likes: { user_id: string }[] = c.board_post_comment_likes ?? [];
      return {
        ...c,
        like_count: likes.length,
        is_liked: user ? likes.some(l => l.user_id === user.id) : false,
        board_post_comment_likes: undefined,
      };
    });

    return NextResponse.json(result);
  }

  // 루트 댓글 fetch — 뷰에서 조회 (like_count 포함)
  const { data, error, count } = await supabase
    .from('board_post_comments_with_reply_count')
    .select('*, board_post_comment_likes(user_id)', { count: 'exact' })
    .eq('post_id', postId)
    .is('parent_id', null)
    .is('deleted_at', null)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: true })
    .range((page - 1) * COMMENTS_PER_PAGE, page * COMMENTS_PER_PAGE - 1);

  if (error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });

  const result = data.map(c => {
    const likes: { user_id: string }[] = c.board_post_comment_likes ?? [];
    return {
      ...c,
      like_count: likes.length,
      is_liked: user ? likes.some(l => l.user_id === user.id) : false,
      board_post_comment_likes: undefined,
    };
  });

  return NextResponse.json({ data: result, total: count ?? 0 });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  if (!isValidUuid(postId)) {
    return NextResponse.json({ error: 'Invalid postId' }, { status: 400 });
  }

  const { data: body, error: parseError } = await parseJsonBody<{
    content?: string;
    parent_id?: string;
    reply_to_name?: string;
  }>(req);

  if (parseError) {
    return parseError;
  }

  const parentId = body?.parent_id ?? null;
  const content = body?.content?.trim();

  if (!content)
    return NextResponse.json({ error: 'content is required' }, { status: 400 });

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let resolvedParentId = parentId;
  if (parentId) {
    const { data: parentComment } = await supabase
      .from('board_post_comments')
      .select('id, parent_id')
      .eq('id', parentId)
      .single();

    // 답글의 답글이면 → 원댓글의 parent_id로 올려줌 (2depth 고정)
    resolvedParentId = parentComment?.parent_id ?? parentId;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('last_name, rank')
    .eq('id', user.id)
    .maybeSingle();

  const metadata = user.user_metadata ?? {};
  const lastName =
    profile?.last_name?.trim() ||
    (metadata['last_name'] as string | undefined)?.trim() ||
    (metadata['profile_nickname'] as string | undefined)?.trim() ||
    (metadata['nickname'] as string | undefined)?.trim() ||
    (metadata['name'] as string | undefined)?.trim() ||
    (metadata['full_name'] as string | undefined)?.trim() ||
    user.email?.split('@')[0];
  const rank = profile?.rank?.trim();
  const authorName =
    lastName && rank ? `${lastName} ${rank}` : lastName || rank || '익명';

  const { error } = await supabase.from('board_post_comments').insert({
    post_id: postId,
    user_id: user.id,
    author_name: authorName,
    content,
    parent_id: resolvedParentId,
    reply_to_name: body?.reply_to_name ?? null,
  });

  if (error) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
