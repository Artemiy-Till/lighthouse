import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { CitySelector } from '../components/CitySelector';
import { DateSelector } from '../components/DateSelector';
import { ExperienceCard } from '../components/ExperienceCard';
import { Icon } from '../components/Icon';
import { ThemeToggle } from '../components/ThemeToggle';
import { categories, getExperiencesForCity } from '../data/experiences';
import { useCity } from '../features/city/CityContext';
import {
  toExperience,
  usePublishedExperiences,
} from '../features/marketplace/usePublishedExperiences';
import { useSettings } from '../features/settings/SettingsContext';

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const { city } = useCity();
  const { t } = useSettings();
  const published = usePublishedExperiences(city.id);

  const filteredExperiences = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru');

    const allExperiences = [
      ...(published.data?.items.map(toExperience) ?? []),
      ...getExperiencesForCity(city.id),
    ];

    return allExperiences.filter((experience) => {
      const matchesCategory =
        activeCategory === null || experience.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${experience.title} ${experience.category}`
          .toLocaleLowerCase('ru')
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, city.id, published.data, query]);

  return (
    <AppLayout>
      <header className="topbar">
        <CitySelector />
        <div className="topbar-actions">
          <ThemeToggle />
          <Link
            aria-label={t('home.favorite')}
            className="topbar-action"
            to="/favorites"
          >
            <Icon name="heart" />
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <img
            alt={`${t('home.heroAlt')} ${city.name}`}
            className="hero__image"
            fetchPriority="high"
            height="1024"
            src={city.heroImage}
            width="1456"
          />
          <div className="hero__scrim" />
          <div className="hero__content">
            <p className="hero__eyebrow">{t('home.eyebrow')}</p>
            <h1>{t('home.title')}</h1>
            <p>{t('home.subtitle')}</p>
          </div>
        </section>

        <section aria-label={t('home.searchAria')} className="search-panel">
          <label className="search-field">
            <Icon name="search" />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('home.search')}
              type="search"
              value={query}
            />
          </label>
          <DateSelector onChange={setSelectedDate} value={selectedDate} />
        </section>

        <section className="content-section categories-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">{t('home.mood')}</p>
              <h2>{t('home.activities')}</h2>
            </div>
          </div>
          <div className="category-list">
            {categories.map((category) => {
              const isActive = activeCategory === category.label;

              return (
                <button
                  aria-pressed={isActive}
                  className={`category-item${isActive ? ' category-item--active' : ''}`}
                  key={category.label}
                  onClick={() =>
                    setActiveCategory(isActive ? null : category.label)
                  }
                  type="button"
                >
                  <span className="category-item__icon">{category.emoji}</span>
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="content-section experiences-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">{t('home.travelers')}</p>
              <h2>
                {t('home.popular')} {city.prepositionalName}
              </h2>
            </div>
            <Link className="text-button" to="/catalog">
              {t('common.all')}
            </Link>
          </div>

          {filteredExperiences.length > 0 ? (
            <div className="experience-grid">
              {filteredExperiences.map((experience) => (
                <ExperienceCard experience={experience} key={experience.id} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span aria-hidden="true">🧭</span>
              <h3>{t('home.emptyTitle')}</h3>
              <p>{t('home.emptyText')}</p>
              <button
                onClick={() => {
                  setActiveCategory(null);
                  setQuery('');
                }}
                type="button"
              >
                {t('common.reset')}
              </button>
            </div>
          )}
        </section>

        <section className="content-section local-banner">
          <div>
            <p className="section-kicker">{t('home.localTip')}</p>
            <h2>{t('home.helpTitle')}</h2>
            <p>{t('home.helpText')}</p>
          </div>
          <Link className="primary-link" to="/catalog">
            {t('home.collection')}
          </Link>
        </section>
      </main>
    </AppLayout>
  );
}
