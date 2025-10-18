'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import TodoItem from '@/components/ui/TodoItem';
import Toast from '@/components/ui/Toast';

export default function Home() {
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
      {/* Toast 컴포넌트들 - 최상단 */}
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

      {/* 섹션들 */}
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[207px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">근태관리</h2>
        <p className="body-base text-grey-700">테스트 섹션 1</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="primary"
            fullWidth
            className="py-2"
            onClick={() => setToast1(true)}
          >
            출근하기
          </Button>
          <Button
            variant="text"
            fullWidth
            className="py-2"
            onClick={() => setToast2(true)}
          >
            퇴근하기
          </Button>
        </div>
      </section>

      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[207px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">사원정보</h2>
        <p className="body-base text-grey-700">테스트 섹션 2</p>
        <Button
          variant="primary"
          fullWidth
          className="py-2"
          onClick={() => setToast3(true)}
        >
          댓글 알림 테스트
        </Button>
      </section>

      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">게시판</h2>
        <p className="body-base text-grey-700">테스트 섹션 3</p>
      </section>

      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[304px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">성과 현황</h2>
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

      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[202px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">임원진 한마디</h2>
        <p className="body-base text-grey-700">테스트 섹션 5</p>
      </section>

      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[202px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">Today 갓생이</h2>
        <p className="body-base text-grey-700">테스트 섹션 6</p>
      </section>
    </>
  );
}
