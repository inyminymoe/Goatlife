import { PostForView } from '@/types/board';
import { Hashtags } from './Hashtags';
import { PostActionBar } from './PostActionBar';
import PostCardHeader from './PostCardHeader';
import { PostContent } from './PostContent';

type PostCardProps = {
  post: PostForView;
  isAuthor: boolean;
  isAdmin: boolean;
};

export function PostCard({ post, isAuthor, isAdmin }: PostCardProps) {
  return (
    <>
      <PostCardHeader {...post} isAuthor={isAuthor} isAdmin={isAdmin} />
      <PostContent content={post.content} />
      <Hashtags hashtags={post.hashtags} />
      <PostActionBar
        postId={post.id}
        initialLikes={post.likeCount}
        initialIsLiked={post.isLiked}
        initialIsBookmarked={post.isBookmarked}
      />
    </>
  );
}
