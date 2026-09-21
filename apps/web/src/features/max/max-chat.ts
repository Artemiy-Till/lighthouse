export function getMaxUserChatUrl(username: string) {
  const normalizedUsername = username.trim().replace(/^@/, '');
  return `https://max.ru/${encodeURIComponent(normalizedUsername)}`;
}
