import ExternalLinkButton from '@/components/ui/ExternalLinkButton';
import { detectPlatform, isExternalLink } from '@/lib/linkParser';

export function parseTextWithLinks(text: string): React.ReactNode {
  if (!isExternalLink(text)) {
    return <p className="text-sm text-grey-700 whitespace-pre-wrap">{text}</p>;
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  // 정규식으로 모든 URL 찾기
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    const matchIndex = match.index;

    // URL 앞의 텍스트 추가
    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    // URL을 버튼으로 변환
    const platform = detectPlatform(url);
    parts.push(
      <ExternalLinkButton
        key={`${url}-${matchIndex}`}
        url={url}
        platform={platform}
      />
    );

    lastIndex = matchIndex + url.length;
  }

  // 마지막 URL 이후의 텍스트 추가
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return (
    <div className="text-sm text-grey-700 whitespace-pre-wrap inline-flex items-center gap-2 flex-wrap">
      {parts}
    </div>
  );
}
