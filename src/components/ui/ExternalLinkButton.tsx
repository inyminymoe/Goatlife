import { Icon } from '@iconify/react';

interface ExternalLinkButtonProps {
  url: string;
  platform?: 'discord' | 'zoom' | 'google-meet' | 'notion' | 'generic';
  label?: string;
}

const platformConfig = {
  discord: {
    icon: 'ic:baseline-discord',
    label: '디스코드로 이동하기',
    color: 'text-indigo-500',
  },
  zoom: {
    icon: 'simple-icons:zoom',
    label: 'Zoom 미팅 참여하기',
    color: 'text-blue-500',
  },
  'google-meet': {
    icon: 'simple-icons:googlemeet',
    label: 'Google Meet 참여하기',
    color: 'text-green-500',
  },
  notion: {
    icon: 'simple-icons:notion',
    label: 'Notion에서 보기',
    color: 'text-grey-900',
  },
  generic: {
    icon: 'material-symbols:link',
    label: '링크 열기',
    color: 'text-grey-700',
  },
};

export default function ExternalLinkButton({
  url,
  platform = 'generic',
  label,
}: ExternalLinkButtonProps) {
  const config = platformConfig[platform];
  const displayLabel = label || config.label;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 p-2 bg-white rounded-[5px] shadow-[4px_4px_4px_0px_rgba(47,136,255,0.08)] hover:shadow-[4px_4px_6px_0px_rgba(47,136,255,0.25)] transition-shadow"
      aria-label={displayLabel}
    >
      <Icon icon={config.icon} className={`w-3.5 h-3.5 ${config.color}`} />
      <span className="text-grey-900 body-2xs font-medium">{displayLabel}</span>
    </a>
  );
}
