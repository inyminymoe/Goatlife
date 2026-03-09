'use client';

import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import {
  DndContext,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import BottomSheet from '@/components/ui/BottomSheet';
import type { RoutineMode, RoutineItemData } from './RoutineItem';
import type { RoutinePeriod, RoutineState } from './roadmap-card/types';
import { DEFAULT_ROUTINES } from './roadmap-card/constants';
import RoutineTimeline from './roadmap-card/RoutineTimeline';
import RoutineAddContent, {
  type RoutineAddData,
} from './roadmap-card/RoutineAddContent';
import RoutineEditContent from './roadmap-card/RoutineEditContent';
import {
  getRoutineItems,
  createRoutineItem,
  updateRoutineItem,
  deleteRoutineItem,
  reorderRoutineItems,
} from '@/app/_actions/routineItems';
import { useToast } from '@/providers/ToastProvider';

function toRoutineState(items: RoutineItemData[]): RoutineState {
  return {
    am: items.filter(i => i.period === 'AM'),
    pm: items.filter(i => i.period === 'PM'),
  };
}

export default function RoadmapCard() {
  const [routines, setRoutines] = useState<RoutineState>({ am: [], pm: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [mode, setMode] = useState<RoutineMode>('view');
  const [isMenuBottomSheetOpen, setIsMenuBottomSheetOpen] = useState(false);
  const [isAddBottomSheetOpen, setIsAddBottomSheetOpen] = useState(false);
  const [isEditBottomSheetOpen, setIsEditBottomSheetOpen] = useState(false);
  const [isStartBottomSheetOpen, setIsStartBottomSheetOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<RoutinePeriod>('AM');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    null
  );
  const [startFrom, setStartFrom] = useState<{
    period: RoutinePeriod;
    title: string;
  } | null>(null);

  const toast = useToast();
  const sensors = useSensors(useSensor(PointerSensor));

  // Supabase 로드
  useEffect(() => {
    getRoutineItems().then(result => {
      if (result.ok) {
        if (result.data.length === 0) {
          // 저장된 루틴 없으면 예시 데이터 표시
          setRoutines(DEFAULT_ROUTINES);
        } else {
          setRoutines(
            toRoutineState(
              result.data.map(item => ({
                id: item.id,
                title: item.title,
                category: item.category,
                period: item.period,
                url: item.url ?? undefined,
                pomodoro_count: item.pomodoro_count,
              }))
            )
          );
        }
      } else {
        // 로드 실패 시에도 예시 데이터 표시
        setRoutines(DEFAULT_ROUTINES);
      }
      setIsLoading(false);
    });
  }, []);

  const handleAddClick = useCallback(
    (period: RoutinePeriod) => {
      if (mode !== 'view') {
        setMode('view');
        setIsEditBottomSheetOpen(false);
        setSelectedRoutineId(null);
        return;
      }
      setSelectedPeriod(period);
      setIsAddBottomSheetOpen(true);
    },
    [mode]
  );

  const handleItemClick = useCallback(
    (period: RoutinePeriod, itemId: string) => {
      if (mode === 'view') {
        const items = period === 'AM' ? routines.am : routines.pm;
        const target = items.find(item => item.id === itemId);
        if (!target) return;
        setStartFrom({ period, title: target.title });
        setIsStartBottomSheetOpen(true);
        return;
      }

      if (mode !== 'edit') return;

      setSelectedPeriod(period);
      setSelectedRoutineId(itemId);
      setIsEditBottomSheetOpen(true);
    },
    [mode, routines]
  );

  const handleStartRoutine = useCallback(() => {
    setIsStartBottomSheetOpen(false);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (mode !== 'reorder') return;

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = String(active.id);
      const overId = String(over.id);
      const allItems = [...routines.am, ...routines.pm];
      const sourceItem = allItems.find(i => i.id === activeId);
      const targetItem = allItems.find(i => i.id === overId);

      if (!sourceItem || !targetItem) return;
      // AM ↔ PM 크로스리스트 이동 제한
      if (sourceItem.period !== targetItem.period) return;

      const key = sourceItem.period === 'AM' ? 'am' : 'pm';

      setRoutines(prev => {
        const items = prev[key];
        const oldIndex = items.findIndex(i => i.id === activeId);
        const newIndex = items.findIndex(i => i.id === overId);
        const reordered = arrayMove(items, oldIndex, newIndex);

        // 백그라운드 순서 저장
        reorderRoutineItems(
          reordered.map((item, idx) => ({
            id: item.id,
            order_index: (idx + 1) * 1000,
          }))
        );

        return { ...prev, [key]: reordered };
      });
    },
    [mode, routines]
  );

  const handleAddRoutine = useCallback(async (data: RoutineAddData) => {
    // 옵티미스틱 업데이트
    const tempId = `temp-${Date.now()}`;
    const newItem: RoutineItemData = {
      id: tempId,
      title: data.title,
      category: data.category,
      period: data.period,
      url: data.url,
      pomodoro_count: data.pomodoro_count,
    };
    const key = data.period === 'AM' ? 'am' : 'pm';
    setRoutines(prev => ({ ...prev, [key]: [...prev[key], newItem] }));
    setIsAddBottomSheetOpen(false);

    // Supabase 저장 후 실제 ID로 교체
    const result = await createRoutineItem({
      title: data.title,
      period: data.period,
      category: data.category,
      url: data.url,
      pomodoro_count: data.pomodoro_count,
    });

    if (result.ok) {
      const saved = result.data;
      setRoutines(prev => ({
        ...prev,
        [key]: prev[key].map(item =>
          item.id === tempId ? { ...item, id: saved.id } : item
        ),
      }));
    } else {
      setRoutines(prev => ({
        ...prev,
        [key]: prev[key].filter(item => item.id !== tempId),
      }));
      toast.error('루틴 추가에 실패했습니다. 다시 시도해주세요.');
    }
  }, []);

  const handleSaveRoutine = useCallback(
    async (data: RoutineAddData) => {
      if (!selectedRoutineId) return;

      const prevKey = selectedPeriod === 'AM' ? 'am' : 'pm';
      const newKey = data.period === 'AM' ? 'am' : 'pm';
      const prevItem = [...routines.am, ...routines.pm].find(
        i => i.id === selectedRoutineId
      );
      if (!prevItem) return;

      const updatedItem: RoutineItemData = {
        ...prevItem,
        title: data.title,
        category: data.category,
        period: data.period,
        url: data.url,
        pomodoro_count: data.pomodoro_count,
      };

      // 옵티미스틱 업데이트 (period 변경 포함)
      setRoutines(prev => {
        const withoutOld = {
          am: prev.am.filter(i => i.id !== selectedRoutineId),
          pm: prev.pm.filter(i => i.id !== selectedRoutineId),
        };
        return {
          ...withoutOld,
          [newKey]: [...withoutOld[newKey], updatedItem],
        };
      });
      setIsEditBottomSheetOpen(false);

      const result = await updateRoutineItem(selectedRoutineId, {
        title: data.title,
        period: data.period,
        category: data.category,
        url: data.url ?? null,
        pomodoro_count: data.pomodoro_count,
      });

      if (!result.ok) {
        setRoutines(prev => {
          const withoutNew = {
            am: prev.am.filter(i => i.id !== selectedRoutineId),
            pm: prev.pm.filter(i => i.id !== selectedRoutineId),
          };
          return {
            ...withoutNew,
            [prevKey]: [...withoutNew[prevKey], prevItem],
          };
        });
        toast.error('루틴 수정에 실패했습니다. 다시 시도해주세요.');
      }
    },
    [selectedRoutineId, selectedPeriod, routines]
  );

  const handleDeleteRoutine = useCallback(async () => {
    if (!selectedRoutineId) return;

    const key = selectedPeriod === 'AM' ? 'am' : 'pm';
    const prevItem = routines[key].find(i => i.id === selectedRoutineId);
    if (!prevItem) return;

    // 옵티미스틱 삭제
    setRoutines(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item.id !== selectedRoutineId),
    }));
    setIsEditBottomSheetOpen(false);

    const result = await deleteRoutineItem(selectedRoutineId);
    if (!result.ok) {
      setRoutines(prev => ({
        ...prev,
        [key]: [...prev[key], prevItem],
      }));
      toast.error('루틴 삭제에 실패했습니다. 다시 시도해주세요.');
    }
  }, [selectedRoutineId, selectedPeriod, routines]);

  const editingItem = selectedRoutineId
    ? [...routines.am, ...routines.pm].find(i => i.id === selectedRoutineId)
    : null;

  return (
    <>
      <section
        className="bg-grey-100 rounded-[5px] p-6 flex flex-col gap-5"
        aria-label="Roadmap 루틴"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-end gap-1">
            <Icon
              icon="icon-park:road-sign-both"
              className="size-6 text-grey-900"
            />
            <h2 className="brand-h3 text-grey-900">Roadmap</h2>
          </div>
          <button
            type="button"
            aria-label="메뉴"
            onClick={() => setIsMenuBottomSheetOpen(true)}
          >
            <Icon
              icon="icon-park:more-one"
              className="size-6 icon-dark-invert"
            />
          </button>
        </div>

        {/* Timeline */}
        {isLoading ? (
          <div className="flex flex-col gap-2 animate-pulse">
            <div className="h-8 bg-grey-200 rounded-[5px]" />
            <div className="h-8 bg-grey-200 rounded-[5px]" />
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex flex-col gap-2">
              <RoutineTimeline
                period="AM"
                items={routines.am}
                onAddClick={handleAddClick}
                mode={mode}
                onItemClick={handleItemClick}
              />
              <RoutineTimeline
                period="PM"
                items={routines.pm}
                onAddClick={handleAddClick}
                mode={mode}
                onItemClick={handleItemClick}
              />
            </div>
          </DndContext>
        )}

        {/* Action Button */}
        <button
          type="button"
          className="w-full px-20 py-2 bg-white rounded-[5px] flex items-center justify-center"
          onClick={() => {
            setStartFrom(null);
            setIsStartBottomSheetOpen(true);
          }}
        >
          <span className="text-fixed-grey-900 text-14 font-semibold">
            루틴 시작하기
          </span>
        </button>
      </section>

      {/* 메뉴 BottomSheet */}
      <BottomSheet
        open={isMenuBottomSheetOpen}
        onClose={() => setIsMenuBottomSheetOpen(false)}
        title="설정"
      >
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="w-full px-4 py-3 text-left text-14 font-medium text-grey-900"
            onClick={() => {
              setMode('edit');
              setIsMenuBottomSheetOpen(false);
            }}
          >
            루틴 수정
          </button>
          <button
            type="button"
            className="w-full px-4 py-3 text-left text-14 font-medium text-grey-900"
            onClick={() => {
              setMode('reorder');
              setIsMenuBottomSheetOpen(false);
            }}
          >
            순서 변경
          </button>
        </div>
      </BottomSheet>

      {/* Add BottomSheet */}
      <BottomSheet
        open={isAddBottomSheetOpen}
        onClose={() => setIsAddBottomSheetOpen(false)}
        title="루틴 관리"
      >
        <RoutineAddContent
          key={selectedPeriod}
          defaultPeriod={selectedPeriod}
          onSave={handleAddRoutine}
          onClose={() => setIsAddBottomSheetOpen(false)}
        />
      </BottomSheet>

      {/* Edit BottomSheet */}
      <BottomSheet
        open={isEditBottomSheetOpen}
        onClose={() => setIsEditBottomSheetOpen(false)}
        title="루틴 관리"
      >
        {editingItem && (
          <RoutineEditContent
            key={editingItem.id}
            initialTitle={editingItem.title}
            initialUrl={editingItem.url}
            initialPeriod={editingItem.period}
            initialPomodoroCount={editingItem.pomodoro_count ?? 1}
            initialCategory={editingItem.category}
            onSave={handleSaveRoutine}
            onDelete={handleDeleteRoutine}
            onClose={() => setIsEditBottomSheetOpen(false)}
          />
        )}
      </BottomSheet>

      {/* Start BottomSheet */}
      <BottomSheet
        open={isStartBottomSheetOpen}
        onClose={() => setIsStartBottomSheetOpen(false)}
        title="루틴 시작하기"
      >
        <div className="flex flex-col gap-3">
          <p className="text-14 text-grey-700">
            하루 루틴 타이머를 재생합니다.
          </p>
          {startFrom && (
            <p className="text-12 text-grey-500">
              시작 지점: {startFrom.period} · {startFrom.title}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="w-full px-4 py-2 bg-primary-500 rounded-[8px] text-14 font-medium text-fixed-white"
              onClick={handleStartRoutine}
            >
              시작하기
            </button>
            <button
              type="button"
              className="w-full px-4 py-2 bg-dark border border-dark rounded-[8px] text-14 font-medium text-dark"
              onClick={() => setIsStartBottomSheetOpen(false)}
            >
              취소
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
