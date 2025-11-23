'use client';
interface PostContentProps {
  content: string;
}

export function PostContent({ content }: PostContentProps) {
  // TODO: 콘텐츠는 일반 문자열보다 이미지, 리치텍스트를 지원하기 위해 html 저장 방식이 좋을 듯 함
  return (
    <div
      className="mb-[22px] px-6 prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
