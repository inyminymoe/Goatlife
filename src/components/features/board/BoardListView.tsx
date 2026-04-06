'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Pagination from '@/components/ui/Pagination';
import SearchBar from '@/components/ui/SearchBar';
import BoardFilterTopics from './BoardFilterTopics';
import BoardHeader from './BoardHeader';
import BoardItem from './BoardItem';
import { formatDate } from '@/lib/dateUtils';

type BoardListViewProps = {
  livePosts?: {
    id: string;
    topic: string | null;
    title: string;
    comment_count?: number | null;
    author_name: string | null;
    view_count?: number | null;
    created_at: string;
    board?: string | null;
    dept?: string | null;
  }[];
  total?: number;
};

const ITEMS_PER_PAGE = 15;

const COMPANY_TOPICS = ['공지', '정보', '질문', '잡담', '모집'] as const;
const DEPARTMENT_TOPICS = ['공지', '정보', '질문', '모집', '잡담'] as const;

export default function BoardListView({
  livePosts = [],
  total = 0,
}: BoardListViewProps) {
  const [toggleView, setToggleView] = useState<'list' | 'grid'>('list');

  const searchParams = useSearchParams();
  const router = useRouter();
  const scope = searchParams.get('scope') ?? 'company';
  const board = searchParams.get('board') ?? searchParams.get('tboard') ?? '';
  const dept = searchParams.get('dept') ?? '';
  const selectedTopics = searchParams.getAll('topic');
  const currentPage = Number(searchParams.get('page')) || 1;

  const posts = useMemo(
    () =>
      livePosts.map(post => ({
        id: post.id,
        topic: post.topic ?? '공지',
        title: post.title,
        commentCount: post.comment_count ?? 0,
        userName: post.author_name ?? '익명 갓생',
        viewCount: post.view_count ?? 0,
        dateCreated: formatDate(post.created_at),
        board: post.board ?? undefined,
        dept: post.dept ?? undefined,
      })),
    [livePosts]
  );

  const availableTopics =
    scope === 'company' ? [...COMPANY_TOPICS] : [...DEPARTMENT_TOPICS];

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const heading =
    scope === 'company' ? board || '전사게시판' : dept || '부서게시판';

  const handleTopicClick = (topic: string) => {
    const params = new URLSearchParams(searchParams);

    if (selectedTopics.includes(topic)) {
      params.delete('topic');
      selectedTopics
        .filter(t => t !== topic)
        .forEach(t => params.append('topic', t));
    } else {
      params.append('topic', topic);
    }

    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  const handleSearch = (searchKeyword: string) => {
    const params = new URLSearchParams(searchParams);

    if (searchKeyword.trim()) {
      params.set('keyword', searchKeyword.trim());
    } else {
      params.delete('keyword');
    }

    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleViewChange = () => {
    setToggleView(prev => (prev === 'list' ? 'grid' : 'list'));
  };

  const handleCreate = () => {
    const params = new URLSearchParams();
    params.set('scope', scope);
    if (scope === 'company' && board) params.set('board', board);
    if (scope === 'department' && dept) params.set('dept', dept);
    router.push(`/board/new?${params.toString()}`);
  };

  return (
    <>
      <h2 className="brand-h3 text-grey-900 mb-4">{heading}</h2>

      <div className="flex flex-col">
        <div className="mb-4 flex items-center flex-wrap gap-3">
          <BoardFilterTopics
            topics={availableTopics}
            selectedTopics={selectedTopics}
            onTopicClick={handleTopicClick}
          />
          <div className="ml-auto">
            <BoardHeader
              toggleView={toggleView}
              onViewChange={handleViewChange}
              onCreate={handleCreate}
            />
          </div>
        </div>

        <div className="mb-8 grow-1">
          {posts.length === 0 ? (
            <p>등록된 게시글이 없습니다.</p>
          ) : (
            <>
              {posts.map(item => {
                const params = new URLSearchParams();
                params.set('scope', scope);
                if (scope === 'company' && board) params.set('board', board);
                if (scope === 'department' && dept) params.set('dept', dept);

                const query = params.toString();
                const detailHref = query
                  ? `/board/${item.id}?${query}`
                  : `/board/${item.id}`;

                return <BoardItem key={item.id} {...item} href={detailHref} />;
              })}
            </>
          )}
        </div>

        <div className="mb-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>

        <SearchBar label="제목+내용" onSearch={handleSearch} />
      </div>
    </>
  );
}
