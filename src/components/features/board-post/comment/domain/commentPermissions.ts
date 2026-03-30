export function canDeleteComment(
  currentUserId: string,
  commentAuthorId: string
) {
  return currentUserId === commentAuthorId;
}

export function canEditComment(
  currentUserId: string,
  commentAuthorId: string,
  isPinned: boolean
) {
  return currentUserId === commentAuthorId && !isPinned;
}

export function canPinComment(currentUserId: string, postAuthorId: string) {
  return currentUserId === postAuthorId;
}
