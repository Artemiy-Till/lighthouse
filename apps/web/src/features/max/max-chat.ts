export function getMaxUserChatUrl(maxUserId: string, username?: string | null) {
  const normalizedProfilePath = username
    ?.trim()
    .replace(/^https:\/\/max\.ru\//i, '')
    .replace(/^@/, '')
    .replace(/^\/+|\/+$/g, '');
  const encodedProfilePath = normalizedProfilePath
    ?.split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  return encodedProfilePath
    ? `https://max.ru/${encodedProfilePath}`
    : `max://user/${encodeURIComponent(maxUserId)}`;
}
