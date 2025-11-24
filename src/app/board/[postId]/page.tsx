import { notFound } from 'next/navigation';
import { BoardPostView } from '@/components/features/board-post/BoardPostView';
import { CommentSection } from '@/components/features/board-post/comment/CommentSection';
import { createServerSupabase } from '@/lib/supabase/server';

type BoardDetailPageProps = {
  params: Promise<{ postId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const DEFAULT_COMPANY_BOARD = '공지사항';
const DEFAULT_DEPT = 'IT부';

export default async function BoardPostPage({
  params,
  searchParams,
}: BoardDetailPageProps) {
  const { postId } = await params;
  const query = (await searchParams) ?? {};

  const scope =
    typeof query.scope === 'string' && query.scope === 'department'
      ? 'department'
      : 'company';
  const board = typeof query.board === 'string' ? query.board : undefined;
  const dept = typeof query.dept === 'string' ? query.dept : undefined;

  const listHref =
    scope === 'company'
      ? `/board?scope=company&board=${encodeURIComponent(
          board ?? DEFAULT_COMPANY_BOARD
        )}`
      : `/board?scope=department&dept=${encodeURIComponent(dept ?? DEFAULT_DEPT)}`;

  const supabase = await createServerSupabase();
  const { data: post, error } = await supabase
    .from('board_posts')
    .select(
      'id, scope, board, dept, topic, title, content, hashtags, author_name, created_at'
    )
    .eq('id', postId)
    .maybeSingle();

  if (error || !post) {
    console.error('[BoardPostPage] post fetch failed', error);
    notFound();
  }

  const postForView = {
    id: post.id,
    topic: post.topic ?? '정보',
    title: post.title,
    commentCount:
      ((post as Record<string, unknown>)['comment_count'] as
        | number
        | undefined) ?? 0,
    userName: post.author_name ?? '익명',
    viewCount:
      ((post as Record<string, unknown>)['view_count'] as number | undefined) ??
      0,
    dateCreated: post.created_at,
    content: post.content,
    hashtags: post.hashtags ?? [],
    boardLabel:
      post.scope === 'company'
        ? (post.board ?? '전사게시판')
        : (post.dept ?? '부서게시판'),
  };

  return (
    <main className="col-span-2 max-w-[1440px]">
      <BoardPostView post={postForView} listHref={listHref} />
      <CommentSection postId={postId} commentCount={postForView.commentCount} />
    </main>
  );
}
