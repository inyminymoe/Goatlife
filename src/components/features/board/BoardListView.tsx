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

type BoardListItem = {
  id: number;
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

const COMPANY_BOARDS = [
  '공지사항',
  '성과보고',
  '체력단련실',
  '브레인연료',
  '사내신문고',
] as const;

/**
 * 확장 포인트 ①: scope별 토픽 집합
 *  - 전사/부서 스코프에 따라 노출되는 토픽 버튼을 다르게 구성할 수 있음
 *  - 필요시 값만 바꿔도 UI에 바로 반영
 */
const COMPANY_TOPICS = ['공지', '정보', '질문', '잡담', '모집'] as const;
const DEPARTMENT_TOPICS = ['공지', '정보', '질문', '모집', '잡담'] as const;

const mockList: Omit<BoardListItem, 'board'>[] = [
  {
    id: 1,
    topic: '공지',
    title: '03/31 공지사항입니다.',
    commentCount: 3,
    userName: 'CTO 갓햄',
    viewCount: 10000,
    dateCreated: '2025.03.31',
  },
  {
    id: 2,
    topic: '모집',
    title: '프론트엔드팀 팀원 모집',
    commentCount: 2,
    userName: 'COO 갓냥',
    viewCount: 15,
    dateCreated: '2025.03.31',
  },
  {
    id: 3,
    topic: '정보',
    title: '8월 오프라인 세미나 일정',
    commentCount: 12,
    userName: 'COO 갓냥',
    viewCount: 22,
    dateCreated: '2025.03.31',
  },
  {
    id: 4,
    topic: '잡담',
    title: '이건 무슨 벌레인가요?',
    commentCount: 5,
    userName: 'COO 갓냥',
    viewCount: 0,
    dateCreated: '2025.03.31',
  },
  {
    id: 5,
    topic: '질문',
    title: 'React 18 마이그레이션 질문',
    commentCount: 8,
    userName: 'CTO 갓햄',
    viewCount: 45,
    dateCreated: '2025.03.30',
  },
  {
    id: 6,
    topic: '정보',
    title: '신규 프로젝트 킥오프 미팅',
    commentCount: 15,
    userName: 'CEO 갓끼',
    viewCount: 89,
    dateCreated: '2025.03.30',
  },
  {
    id: 7,
    topic: '모집',
    title: '백엔드 개발자 모집합니다',
    commentCount: 7,
    userName: 'CTO 갓햄',
    viewCount: 123,
    dateCreated: '2025.03.29',
  },
  {
    id: 8,
    topic: '잡담',
    title: '점심 메뉴 추천해주세요',
    commentCount: 20,
    userName: '백 팀장',
    viewCount: 156,
    dateCreated: '2025.03.29',
  },
  {
    id: 9,
    topic: '공지',
    title: '4월 정기 회식 공지',
    commentCount: 5,
    userName: 'CEO 갓끼',
    viewCount: 234,
    dateCreated: '2025.03.28',
  },
  {
    id: 10,
    topic: '질문',
    title: 'TypeScript 타입 에러 해결 방법',
    commentCount: 11,
    userName: 'CTO 갓햄',
    viewCount: 78,
    dateCreated: '2025.03.28',
  },
  {
    id: 11,
    topic: '정보',
    title: '새로운 디자인 시스템 도입',
    commentCount: 9,
    userName: 'CTO 갓햄',
    viewCount: 98,
    dateCreated: '2025.03.27',
  },
  {
    id: 12,
    topic: '모집',
    title: 'UI/UX 디자이너 구합니다',
    commentCount: 4,
    userName: 'COO 갓냥',
    viewCount: 67,
    dateCreated: '2025.03.27',
  },
  {
    id: 13,
    topic: '잡담',
    title: '주말에 뭐하셨나요?',
    commentCount: 18,
    userName: '남궁 사원',
    viewCount: 145,
    dateCreated: '2025.03.26',
  },
  {
    id: 14,
    topic: '질문',
    title: 'Next.js 14 App Router 관련 질문',
    commentCount: 6,
    userName: '김 인턴',
    viewCount: 92,
    dateCreated: '2025.03.26',
  },
  {
    id: 15,
    topic: '공지',
    title: '보안 정책 업데이트 안내',
    commentCount: 2,
    userName: 'CTO 갓햄',
    viewCount: 189,
    dateCreated: '2025.03.25',
  },
  {
    id: 16,
    topic: '정보',
    title: '코드 리뷰 가이드라인',
    commentCount: 13,
    userName: 'CTO 갓햄',
    viewCount: 167,
    dateCreated: '2025.03.25',
  },
  {
    id: 17,
    topic: '모집',
    title: 'DevOps 엔지니어 채용',
    commentCount: 3,
    userName: 'COO 갓냥',
    viewCount: 54,
    dateCreated: '2025.03.24',
  },
  {
    id: 18,
    topic: '잡담',
    title: '추천하는 개발 도서 있나요?',
    commentCount: 22,
    userName: '강 인턴',
    viewCount: 198,
    dateCreated: '2025.03.24',
  },
  {
    id: 19,
    topic: '질문',
    title: 'Git 브랜치 전략 문의',
    commentCount: 8,
    userName: '이 주임',
    viewCount: 76,
    dateCreated: '2025.03.23',
  },
  {
    id: 20,
    topic: '정보',
    title: '5월 컨퍼런스 참가 안내',
    commentCount: 7,
    userName: 'COO 갓냥',
    viewCount: 134,
    dateCreated: '2025.03.23',
  },
  {
    id: 21,
    topic: '공지',
    title: '재택근무 정책 변경',
    commentCount: 16,
    userName: 'COO 갓냥',
    viewCount: 456,
    dateCreated: '2025.03.22',
  },
  {
    id: 22,
    topic: '모집',
    title: 'QA 엔지니어 모집',
    commentCount: 5,
    userName: 'CTO 갓햄',
    viewCount: 88,
    dateCreated: '2025.03.22',
  },
  {
    id: 23,
    topic: '잡담',
    title: '요즘 핫한 기술 스택',
    commentCount: 25,
    userName: 'CTO 갓햄',
    viewCount: 267,
    dateCreated: '2025.03.21',
  },
  {
    id: 24,
    topic: '질문',
    title: 'Docker 컨테이너 최적화 방법',
    commentCount: 10,
    userName: '이 주임',
    viewCount: 112,
    dateCreated: '2025.03.21',
  },
  {
    id: 25,
    topic: '정보',
    title: 'API 문서 작성 가이드',
    commentCount: 4,
    userName: 'CTO 갓햄',
    viewCount: 95,
    dateCreated: '2025.03.20',
  },
];

const allList: BoardListItem[] = mockList.map((item, index) => ({
  ...item,
  board: COMPANY_BOARDS[index % COMPANY_BOARDS.length],
}));

export default function BoardListView() {
  const [toggleView, setToggleView] = useState<'list' | 'grid'>('list');

  const searchParams = useSearchParams();
  const router = useRouter();
  const scope = searchParams.get('scope') ?? 'company'; // 'company' | 'department'
  const board = searchParams.get('board') ?? searchParams.get('tboard') ?? '';
  const dept = searchParams.get('dept') ?? '';

  const selectedTopics = searchParams.getAll('topic');
  const currentPage = Number(searchParams.get('page')) || 1;
  const keyword = searchParams.get('keyword') || '';

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
    // 확장 포인트 ②: scope/board/dept 기준으로 리스트 분기
    // - API 연동 시 여기에서 scope/board/dept를 서버 액션 인자로 전달하거나,
    //   이미 받아온 데이터에서 필터링하는 자리로 활용
    let result = allList;

    if (scope === 'company' && board) {
      result = result.filter((item: BoardListItem) => {
        // item.board가 없으면 그대로 통과시켜 mock 데이터도 쉽게 재사용 가능
        return !('board' in item) || item.board === board;
      });
    }

    if (scope === 'department' && dept) {
      result = result.filter((item: BoardListItem) => {
        // item.dept가 없으면 그대로 통과시켜 현재 목 데이터도 보이도록 함
        return !('dept' in item) || item.dept === dept;
      });
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
  }, [scope, board, dept, selectedTopics, keyword]);

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
              {currentList.map(item => (
                <BoardItem key={item.id} {...item} />
              ))}
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
