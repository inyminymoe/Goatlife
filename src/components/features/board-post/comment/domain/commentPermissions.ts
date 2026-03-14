export function canDeleteComment(
  currentUserId: string,
  commentAuthorId: string
) {
  return currentUserId === commentAuthorId;
}

export function canPinComment(currentUserId: string, postAuthorId: string) {
  return currentUserId === postAuthorId;
}
