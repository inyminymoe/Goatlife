import { notFound, redirect } from 'next/navigation';
import { BoardPostView } from '@/components/features/board-post/BoardPostView';
import { CommentSection } from '@/components/features/board-post/comment/CommentSection';
import { buildLoginRedirectHref } from '@/lib/boardAccess';
import { createServerSupabase } from '@/lib/supabase/server';
import { PostForView } from '@/types/board';

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
  const detailSearchParams = new URLSearchParams({ scope });

  if (scope === 'company' && board) {
    detailSearchParams.set('board', board);
  }

  if (scope === 'department' && dept) {
    detailSearchParams.set('dept', dept);
  }

  const detailHref = `/board/${postId}?${detailSearchParams.toString()}`;

  const listHref =
    scope === 'company'
      ? `/board?scope=company&board=${encodeURIComponent(
          board ?? DEFAULT_COMPANY_BOARD
        )}`
      : `/board?scope=department&dept=${encodeURIComponent(dept ?? DEFAULT_DEPT)}`;

  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildLoginRedirectHref(detailHref));
  }

  const baseQuery = supabase
    .from('board_posts')
    .select(
      `
    *,
    board_post_likes(user_id),
    board_post_bookmarks(user_id)
  `
    )
    .eq('id', postId);

  if (user) {
    baseQuery
      .eq('board_post_likes.user_id', user.id)
      .eq('board_post_bookmarks.user_id', user.id);
  }

  const { data: post, error } = await baseQuery.maybeSingle();

  if (error || !post) {
    console.error('[BoardPostPage] post fetch failed', error);
    notFound();
  }

  const isAuthor = !!user && user.id === post.author_id;

  const postForView: PostForView = {
    id: post.id,
    scope: post.scope,
    board: post.board ?? undefined,
    dept: post.dept ?? undefined,
    topic: post.topic ?? '정보',
    title: post.title,
    content: post.content,
    hashtags: post.hashtags ?? [],
    author_id: post.author_id,
    userName: post.author_name ?? '익명',
    viewCount: post.view_count ?? 0,
    commentCount: post.comment_count ?? 0,
    dateCreated: post.created_at,
    dateUpdated: post.updated_at,
    boardLabel:
      post.scope === 'company'
        ? (post.board ?? '전사게시판')
        : (post.dept ?? '부서게시판'),
    likeCount: post.like_count ?? 0,
    isLiked: (post.board_post_likes ?? []).length > 0,
    isBookmarked: (post.board_post_bookmarks ?? []).length > 0,
  };

  return (
    <main className="col-span-2 max-w-[1440px]">
      <BoardPostView
        post={postForView}
        listHref={listHref}
        isAuthor={isAuthor}
      />
      <CommentSection
        postId={postId}
        postAuthorId={post.author_id}
        commentCount={postForView.commentCount}
      />
    </main>
  );
}
