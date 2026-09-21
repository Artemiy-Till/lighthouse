export function getMaxUserChatUrl(maxUserId: string) {
  return `max://user/${encodeURIComponent(maxUserId)}`;
}
