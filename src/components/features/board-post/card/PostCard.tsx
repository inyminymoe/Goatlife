'use client';
import { Hashtags } from './Hashtags';
import { PostActionBar } from './PostActionBar';
import PostCardHeader from './PostCardHeader';
import { PostContent } from './PostContent';

type PostCardProps = {
  post: {
    id: string;
    topic: string;
    title: string;
    commentCount: number;
    userName: string;
    viewCount: number;
    dateCreated: string;
    content: string;
    hashtags: string[];
  };
};

export function PostCard({ post }: PostCardProps) {
  return (
    <>
      <PostCardHeader {...post} />
      <PostContent content={post.content} />
      <Hashtags hashtags={post.hashtags} />
      <PostActionBar likes={0} />
    </>
  );
}
