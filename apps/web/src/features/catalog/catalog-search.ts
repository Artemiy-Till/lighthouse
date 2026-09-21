export interface CatalogSearchDocument {
  readonly category: string;
  readonly city: string;
  readonly details: readonly string[];
  readonly guide: string;
  readonly title: string;
}

const stopWords = new Set([
  'в',
  'и',
  'на',
  'по',
  'с',
  'тур',
  'туры',
  'экскурсия',
  'экскурсии',
  'прогулка',
  'прогулки',
  'a',
  'in',
  'the',
  'tour',
]);

export function normalizeCatalogSearch(value: string) {
  const normalized = value
    .toLocaleLowerCase('ru-RU')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('ё', 'е')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  return normalized
    .split(' ')
    .flatMap((token) => {
      if (token === 'спб' || token === 'питер') return ['санкт', 'петербург'];
      if (token === 'мск') return ['москва'];
      return token ? [token] : [];
    })
    .join(' ');
}

function editDistance(left: string, right: string) {
  const previous = Array.from(
    { length: right.length + 1 },
    (_, index) => index,
  );

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        (current[rightIndex - 1] ?? 0) + 1,
        (previous[rightIndex] ?? 0) + 1,
        (previous[rightIndex - 1] ?? 0) +
          (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length] ?? Number.POSITIVE_INFINITY;
}

function tokenScore(queryToken: string, fieldToken: string) {
  if (fieldToken === queryToken) return 12;
  if (fieldToken.startsWith(queryToken) || queryToken.startsWith(fieldToken)) {
    return 9;
  }
  if (fieldToken.includes(queryToken)) return 6;

  if (queryToken.length >= 4) {
    const allowedDistance = queryToken.length >= 8 ? 2 : 1;
    if (Math.abs(fieldToken.length - queryToken.length) <= allowedDistance) {
      const distance = editDistance(queryToken, fieldToken);
      if (distance <= allowedDistance) return 4 - distance;
    }
  }

  return 0;
}

export function scoreCatalogSearch(
  document: CatalogSearchDocument,
  query: string,
) {
  const normalizedQuery = normalizeCatalogSearch(query);
  if (!normalizedQuery) return 0;

  const rawTokens = normalizedQuery.split(' ');
  const meaningfulTokens = rawTokens.filter((token) => !stopWords.has(token));
  const queryTokens =
    meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;
  const fields = [
    { text: normalizeCatalogSearch(document.title), weight: 10 },
    { text: normalizeCatalogSearch(document.category), weight: 7 },
    { text: normalizeCatalogSearch(document.guide), weight: 6 },
    { text: normalizeCatalogSearch(document.city), weight: 5 },
    {
      text: normalizeCatalogSearch(document.details.join(' ')),
      weight: 3,
    },
  ];
  let score = 0;

  for (const queryToken of queryTokens) {
    let bestTokenScore = 0;
    for (const field of fields) {
      for (const fieldToken of field.text.split(' ')) {
        bestTokenScore = Math.max(
          bestTokenScore,
          tokenScore(queryToken, fieldToken) * field.weight,
        );
      }
    }
    if (bestTokenScore === 0) return null;
    score += bestTokenScore;
  }

  for (const field of fields) {
    if (field.text.includes(normalizedQuery)) score += 20 * field.weight;
  }

  return score;
}
