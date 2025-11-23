'use client';
import { Hashtags } from './Hashtags';
import { PostActionBar } from './PostActionBar';
import PostCardHeader from './PostCardHeader';
import { PostContent } from './PostContent';

const item = {
  id: 25,
  label: '정보',
  title: 'API 문서 작성 가이드',
  commentCount: 4,
  userName: 'CTO 갓햄',
  viewCount: 95,
  dateCreated: '2025.03.20',
  content: `
    <p>안녕하세요</p>
    <p>프론트엔드 팀원 모집합니다.</p>`,
  tags: ['모각코', '리액트', '프로젝트'],
  likes: 13,
};

export function PostCard() {
  return (
    <>
      <PostCardHeader {...item} />
      <PostContent content={item.content} />
      <Hashtags tags={item.tags} />
      <PostActionBar likes={item.likes} />
    </>
  );
}
