import BoardItem from '@/components/features/board/BoardItem';

interface RelatedPost {
  id: string;
  topic: string | null;
  title: string;
  comment_count: number | null;
  author_name: string | null;
  view_count: number | null;
  created_at: string;
}

interface RelatedPostsProps {
  posts: RelatedPost[];
  scope: string;
  board?: string;
  dept?: string;
}

export default function RelatedPosts({
  posts,
  scope,
  board,
  dept,
}: RelatedPostsProps) {
  if (posts.length === 0) return null;

  function buildHref(postId: string) {
    const params = new URLSearchParams({ scope });
    if (scope === 'company' && board) params.set('board', board);
    if (scope === 'department' && dept) params.set('dept', dept);
    return `/board/${postId}?${params.toString()}`;
  }

  return (
    <section className="mt-6 px-4 pb-10">
      <h2 className="text-sm font-semibold text-grey-500 mb-1">
        같은 게시판 최근 글
      </h2>
      <div>
        {posts.map(post => (
          <BoardItem
            key={post.id}
            id={post.id}
            topic={post.topic ?? '정보'}
            title={post.title}
            commentCount={post.comment_count ?? 0}
            userName={post.author_name ?? '익명'}
            viewCount={post.view_count ?? 0}
            dateCreated={post.created_at}
            href={buildHref(post.id)}
          />
        ))}
      </div>
    </section>
  );
}
