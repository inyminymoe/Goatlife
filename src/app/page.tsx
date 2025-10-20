/**
 * 홈 화면: 로그인 전/후 레이아웃 분기
 * - 게스트: 마케팅 배너(2칸) + 게시판1(공지) + 게시판2(커뮤니티) + 임원진 한마디 + Today 갓생이
 * - 회원: 근태관리, 사원정보, 게시판, 성과현황, 임원진 한마디, Today 갓생이
 */
'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import TodoItem from '@/components/ui/TodoItem';
import Toast from '@/components/ui/Toast';
import Image from 'next/image';
import { Icon } from '@iconify/react';

export default function Home() {
  // TODO: 실제 supabase/auth 상태와 연동
  const [isMember] = useState(false);

  // 데모용 상태
  const [toast1, setToast1] = useState(false);
  const [toast2, setToast2] = useState(false);
  const [toast3, setToast3] = useState(false);

  const [todos, setTodos] = useState([
    { id: '1', text: '멋드러지게 숨쉬기', completed: false },
    { id: '2', text: '죽여주는 점심식사하기', completed: false },
    { id: '3', text: '끝내주게 산책하기', completed: false },
    { id: '4', text: '고양이 밥주기', completed: false },
  ]);

  const handleToggle = (id: string) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const handleSettings = (id: string) => {
    console.log('Settings clicked for:', id);
  };

  return (
    <>
      {/* Toasts */}
      <Toast
        show={toast1}
        message="출근 완료, 활기찬 갓생 보내세요!"
        type="success"
        onClose={() => setToast1(false)}
      />
      <Toast
        show={toast2}
        message="퇴근 완료! 수고하셨습니다 🎉"
        type="success"
        onClose={() => setToast2(false)}
      />
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
          <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[207px]">
            <div className="flex items-center gap-1 mb-4">
              <Icon
                icon="icon-park:briefcase"
                className="w-6 h-6 text-primary-500"
              />
              <h2 className="brand-h3 text-grey-900">근태관리</h2>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="primary"
                fullWidth
                onClick={() => setToast1(true)}
              >
                출근하기
              </Button>
              <Button variant="text" fullWidth onClick={() => setToast2(true)}>
                퇴근하기
              </Button>
            </div>
          </section>

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
                icon="icon-park:chart-line"
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
          <section className="md:col-span-2 bg-primary-100 rounded-[5px] p-8 md:p-12 md:min-h-[176px] relative overflow-hidden">
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
            <p className="body-base text-grey-700">최신 공지사항</p>
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
            <p className="body-base text-grey-700">전사게시판 최신글</p>
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
    </>
  );
}
