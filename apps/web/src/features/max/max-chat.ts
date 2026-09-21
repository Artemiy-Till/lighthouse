export function getMaxUserChatUrl(maxUserId: string, username?: string | null) {
  const normalizedUsername = username?.trim().replace(/^@/, '');
  return normalizedUsername
    ? `https://max.ru/${encodeURIComponent(normalizedUsername)}`
    : `max://user/${encodeURIComponent(maxUserId)}`;
}
