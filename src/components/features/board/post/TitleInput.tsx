interface PostTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TitleInput({ value, onChange, error }: PostTitleInputProps) {
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="제목을 입력해 주세요"
        maxLength={100}
        className="w-full bg-transparent border-none outline-none text-xl font-medium text-fixed-grey-900 placeholder:text-fixed-grey-300"
      />
      {error && <p className="mt-1 text-xs text-[#e26aff]">{error}</p>}
    </div>
  );
}
