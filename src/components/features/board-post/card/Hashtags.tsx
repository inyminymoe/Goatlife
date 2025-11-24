interface HashtagsProps {
  hashtags: string[];
}

export function Hashtags({ hashtags }: HashtagsProps) {
  if (!hashtags?.length) return null;

  return (
    <div className="mb-10 flex gap-6 px-6">
      {hashtags.map(tag => (
        <div className=" text-sm text-grey-500" key={tag}>
          #{tag}
        </div>
      ))}
    </div>
  );
}
