interface HashtagsProps {
  tags: string[];
}

export function Hashtags({ tags }: HashtagsProps) {
  return (
    <div className="mb-10 flex gap-6">
      {tags.map(tag => (
        <div className=" text-sm text-grey-500" key={tag}>
          #{tag}
        </div>
      ))}
    </div>
  );
}
