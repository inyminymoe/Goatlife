'use client';
interface PostContentProps {
  content: string;
}

export function PostContent({ content }: PostContentProps) {
  return (
    <div className="mb-[22px] px-6 text-base leading-6 whitespace-pre-wrap">
      {content}
    </div>
  );
}
