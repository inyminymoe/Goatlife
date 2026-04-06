'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';

interface TodoDrawerContentProps {
  todo?: {
    id: string;
    text: string;
    description?: string;
  } | null;
  onSave?: (data: { id?: string; title: string; description: string }) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export default function TodoDrawerContent({
  todo,
  onSave,
  onDelete,
  onClose,
}: TodoDrawerContentProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // todo prop이 변경될 때마다 state 업데이트
  useEffect(() => {
    if (todo) {
      setTitle(todo.text || '');
      setDescription(todo.description || '');
    } else {
      setTitle('');
      setDescription('');
    }
  }, [todo]);

  const handleSave = () => {
    onSave?.({ id: todo?.id, title, description });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      onDelete?.(todo?.id || '');
      onClose();
    }
  };

  return (
    <div className="space-y-4">
      <Input
        id="title"
        label="제목"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="투두 제목"
      />

      <TextArea
        label="설명"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="세부 내용을 입력하세요 (선택사항)"
        rows={4}
      />

      {/* 버튼 - 2열 */}
      <div className="pt-4 grid grid-cols-2 gap-3">
        <Button variant="primary" onClick={handleSave}>
          저장
        </Button>
        <Button
          variant="outline"
          onClick={handleDelete}
          className="text-grey-900 border-grey-200 hover:bg-grey-100"
        >
          삭제
        </Button>
      </div>
    </div>
  );
}
