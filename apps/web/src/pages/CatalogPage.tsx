import { useMemo, useState } from 'react';

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
} from '../data/experiences';
import { useCity } from '../features/city/CityContext';
import {
  toExperience,
  toExperienceDetails,
  usePublishedExperiences,
} from '../features/marketplace/usePublishedExperiences';

type CatalogSort = 'popular' | 'price' | 'rating';

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

export function CatalogPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [filters, setFilters] =
    useState<CatalogFilterState>(emptyCatalogFilters);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<CatalogSort>('popular');
  const { city } = useCity();
  const published = usePublishedExperiences(city.id);

  const filteredExperiences = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru');

    const remoteItems = published.data?.items ?? [];
    const remoteDetails = new Map(
      remoteItems.map((item) => [item.id, toExperienceDetails(item)]),
    );

    return [...remoteItems.map(toExperience), ...getExperiencesForCity(city.id)]
      .filter((experience) => {
        const matchesCategory =
          activeCategory === null || experience.category === activeCategory;
        const matchesQuery =
          normalizedQuery === '' ||
          `${experience.title} ${experience.category}`
            .toLocaleLowerCase('ru')
            .includes(normalizedQuery);
        const matchesPrice =
          filters.maxPrice === null ||
          getPrice(experience.price) <= filters.maxPrice;
        const matchesDurationFilter = matchesDuration(
          getDuration(experience.duration),
          filters.duration,
        );
        const matchesFormat =
          filters.format === 'any' ||
          (remoteDetails.get(experience.id)
            ? getFormatFromDetails(remoteDetails.get(experience.id)!.format)
            : getFormat(experience.id)) === filters.format;
        const matchesRating =
          filters.minRating === null ||
          getRating(experience.rating) >= filters.minRating;
        const matchesChildren =
          filters.children === 'any' ||
          (remoteDetails.get(experience.id)
            ? isChildrenTextSuitable(remoteDetails.get(experience.id)!.children)
            : isSuitableForChildren(experience.id));

        return (
          matchesCategory &&
          matchesQuery &&
          matchesPrice &&
          matchesDurationFilter &&
          matchesFormat &&
          matchesRating &&
          matchesChildren
        );
      })
      .sort((first, second) => {
        if (sort === 'price') {
          return getPrice(first.price) - getPrice(second.price);
        }
        if (sort === 'rating') {
          return getRating(second.rating) - getRating(first.rating);
        }
        return second.reviews - first.reviews;
      });
  }, [activeCategory, city.id, filters, published.data, query, sort]);

  return (
    <AppLayout>
      <main className="secondary-page">
        <header className="page-header">
          <p className="section-kicker">{city.name}</p>
          <h1>Каталог впечатлений</h1>
          <p>Экскурсии, прогулки и необычные маршруты по городу.</p>
        </header>

        <label className="search-field catalog-search">
          <Icon name="search" />
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти экскурсию"
            type="search"
            value={query}
          />
        </label>

        <div aria-label="Категории" className="filter-chips">
          <button
            aria-pressed={activeCategory === null}
            className={activeCategory === null ? 'is-active' : ''}
            onClick={() => setActiveCategory(null)}
            type="button"
          >
            Все
          </button>
          {categories.map((category) => (
            <button
              aria-pressed={activeCategory === category.label}
              className={activeCategory === category.label ? 'is-active' : ''}
              key={category.label}
              onClick={() => setActiveCategory(category.label)}
              type="button"
            >
              {category.emoji} {category.label}
            </button>
          ))}
        </div>

        <div className="catalog-summary">
          <strong>{formatOfferCount(filteredExperiences.length)}</strong>
          <div className="catalog-summary__actions">
            <CatalogFilters onChange={setFilters} value={filters} />
            <label className="catalog-sort">
              <span className="visually-hidden">Сортировка</span>
              <select
                aria-label="Сортировка"
                onChange={(event) => setSort(event.target.value as CatalogSort)}
                value={sort}
              >
                <option value="popular">Популярные</option>
                <option value="rating">По рейтингу</option>
                <option value="price">Сначала дешевле</option>
              </select>
            </label>
          </div>
        </div>

        {filteredExperiences.length > 0 ? (
          <div className="catalog-grid">
            {filteredExperiences.map((experience) => (
              <ExperienceCard experience={experience} key={experience.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">🔎</span>
            <h2>Ничего не найдено</h2>
            <p>Измените запрос или выберите другую категорию.</p>
            <button
              onClick={() => {
                setActiveCategory(null);
                setFilters(emptyCatalogFilters);
                setQuery('');
              }}
              type="button"
            >
              Сбросить фильтры
            </button>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
