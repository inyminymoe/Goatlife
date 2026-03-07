import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import BoardPostForm from '@/components/features/board/post/BoardPostForm';
import { getTagsByScope, resolveScope } from '@/constants/board';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ scope?: string; board?: string; dept?: string }>;
}

export default async function BoardEditPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createServerSupabase();

  const [
    {
      data: { user },
    },
    { data: post, error },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('board_posts').select('*').eq('id', id).single(),
  ]);

  if (!user) redirect('/login');
  if (error || !post) notFound();
  if (post.author_id !== user.id) redirect(`/board/${id}`);

  const scope = resolveScope(query.scope, post.scope);
  const board = query.board ?? post.board ?? '';
  const dept = query.dept ?? post.dept ?? '';
  const availableTopics = getTagsByScope(scope);

  return (
    <BoardPostForm
      mode="edit"
      post={post}
      scope={scope}
      board={board}
      dept={dept}
      availableTopics={availableTopics}
    />
  );
}
