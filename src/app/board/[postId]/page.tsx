import { BoardPostView } from '@/components/features/board-post/BoardPostView';

export default async function BoardPostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;

  return (
    <main className="bg-grey-100 rounded-[5px] px-[25px] py-5 mb-5 col-span-2 max-w-[1440px]">
      <BoardPostView postId={postId} />
    </main>
  );
}
