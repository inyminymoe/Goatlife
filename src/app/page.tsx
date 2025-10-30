/**
 * 홈 화면: 로그인 전/후 레이아웃 분기
 * - 게스트: 마케팅 배너(2칸) + 게시판1(공지) + 게시판2(커뮤니티) + 임원진 한마디 + Today 갓생이
 * - 회원: 근태관리, 사원정보, 게시판, 성과현황, 임원진 한마디, Today 갓생이
 */
'use client';
import { useState } from 'react';
import { useAtomValue } from 'jotai';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import TodoItem from '@/components/ui/TodoItem';
import Toast from '@/components/ui/Toast';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import TodoDrawer from '@/components/TodoDrawer';
import { userAtom } from '@/store/atoms';

// AttendanceCard를 동적으로 로드 (성능 최적화)
const AttendanceCard = dynamic(
  () => import('@/components/home/AttendanceCard'),
  {
    loading: () => (
      <section className="bg-grey-100 rounded-[5px] p-6 animate-pulse">
        <div className="flex items-end gap-1 mb-4">
          <div className="w-6 h-6 bg-grey-300 rounded"></div>
          <div className="h-6 w-24 bg-grey-300 rounded"></div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="h-20 bg-grey-200 rounded"></div>
          <div className="h-20 bg-grey-200 rounded"></div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="h-10 bg-grey-300 rounded"></div>
          <div className="h-10 bg-grey-300 rounded"></div>
        </div>
      </section>
    ),
    ssr: false, // 서버 사이드 렌더링 비활성화 (클라이언트에서만 로드)
  }
);

export default function Home() {
  const user = useAtomValue(userAtom);
  const isMember = Boolean(user);

  // 테스트용 Toast 상태
  const [toast3, setToast3] = useState(false);

  // 테스트용 Todo 상태
  const [todos, setTodos] = useState([
    { id: '1', text: '멋드러지게 숨쉬기', completed: false },
    { id: '2', text: '죽여주는 점심식사하기', completed: false },
    { id: '3', text: '끝내주게 산책하기', completed: false },
    { id: '4', text: '고양이 밥주기', completed: false },
  ]);

  // Drawer 상태
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<{
    id: string;
    text: string;
    completed: boolean;
  } | null>(null);

  const handleToggle = (id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleSettings = (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (todo) {
      setSelectedTodo(todo);
      setDrawerOpen(true);
    }
  };

  return (
    <>
      {/* Toasts */}
      <Toast
        show={toast3}
        message="내 글에 새 댓글이 달렸어요"
        type="info"
        action={{
          label: '보러가기',
          onClick: () => {
            alert('게시글로 이동!');
            setToast3(false);
          },
        }}
        onClose={() => setToast3(false)}
      />

      {isMember ? (
        /* ===================== 회원 레이아웃 ===================== */
        <>
          {/* 근태관리 */}
          <AttendanceCard />

          {/* 사원정보 */}
          <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[207px]">
            <div className="flex items-center gap-1 mb-4">
              <Icon
                icon="icon-park:necktie"
                className="w-6 h-6 text-primary-500"
              />
              <h2 className="brand-h3 text-grey-900">사원정보</h2>
            </div>
            <p className="body-base text-grey-700">프로필 요약</p>
          </section>

          {/* 게시판 */}
          <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
            <div className="flex items-center gap-1 mb-4">
              <Icon
                icon="icon-park:message-emoji"
                className="w-6 h-6 text-primary-500"
              />
              <h2 className="brand-h3 text-grey-900">게시판</h2>
            </div>
            <p className="body-base text-grey-700">최신 글</p>
          </section>

          {/* 성과 현황 */}
          <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
            <div className="flex items-center gap-1 mb-4">
              <Icon
                icon="icon-park:pie-seven"
                className="w-6 h-6 text-primary-500"
              />
              <h2 className="brand-h3 text-grey-900">성과 현황</h2>
            </div>
            <div className="flex flex-col gap-3">
              {todos.map(todo => (
                <TodoItem
                  key={todo.id}
                  id={todo.id}
                  text={todo.text}
                  completed={todo.completed}
                  onToggle={handleToggle}
                  onSettings={handleSettings}
                />
              ))}
            </div>
          </section>
        </>
      ) : (
        /* ===================== 게스트 레이아웃 ===================== */
        <>
          {/* 마케팅 배너 (2칸) */}
          <section className="md:col-span-2 gl-bg-banner rounded-[5px] p-8 md:p-12 md:min-h-[176px] relative overflow-hidden">
            <div className="relative z-10 max-w-xl">
              <h2 className="brand-h2 text-grey-900 mb-4 leading-loose">
                나의 업무 유형 테스트하고
                <br />
                갓생상사 입사지원 하러가기
              </h2>
              <Button
                variant="primary"
                onClick={() =>
                  alert('심리테스트 페이지 준비 중! 아이 이거 언제하냐..')
                }
                size="md"
              >
                지금.당장.롸잇나우.검사GO🍀
              </Button>
            </div>

            {/* 말풍선 (Desktop only) */}
            <div className="hidden lg:flex absolute right-8 top-1/2 -translate-y-1/2">
              <Image
                src="/images/speechBubble.svg"
                alt="말풍선"
                width={263}
                height={137}
                className="w-64 h-auto"
              />
            </div>
          </section>

          {/* 게시판1 - 공지사항 */}
          <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
            <div className="flex items-center gap-1 mb-4">
              <Icon
                icon="icon-park:message-emoji"
                className="w-6 h-6 text-primary-500"
              />
              <h2 className="brand-h3 text-grey-900">공지사항</h2>
            </div>
            <p className="body-base text-grey-700">최신 공지사항 불러오기...</p>
          </section>

          {/* 게시판2 - 커뮤니티 */}
          <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px]">
            <div className="flex items-center gap-1 mb-4">
              <Icon
                icon="icon-park:message-emoji"
                className="w-6 h-6 text-primary-500"
              />
              <h2 className="brand-h3 text-grey-900">커뮤니티</h2>
            </div>
            <p className="body-base text-grey-700">
              전사게시판 최신글 불러오기...
            </p>
          </section>
        </>
      )}

      {/* ===================== 공통 섹션 ===================== */}
      {/* 임원진 한마디 */}
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[210px]">
        <div className="flex items-center gap-1 mb-4">
          <Icon
            icon="icon-park:relieved-face"
            className="w-6 h-6 text-primary-500"
          />
          <h2 className="brand-h3 text-grey-900">임원진 한마디</h2>
        </div>
        <p className="body-base text-grey-700">
          &quot;일찍 일어나는 벌레는 오운완해서 잽싸게 도망간다.&quot;
        </p>
      </section>

      {/* Today 갓생이 */}
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[210px]">
        <div className="flex items-center gap-1 mb-4">
          <Icon icon="icon-park:trophy" className="w-6 h-6 text-primary-500" />
          <h2 className="brand-h3 text-grey-900">Today 갓생이</h2>
        </div>
        <p className="body-base text-grey-700">1호 갓생이가 되어주세요🐹</p>
      </section>
      {isMember && (
        <TodoDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          todo={selectedTodo}
        />
      )}
    </>
  );
}
