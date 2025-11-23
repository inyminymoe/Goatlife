export function detectPlatform(
  url: string
): 'discord' | 'zoom' | 'google-meet' | 'notion' | 'generic' {
  if (url.includes('discord.gg') || url.includes('discord.com'))
    return 'discord';
  if (url.includes('zoom.us')) return 'zoom';
  if (url.includes('meet.google.com')) return 'google-meet';
  if (url.includes('notion.so')) return 'notion';
  return 'generic';
}

export function isExternalLink(text: string): boolean {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return urlRegex.test(text);
}
