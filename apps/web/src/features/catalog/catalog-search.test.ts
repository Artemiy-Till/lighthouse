import { describe, expect, it } from 'vitest';

import {
  normalizeCatalogSearch,
  scoreCatalogSearch,
  type CatalogSearchDocument,
} from './catalog-search';

const document: CatalogSearchDocument = {
  category: 'Музеи',
  city: 'Санкт-Петербург',
  details: ['Пешком', 'Архитектура и история старого города'],
  guide: 'Алексей Смирнов',
  title: 'Дворы, парадные и старые истории',
};

describe('catalog search', () => {
  it('normalizes case, punctuation, ё and common city aliases', () => {
    expect(normalizeCatalogSearch('  ПИТЕР, Ёлки! ')).toBe(
      'санкт петербург елки',
    );
  });

  it('finds words across different searchable fields', () => {
    expect(scoreCatalogSearch(document, 'Алексей архитектура')).toBeGreaterThan(
      0,
    );
  });

  it('tolerates a small typo', () => {
    expect(scoreCatalogSearch(document, 'парадние')).toBeGreaterThan(0);
  });

  it('requires every meaningful query word to match', () => {
    expect(scoreCatalogSearch(document, 'парадные Казань')).toBeNull();
  });

  it('ranks a title match above a description match', () => {
    const titleMatch = scoreCatalogSearch(document, 'парадные') ?? 0;
    const detailsMatch = scoreCatalogSearch(document, 'архитектура') ?? 0;
    expect(titleMatch).toBeGreaterThan(detailsMatch);
  });
});
