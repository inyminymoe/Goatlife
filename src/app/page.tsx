'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import TodoItem from '@/components/ui/TodoItem';

export default function Home() {
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
      {' '}
      {/* 추후 각 section 컴포넌트로 교체 */}
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[207px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">근태관리</h2>
        <p className="body-base text-grey-700">테스트 섹션 1</p>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="primary" fullWidth className=" py-2">
            출근하기
          </Button>
          <Button variant="secondary" fullWidth className=" py-2">
            퇴근하기
          </Button>
        </div>
      </section>
      <section className="bg-grey-100 rounded-[5px] p-6 md:min-h-[207px] mb-5 md:mb-0">
        <h2 className="brand-h3 text-grey-900 mb-4">사원정보</h2>
        <p className="body-base text-grey-700">테스트 섹션 2</p>
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
