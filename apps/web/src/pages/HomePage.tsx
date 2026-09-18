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

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const { city } = useCity();

  const filteredExperiences = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru');

    return getExperiencesForCity(city.id).filter((experience) => {
      const matchesCategory =
        activeCategory === null || experience.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${experience.title} ${experience.category}`
          .toLocaleLowerCase('ru')
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, city.id, query]);

  return (
    <AppLayout>
      <header className="topbar">
        <CitySelector />
        <div className="topbar-actions">
          <ThemeToggle />
          <Link
            aria-label="Избранное"
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
            alt={`Панорама города ${city.name}`}
            className="hero__image"
            fetchPriority="high"
            height="1024"
            src={city.heroImage}
            width="1456"
          />
          <div className="hero__scrim" />
          <div className="hero__content">
            <p className="hero__eyebrow">Впечатления рядом</p>
            <h1>Откройте город по‑новому</h1>
            <p>Экскурсии и прогулки с теми, кто знает каждую его историю</p>
          </div>
        </section>

        <section aria-label="Поиск впечатлений" className="search-panel">
          <label className="search-field">
            <Icon name="search" />
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Куда или что хотите посмотреть?"
              type="search"
              value={query}
            />
          </label>
          <DateSelector onChange={setSelectedDate} value={selectedDate} />
        </section>

        <section className="content-section categories-section">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Выберите настроение</p>
              <h2>Чем заняться</h2>
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
              <p className="section-kicker">Выбор путешественников</p>
              <h2>Популярное в {city.prepositionalName}</h2>
            </div>
            <Link className="text-button" to="/catalog">
              Все
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
              <h3>Пока ничего не нашли</h3>
              <p>Попробуйте другой запрос или сбросьте выбранную категорию.</p>
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
          )}
        </section>

        <section className="content-section local-banner">
          <div>
            <p className="section-kicker">Совет от местных</p>
            <h2>Не знаете, что выбрать?</h2>
            <p>Собрали маршруты для первого знакомства с городом.</p>
          </div>
          <Link className="primary-link" to="/catalog">
            Посмотреть подборку
          </Link>
        </section>
      </main>
    </AppLayout>
  );
}
