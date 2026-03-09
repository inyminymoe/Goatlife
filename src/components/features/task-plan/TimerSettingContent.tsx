import Select from '@/components/ui/Select';

const FOCUS_PRESETS = [30, 45, 60];
const BREAK_PRESETS = [15, 20, 25, 30, 60];

interface TimerSettingContentProps {
  focusPresetMinutes: number;
  breakPresetMinutes: number;
  setFocusPresetMinutes: (minutes: number) => void;
  setBreakPresetMinutes: (minutes: number) => void;
}

export default function TimerSettingContent({
  focusPresetMinutes,
  breakPresetMinutes,
  setFocusPresetMinutes,
  setBreakPresetMinutes,
}: TimerSettingContentProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="body-sm font-medium text-grey-700">집중 프리셋</span>
        <div className="flex flex-wrap gap-2">
          {FOCUS_PRESETS.map(preset => (
            <label
              key={preset}
              className="flex items-center gap-2 px-3 py-2 rounded-[5px] border border-dark bg-dark cursor-pointer"
            >
              <input
                type="radio"
                name="focusPreset"
                value={preset}
                checked={focusPresetMinutes === preset}
                onChange={() => setFocusPresetMinutes(preset)}
                className="accent-primary-500"
              />
              <span className="body-sm text-grey-900">{preset}분</span>
            </label>
          ))}
        </div>
      </div>

      <Select
        label="휴식 프리셋"
        value={String(breakPresetMinutes)}
        onChange={value => setBreakPresetMinutes(Number(value))}
        options={BREAK_PRESETS.map(preset => ({
          value: String(preset),
          label: `${preset}분`,
        }))}
      />
    </div>
  );
}
