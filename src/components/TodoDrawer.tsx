'use client';
import BottomSheet from '@/components/ui/BottomSheet';
import TodoDrawerContent from '@/components/features/todo/TodoDrawerContent';

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

/**
 * TodoDrawer - 업무 계획 상세/수정 바텀시트
 *
 * BottomSheet를 사용하는 도메인 래퍼 컴포넌트
 * 외부 API는 유지하되 내부 구현은 공통 BottomSheet 사용
 */
export default function TodoDrawer({
  isOpen,
  onClose,
  todo,
  onSave,
  onDelete,
}: TodoDrawerProps) {
  return (
    <BottomSheet open={isOpen} onClose={onClose} title="업무 계획">
      <TodoDrawerContent
        todo={todo}
        onSave={onSave}
        onDelete={onDelete}
        onClose={onClose}
      />
    </BottomSheet>
  );
}
