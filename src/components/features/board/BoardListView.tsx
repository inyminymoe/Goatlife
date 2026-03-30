'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * NOTE: API 연동 가이드
 * - 전사/부서에 따라 서로 다른 API를 호출해야 한다면
 *   1) 서버 컴포넌트(page.tsx)에서 scope/dept를 읽고 서버 액션으로 데이터를 가져와 props로 넘기거나,
 *   2) 여기 클라이언트에서 scope/dept를 읽어 useEffect로 호출
 * - 예시:
 *   if (scope === 'company') fetchCompanyPosts({ tags, keyword, page })
 *   else fetchDepartmentPosts({ dept, tags, keyword, page })
 */

import Pagination from '@/components/ui/Pagination';
import SearchBar from '@/components/ui/SearchBar';
import BoardFilterTopics from './BoardFilterTopics';
import BoardHeader from './BoardHeader';
import BoardItem from './BoardItem';

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
};

type BoardListItem = {
  id: string;
  topic: string;
  title: string;
  commentCount: number;
  userName: string;
  viewCount: number;
  dateCreated: string;
  dept?: string;
  board?: string;
};

const ITEMS_PER_PAGE = 15;

/**
 * 확장 포인트 ①: scope별 토픽 집합
 *  - 전사/부서 스코프에 따라 노출되는 토픽 버튼을 다르게 구성할 수 있음
 *  - 필요시 값만 바꿔도 UI에 바로 반영
 */
const COMPANY_TOPICS = ['공지', '정보', '질문', '잡담', '모집'] as const;
const DEPARTMENT_TOPICS = ['공지', '정보', '질문', '모집', '잡담'] as const;

function formatDate(dateIso: string) {
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return dateIso;
  const yyyy = d.getFullYear();
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

export default function BoardListView({ livePosts = [] }: BoardListViewProps) {
  const [toggleView, setToggleView] = useState<'list' | 'grid'>('list');

  const searchParams = useSearchParams();
  const router = useRouter();
  const scope = searchParams.get('scope') ?? 'company'; // 'company' | 'department'
  const board = searchParams.get('board') ?? searchParams.get('tboard') ?? '';
  const dept = searchParams.get('dept') ?? '';

  const selectedTopics = searchParams.getAll('topic');
  const currentPage = Number(searchParams.get('page')) || 1;
  const keyword = searchParams.get('keyword') || '';

  const supabaseList: BoardListItem[] = useMemo(
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

  const allList = supabaseList;

  // scope에 따라 노출할 토픽 집합을 분기
  const availableTopics = useMemo(() => {
    return scope === 'company' ? [...COMPANY_TOPICS] : [...DEPARTMENT_TOPICS];
  }, [scope]);

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
    if (scope === 'company' && board) {
      params.set('board', board);
    }
    if (scope === 'department' && dept) {
      params.set('dept', dept);
    }
    router.push(`/board/new?${params.toString()}`);
  };

  const filteredList = useMemo(() => {
    let result = allList;

    if (scope === 'company' && board) {
      result = result.filter(item => item.board === board);
    }

    if (scope === 'department' && dept) {
      result = result.filter(item => item.dept === dept);
    }

    // 토픽 필터
    if (selectedTopics.length > 0) {
      result = result.filter(item => selectedTopics.includes(item.topic));
    }

    // 검색어 필터 (제목 기준)
    if (keyword.trim()) {
      const q = keyword.toLowerCase();
      result = result.filter(item => item.title.toLowerCase().includes(q));
    }

    return result;
  }, [scope, board, dept, selectedTopics, keyword, allList]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentList = filteredList.slice(startIndex, endIndex);

  const heading = useMemo(() => {
    if (scope === 'company') {
      return board || '전사게시판';
    }

    return dept || '부서게시판';
  }, [scope, board, dept]);

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
          {currentList.length === 0 ? (
            <p>등록된 게시글이 없습니다.</p>
          ) : (
            <>
              {currentList.map(item => {
                const params = new URLSearchParams();
                params.set('scope', scope);
                if (scope === 'company' && board) {
                  params.set('board', board);
                }
                if (scope === 'department' && dept) {
                  params.set('dept', dept);
                }

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
