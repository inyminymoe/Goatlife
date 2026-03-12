'use client';

import { useState } from 'react';
import Select from '@/components/ui/Select';

const FOCUS_PRESETS = [30, 45, 60];
const BREAK_PRESETS = [15, 20, 25, 30, 60];

interface TimerSettingContentProps {
  focusPresetMinutes: number;
  breakPresetMinutes: number;
  onSave: (settings: {
    focusPresetMinutes: number;
    breakPresetMinutes: number;
  }) => void;
  onClose: () => void;
}

export default function TimerSettingContent({
  focusPresetMinutes,
  breakPresetMinutes,
  onSave,
  onClose,
}: TimerSettingContentProps) {
  const [nextFocusPresetMinutes, setNextFocusPresetMinutes] =
    useState(focusPresetMinutes);
  const [nextBreakPresetMinutes, setNextBreakPresetMinutes] =
    useState(breakPresetMinutes);

  const handleSave = () => {
    onSave({
      focusPresetMinutes: nextFocusPresetMinutes,
      breakPresetMinutes: nextBreakPresetMinutes,
    });
    onClose();
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="body-sm font-medium text-grey-700">집중 프리셋</span>
        <div className="flex flex-wrap gap-2">
          {FOCUS_PRESETS.map(preset => (
            <label
              key={preset}
              className="flex cursor-pointer items-center gap-2 rounded-[5px] border border-dark bg-dark px-3 py-2"
            >
              <input
                type="radio"
                name="focusPreset"
                value={preset}
                checked={nextFocusPresetMinutes === preset}
                onChange={() => setNextFocusPresetMinutes(preset)}
                className="accent-primary-500"
              />
              <span className="body-sm text-grey-900">{preset}분</span>
            </label>
          ))}
        </div>
      </div>

      <Select
        label="휴식 프리셋"
        value={String(nextBreakPresetMinutes)}
        onChange={value => setNextBreakPresetMinutes(Number(value))}
        options={BREAK_PRESETS.map(preset => ({
          value: String(preset),
          label: `${preset}분`,
        }))}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className="w-full px-4 py-2 bg-primary-500 rounded-[8px] text-14 font-medium text-fixed-white"
          onClick={handleSave}
        >
          저장
        </button>
        <button
          type="button"
          className="w-full px-4 py-2 bg-dark border border-dark rounded-[8px] text-14 font-medium text-dark"
          onClick={onClose}
        >
          취소
        </button>
      </div>
    </div>
  );
}
