'use client';

import { useCallback, useState } from 'react';
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
import type { RoutineMode } from './RoutineItem';
import type { RoutinePeriod, RoutineState } from './roadmap-card/types';
import { DEFAULT_ROUTINES } from './roadmap-card/constants';
import RoutineTimeline from './roadmap-card/RoutineTimeline';

export default function RoadmapCard() {
  const [routines, setRoutines] = useState<RoutineState>(DEFAULT_ROUTINES);
  const [mode, setMode] = useState<RoutineMode>('view');
  const [isMenuBottomSheetOpen, setIsMenuBottomSheetOpen] = useState(false);
  const [isAddBottomSheetOpen, setIsAddBottomSheetOpen] = useState(false);
  const [isEditBottomSheetOpen, setIsEditBottomSheetOpen] = useState(false);
  const [isStartBottomSheetOpen, setIsStartBottomSheetOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<RoutinePeriod>('AM');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(
    null
  );
  const [editTitle, setEditTitle] = useState('');
  const [startFrom, setStartFrom] = useState<{
    period: RoutinePeriod;
    title: string;
  } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

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

      const items = period === 'AM' ? routines.am : routines.pm;
      const target = items.find(item => item.id === itemId);
      if (!target) return;
      setSelectedPeriod(period);
      setSelectedRoutineId(itemId);
      setEditTitle(target.title);
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
      const getKey = (id: string): 'am' | 'pm' =>
        id.startsWith('am-') ? 'am' : 'pm';
      const sourceKey = getKey(activeId);

      // AM ↔ PM 크로스리스트 이동 제한 — Supabase order_index를 리스트별로 관리
      if (sourceKey !== getKey(overId)) return;

      setRoutines(prev => {
        const items = prev[sourceKey];
        const oldIndex = items.findIndex(i => i.id === activeId);
        const newIndex = items.findIndex(i => i.id === overId);
        return { ...prev, [sourceKey]: arrayMove(items, oldIndex, newIndex) };
      });
    },
    [mode]
  );

  const handleSaveRoutine = useCallback(() => {
    if (!selectedRoutineId) return;
    const nextTitle = editTitle.trim();
    if (!nextTitle) return;
    const key = selectedPeriod === 'AM' ? 'am' : 'pm';
    setRoutines(prev => ({
      ...prev,
      [key]: prev[key].map(item =>
        item.id === selectedRoutineId ? { ...item, title: nextTitle } : item
      ),
    }));
    setIsEditBottomSheetOpen(false);
  }, [selectedRoutineId, editTitle, selectedPeriod]);

  const handleDeleteRoutine = useCallback(() => {
    if (!selectedRoutineId) return;
    const key = selectedPeriod === 'AM' ? 'am' : 'pm';
    setRoutines(prev => ({
      ...prev,
      [key]: prev[key].filter(item => item.id !== selectedRoutineId),
    }));
    setIsEditBottomSheetOpen(false);
  }, [selectedRoutineId, selectedPeriod]);

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
            <Icon icon="icon-park:more-one" className="size-6 text-grey-900" />
          </button>
        </div>

        {/* Timeline — DndContext는 항상 유지, RoutineItem의 disabled prop이 모드를 제어 */}
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

        {/* Action Button
            bg-white은 다크모드에서도 흰색 유지 → text-fixed-grey-900으로 항상 어두운 텍스트 보장 */}
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

      <BottomSheet
        open={isAddBottomSheetOpen}
        onClose={() => setIsAddBottomSheetOpen(false)}
        title={`${selectedPeriod} 루틴 추가`}
        description="임시 바텀시트입니다. 추후 Add UI 연결 예정"
      >
        <div className="flex flex-col gap-3">
          <p className="text-14 text-grey-700">
            {selectedPeriod} 타임라인에 루틴을 추가하는 바텀시트 자리입니다.
          </p>
          <button
            type="button"
            className="w-full px-4 py-2 bg-grey-100 rounded-[8px] text-14 font-medium text-grey-900"
            onClick={() => setIsAddBottomSheetOpen(false)}
          >
            닫기
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={isEditBottomSheetOpen}
        onClose={() => setIsEditBottomSheetOpen(false)}
        title="루틴 관리"
      >
        <div className="flex flex-col gap-3">
          <label htmlFor="edit-routine-title" className="sr-only">
            루틴 이름
          </label>
          <input
            id="edit-routine-title"
            value={editTitle}
            onChange={event => setEditTitle(event.target.value)}
            className="w-full px-3 py-2 border border-grey-200 rounded-[8px] text-14 text-grey-900 bg-white"
          />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="w-full px-4 py-2 bg-primary-500 rounded-[8px] text-14 font-medium text-white"
              onClick={handleSaveRoutine}
            >
              저장
            </button>
            <button
              type="button"
              className="w-full px-4 py-2 bg-white border border-grey-200 rounded-[8px] text-14 font-medium text-primary-900"
              onClick={handleDeleteRoutine}
            >
              삭제
            </button>
          </div>
        </div>
      </BottomSheet>

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
              className="w-full px-4 py-2 bg-primary-500 rounded-[8px] text-14 font-medium text-white"
              onClick={handleStartRoutine}
            >
              시작하기
            </button>
            <button
              type="button"
              className="w-full px-4 py-2 bg-white border border-grey-200 rounded-[8px] text-14 font-medium text-grey-700"
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
