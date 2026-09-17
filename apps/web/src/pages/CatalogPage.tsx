import { useMemo, useState } from 'react';

import { AppLayout } from '../components/AppLayout';
import { ExperienceCard } from '../components/ExperienceCard';
import { Icon } from '../components/Icon';
import { categories, experiences } from '../data/experiences';
import { useCity } from '../features/city/CityContext';

export function CatalogPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const { city, selectCity } = useCity();
  const hasExperiences = city.id === 'saint-petersburg';

  const filteredExperiences = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru');

    if (!hasExperiences) return [];

    return experiences.filter((experience) => {
      const matchesCategory =
        activeCategory === null || experience.category === activeCategory;
      const matchesQuery =
        normalizedQuery === '' ||
        `${experience.title} ${experience.category}`
          .toLocaleLowerCase('ru')
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, hasExperiences, query]);

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
          <strong>{filteredExperiences.length} предложения</strong>
          <button type="button">Сначала популярные ⌄</button>
        </div>

        {filteredExperiences.length > 0 ? (
          <div className="catalog-grid">
            {filteredExperiences.map((experience) => (
              <ExperienceCard experience={experience} key={experience.id} />
            ))}
          </div>
        ) : hasExperiences ? (
          <div className="empty-state">
            <span aria-hidden="true">🔎</span>
            <h2>Ничего не найдено</h2>
            <p>Измените запрос или выберите другую категорию.</p>
            <button
              onClick={() => {
                setActiveCategory(null);
                setQuery('');
              }}
              type="button"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <div className="empty-state empty-state--large">
            <span aria-hidden="true">📍</span>
            <h2>Скоро в {city.prepositionalName}</h2>
            <p>
              Каталог для этого города ещё наполняется. Петербург уже доступен.
            </p>
            <button
              onClick={() => selectCity('saint-petersburg')}
              type="button"
            >
              Открыть Петербург
            </button>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
