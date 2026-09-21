import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import {
  CatalogFilters,
  type CatalogFilterState,
  emptyCatalogFilters,
} from '../components/CatalogFilters';
import { ExperienceCard } from '../components/ExperienceCard';
import { Icon } from '../components/Icon';
import {
  categories,
  formatOfferCount,
  getExperienceDetails,
  getExperiencesForCity,
  type Experience,
  type ExperienceDetails,
} from '../data/experiences';
import { getGuideForCity } from '../data/guides';
import {
  scoreCatalogSearch,
  type CatalogSearchDocument,
} from '../features/catalog/catalog-search';
import { useCity } from '../features/city/CityContext';
import {
  toExperience,
  toExperienceDetails,
  usePublishedExperiences,
} from '../features/marketplace/usePublishedExperiences';
import { useSettings } from '../features/settings/SettingsContext';

type CatalogSort = 'popular' | 'price' | 'rating';

interface CatalogEntry {
  readonly details: ExperienceDetails | undefined;
  readonly experience: Experience;
  readonly searchDocument: CatalogSearchDocument;
}

function getPrice(price: string) {
  return Number(price.replace(/\D/g, ''));
}

function getDuration(duration: string) {
  const value = duration.match(/[\d,.]+/)?.[0];
  return value ? Number(value.replace(',', '.')) : 0;
}

function getRating(rating: string) {
  return Number(rating.replace(',', '.'));
}

function matchesDuration(
  duration: number,
  filter: CatalogFilterState['duration'],
) {
  if (filter === 'short') return duration <= 2;
  if (filter === 'medium') return duration > 2 && duration <= 3;
  if (filter === 'long') return duration > 3;
  return true;
}

function getFormatFromDetails(value: string): CatalogFilterState['format'] {
  const format = value.toLocaleLowerCase('ru');
  if (format.includes('катер') || format.includes('теплоход')) return 'water';
  if (format === 'пешком' || format.includes('метро')) return 'walking';
  return 'transport';
}

function getFormat(id: string): CatalogFilterState['format'] {
  return getFormatFromDetails(getExperienceDetails(id)?.format ?? '');
}

function isChildrenTextSuitable(children: string) {
  return (
    children.startsWith('Можно с детьми') ||
    children.includes('детям') ||
    children.includes('для детей')
  );
}

function isSuitableForChildren(id: string) {
  const children = getExperienceDetails(id)?.children ?? '';
  return isChildrenTextSuitable(children);
}

function matchesChildrenFilter(
  isSuitable: boolean,
  filter: CatalogFilterState['children'],
) {
  if (filter === 'family') return isSuitable;
  if (filter === 'adults') return !isSuitable;
  return true;
}

function matchesEntryFilters(
  entry: CatalogEntry,
  selectedFilters: CatalogFilterState,
  activeCategory: string | null,
  query: string,
) {
  const { details, experience } = entry;
  const price = getPrice(experience.price);
  return (
    (activeCategory === null || experience.category === activeCategory) &&
    scoreCatalogSearch(entry.searchDocument, query) !== null &&
    (selectedFilters.minPrice === null || price >= selectedFilters.minPrice) &&
    (selectedFilters.maxPrice === null || price <= selectedFilters.maxPrice) &&
    matchesDuration(
      getDuration(experience.duration),
      selectedFilters.duration,
    ) &&
    (selectedFilters.format === 'any' ||
      (details
        ? getFormatFromDetails(details.format)
        : getFormat(experience.id)) === selectedFilters.format) &&
    (selectedFilters.minRating === null ||
      getRating(experience.rating) >= selectedFilters.minRating) &&
    matchesChildrenFilter(
      details
        ? isChildrenTextSuitable(details.children)
        : isSuitableForChildren(experience.id),
      selectedFilters.children,
    )
  );
}

