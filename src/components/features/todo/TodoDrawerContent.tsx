'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';

interface TodoDrawerContentProps {
  todo?: {
    id: string;
    text: string;
    description?: string;
  } | null;
  onSave?: (data: {
    id?: string;
    title: string;
    description: string;
    estimatedTime: string;
  }) => void;
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
  const [estimatedTime, setEstimatedTime] = useState('2');

  // todo prop이 변경될 때마다 state 업데이트
  useEffect(() => {
    if (todo) {
      setTitle(todo.text || '');
      setDescription(todo.description || '');
    } else {
      setTitle('');
      setDescription('');
      setEstimatedTime('2');
    }
  }, [todo]);

  const handleSave = () => {
    onSave?.({ id: todo?.id, title, description, estimatedTime });
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

      <Select
        label="예상 포모도로 개수"
        value={estimatedTime}
        onChange={value => setEstimatedTime(value)}
        options={[
          { value: '1', label: '1개' },
          { value: '2', label: '2개' },
          { value: '3', label: '3개' },
          { value: '4', label: '4개' },
          { value: '5', label: '5개' },
          { value: '6', label: '6개' },
        ]}
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
