import { createServerSupabase } from '@/lib/supabase/server';
import { isValidUuid } from '@/lib/validate';
import { NextResponse } from 'next/server';

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;

  if (!isValidUuid(postId)) {
    return NextResponse.json({ error: 'Invalid postId' }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('board_post_likes')
    .insert({ post_id: postId, user_id: user.id });

  if (error) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;

  if (!isValidUuid(postId)) {
    return NextResponse.json({ error: 'Invalid postId' }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('board_post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
