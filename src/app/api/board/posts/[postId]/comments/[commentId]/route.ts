import { createServerSupabase } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/validate';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ postId: string; commentId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { postId, commentId } = await params;

  if (!isValidUuid(postId) || !isValidUuid(commentId))
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();

  // 고정/해제 (게시글 작성자만)
  if ('is_pinned' in body) {
    const { data: postData } = await supabase
      .from('board_posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (!postData) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    if (postData.author_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('board_post_comments')
      .update({ is_pinned: body.is_pinned })
      .eq('id', commentId)
      .eq('post_id', postId)
      .select('id');

    if (error) {
      return NextResponse.json({ error: 'Request failed' }, { status: 500 });
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  }

  // 내용 수정 (댓글 작성자만)
  const content = body?.content?.trim();
  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('board_post_comments')
    .select('user_id')
    .eq('id', commentId)
    .eq('post_id', postId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('board_post_comments')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', commentId);

  if (error) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { postId, commentId } = await params;

  if (!isValidUuid(postId) || !isValidUuid(commentId)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from('board_post_comments')
    .select('user_id')
    .eq('id', commentId)
    .eq('post_id', postId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabase
    .from('board_post_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
