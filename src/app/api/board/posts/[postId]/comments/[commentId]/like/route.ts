import { createServerSupabase } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/validate';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ postId: string; commentId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { postId, commentId } = await params;

  if (!isValidUuid(postId) || !isValidUuid(commentId))
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('board_post_comment_likes')
    .insert({ comment_id: commentId, user_id: user.id });

  if (error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { postId, commentId } = await params;

  if (!isValidUuid(postId) || !isValidUuid(commentId))
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('board_post_comment_likes')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', user.id);

  if (error)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
