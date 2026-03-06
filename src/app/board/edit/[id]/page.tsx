import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import BoardEditForm from '@/components/features/board/edit/BoardEditForm';

interface PageProps {
  params: { id: string };
  searchParams: {
    scope?: string;
    board?: string;
    dept?: string;
  };
}

export default async function BoardEditPage({
  params,
  searchParams,
}: PageProps) {
  const supabase = await createServerSupabase();
  const { id } = await params;
  const query = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: post, error } = await supabase
    .from('board_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !post) notFound();

  // 서버에서 권한 체크 — 작성자 본인만 접근 가능
  if (post.author_id !== user.id) redirect(`/board/${params.id}`);

  const scope = query.scope ?? post.scope;
  const board = query.board ?? post.board ?? '';
  const dept = query.dept ?? post.dept ?? '';

  return <BoardEditForm post={post} scope={scope} board={board} dept={dept} />;
}
