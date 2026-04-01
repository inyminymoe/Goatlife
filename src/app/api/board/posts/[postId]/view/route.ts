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

  const { error } = await supabase.rpc('increment_post_view_count', {
    post_id: postId,
  });

  if (error) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
