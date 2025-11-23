import { BoardPostView } from '@/components/features/board-post/BoardPostView';
import { CommentSection } from '@/components/features/board-post/comment/CommentSection';

export default async function BoardPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  // api getPost

  return (
    <main className="col-span-2 max-w-[1440px]">
      <BoardPostView postId={postId} />
      <CommentSection postId={postId} commentCount={11} />
    </main>
  );
}
