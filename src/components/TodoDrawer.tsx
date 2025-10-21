'use client';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import TextArea from '@/components/ui/TextArea';
import Select from '@/components/ui/Select';

interface TodoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export default function TodoDrawer({
  isOpen,
  onClose,
  todo,
  onSave,
  onDelete,
}: TodoDrawerProps) {
  const [title, setTitle] = useState(todo?.text || '');
  const [description, setDescription] = useState(todo?.description || '');
  const [estimatedTime, setEstimatedTime] = useState('2');

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
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="
              fixed bottom-0 left-0 right-0 z-50
              bg-white 
              rounded-t-[20px]
              shadow-2xl
              max-h-[85vh]
              overflow-y-auto
            "
          >
            {/* Handle Bar */}
            <div className="sticky top-0 bg-white pt-3 pb-2 flex justify-center rounded-t-[20px]">
              <div className="w-12 h-1 bg-grey-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 flex items-center justify-between border-b border-grey-200">
              <h2 className="brand-h3 text-grey-900">업무 계획</h2>
              <button
                onClick={onClose}
                className="hover:bg-grey-100 rounded-full p-1 transition-colors"
              >
                <Icon
                  icon="material-symbols:close"
                  className="w-6 h-6 text-grey-700"
                />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
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
                  className="text-grey-900 border-grey-300 hover:bg-grey-100"
                >
                  삭제
                </Button>
              </div>
            </div>
            {/* 하단 여백 (Safe Area) */}
            <div className="h-8" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