export function CatalogPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filters, setFilters] =
    useState<CatalogFilterState>(emptyCatalogFilters);
  const [sort, setSort] = useState<CatalogSort>('popular');
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('query') ?? '';
  const { city } = useCity();
  const { language, t } = useSettings();
  const published = usePublishedExperiences(city.id);

  const catalogEntries = useMemo<CatalogEntry[]>(() => {
    const remoteItems = published.data?.items ?? [];
    const remoteEntries = remoteItems.map((item) => {
      const details = toExperienceDetails(item);
      return {
        details,
        experience: toExperience(item),
        searchDocument: {
          category: item.category,
          city: city.name,
          details: [
            item.intro,
            item.description,
            item.format,
            item.children,
            item.meetingPoint,
            item.groupType,
            ...item.highlights,
          ],
          guide: `${item.guide.displayName} ${item.guide.bio}`,
          title: item.title,
        },
      };
    });
    const guide = getGuideForCity(city.id);
    const localEntries = getExperiencesForCity(city.id).map((experience) => {
      const details = getExperienceDetails(experience.id);
      return {
        details,
        experience,
        searchDocument: {
          category: experience.category,
          city: city.name,
          details: details
            ? [
                details.intro,
                details.description,
                details.format,
                details.children,
                details.groupSize,
                details.groupType,
                details.meetingPoint,
                ...details.highlights,
              ]
            : [experience.duration],
          guide: guide
            ? `${guide.name} ${guide.tagline} ${guide.about} ${guide.languages.join(' ')}`
            : '',
          title: experience.title,
        },
      };
    });

    return [...remoteEntries, ...localEntries];
  }, [city.id, city.name, published.data]);

  const filteredExperiences = useMemo(() => {
    return catalogEntries
      .filter((entry) =>
        matchesEntryFilters(entry, filters, activeCategory, query),
      )
      .map((entry) => ({
        ...entry,
        searchScore: scoreCatalogSearch(entry.searchDocument, query) ?? 0,
      }))
      .sort((first, second) => {
        if (query.trim() && second.searchScore !== first.searchScore) {
          return second.searchScore - first.searchScore;
        }
        if (sort === 'price') {
          return (
            getPrice(first.experience.price) - getPrice(second.experience.price)
          );
        }
        if (sort === 'rating') {
          return (
            getRating(second.experience.rating) -
            getRating(first.experience.rating)
          );
        }
        return second.experience.reviews - first.experience.reviews;
      })
      .map((entry) => entry.experience);
  }, [activeCategory, catalogEntries, filters, query, sort]);

  const previewFilterCount = (draft: CatalogFilterState) =>
    catalogEntries.filter((entry) =>
      matchesEntryFilters(entry, draft, activeCategory, query),
    ).length;

  const updateQuery = (value: string) => {
    const nextSearchParams = new URLSearchParams(searchParams);
    if (value.trim()) nextSearchParams.set('query', value);
    else nextSearchParams.delete('query');
    setSearchParams(nextSearchParams, { replace: true });
  };

  const activeFilterLabels = [
    filters.minPrice !== null
      ? {
          key: 'minPrice',
          label: `${language === 'en' ? 'From' : 'От'} ${filters.minPrice.toLocaleString('ru-RU')} ₽`,
        }
      : null,
    filters.maxPrice !== null
      ? {
          key: 'maxPrice',
          label: `${language === 'en' ? 'Up to' : 'До'} ${filters.maxPrice.toLocaleString('ru-RU')} ₽`,
        }
      : null,
    filters.duration !== 'any'
      ? {
          key: 'duration',
          label:
            filters.duration === 'short'
              ? t('filter.under2h')
              : filters.duration === 'medium'
                ? t('filter.twoThreeH')
                : t('filter.over3h'),
        }
      : null,
    filters.format !== 'any'
      ? {
          key: 'format',
          label:
            filters.format === 'walking'
              ? t('filter.walking')
              : filters.format === 'water'
                ? t('filter.water')
                : t('filter.transport'),
        }
      : null,
    filters.minRating !== null
      ? { key: 'minRating', label: `★ ${filters.minRating.toFixed(1)}+` }
      : null,
    filters.children !== 'any'
      ? {
          key: 'children',
          label:
            filters.children === 'family'
              ? t('filter.family')
              : t('filter.adults'),
        }
      : null,
  ].filter((item): item is { key: string; label: string } => Boolean(item));

  const removeFilter = (key: string) => {
    if (key === 'minPrice') setFilters({ ...filters, minPrice: null });
    if (key === 'maxPrice') setFilters({ ...filters, maxPrice: null });
    if (key === 'duration') setFilters({ ...filters, duration: 'any' });
    if (key === 'format') setFilters({ ...filters, format: 'any' });
    if (key === 'minRating') setFilters({ ...filters, minRating: null });
    if (key === 'children') setFilters({ ...filters, children: 'any' });
  };

  return (
    <AppLayout>
      <main className="secondary-page catalog-page">
        <header className="page-header">
          <p className="section-kicker">{city.name}</p>
          <h1>{t('catalog.title')}</h1>
          <p>{t('catalog.subtitle')}</p>
        </header>

        <label className="search-field catalog-search">
          <Icon name="search" />
          <input
            aria-label={t('catalog.search')}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder={t('catalog.search')}
            type="search"
            value={query}
          />
        </label>

        <div aria-label={t('catalog.categories')} className="filter-chips">
          <button
            aria-pressed={activeCategory === null}
            className={activeCategory === null ? 'is-active' : ''}
            onClick={() => setActiveCategory(null)}
            type="button"
          >
            {t('common.all')}
          </button>
          {categories.map((category) => (
            <button
              aria-pressed={activeCategory === category.label}
              className={activeCategory === category.label ? 'is-active' : ''}
              key={category.label}
              onClick={() => setActiveCategory(category.label)}
              type="button"
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="catalog-summary">
          <strong>
            {language === 'en'
              ? `${filteredExperiences.length} experiences`
              : formatOfferCount(filteredExperiences.length)}
          </strong>
          <div className="catalog-summary__actions">
            <CatalogFilters
              getResultCount={previewFilterCount}
              onChange={setFilters}
              value={filters}
            />
            <label className="catalog-sort">
              <span className="visually-hidden">{t('catalog.sort')}</span>
              <select
                aria-label={t('catalog.sort')}
                onChange={(event) => setSort(event.target.value as CatalogSort)}
                value={sort}
              >
                <option value="popular">{t('catalog.popular')}</option>
                <option value="rating">{t('catalog.rating')}</option>
                <option value="price">{t('catalog.price')}</option>
              </select>
            </label>
          </div>
        </div>

        {activeFilterLabels.length > 0 ? (
          <div
            aria-label={t('filter.active')}
            className="catalog-active-filters"
          >
            {activeFilterLabels.map((filter) => (
              <button
                aria-label={`${filter.label} — ${language === 'en' ? 'remove' : 'убрать'}`}
                key={filter.key}
                onClick={() => removeFilter(filter.key)}
                type="button"
              >
                {filter.label} <span aria-hidden="true">×</span>
              </button>
            ))}
            <button
              aria-label={
                language === 'en'
                  ? 'Reset all active filters'
                  : 'Сбросить все активные фильтры'
              }
              className="catalog-active-filters__reset"
              onClick={() => setFilters(emptyCatalogFilters)}
              type="button"
            >
              {t('filter.reset')}
            </button>
          </div>
        ) : null}

        {filteredExperiences.length > 0 ? (
          <div className="catalog-grid">
            {filteredExperiences.map((experience) => (
              <ExperienceCard experience={experience} key={experience.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">🔎</span>
            <h2>{t('catalog.emptyTitle')}</h2>
            <p>{t('catalog.emptyText')}</p>
            <button
              onClick={() => {
                setActiveCategory(null);
                setFilters(emptyCatalogFilters);
                updateQuery('');
              }}
              type="button"
            >
              {t('common.reset')}
            </button>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
