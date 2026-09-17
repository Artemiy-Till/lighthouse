import { type ReactNode, useMemo, useState } from 'react';

import { getMaxPlatform } from '../platform/max/max-platform';

type IconName = 'calendar' | 'heart' | 'home' | 'map' | 'profile' | 'search';

interface Experience {
  readonly badge?: string;
  readonly category: string;
  readonly duration: string;
  readonly image: string;
  readonly price: string;
  readonly rating: string;
  readonly reviews: number;
  readonly title: string;
}

const categories = [
  { emoji: '🚶', label: 'Обзорные' },
  { emoji: '🏛️', label: 'Музеи' },
  { emoji: '⛵', label: 'По воде' },
  { emoji: '🌙', label: 'Вечерние' },
  { emoji: '🍽️', label: 'Гастро' },
  { emoji: '👨‍👩‍👧', label: 'С детьми' },
] as const;

const experiences: readonly Experience[] = [
  {
    badge: 'Хит',
    category: 'Обзорные',
    duration: '2 часа · Пешком',
    image: '/images/saint-petersburg-hero.webp',
    price: 'от 1 290 ₽',
    rating: '4,96',
    reviews: 328,
    title: 'Петербург: первое знакомство',
  },
  {
    badge: 'Авторская',
    category: 'Музеи',
    duration: '1,5 часа · Пешком',
    image: '/images/hidden-courtyards.webp',
    price: 'от 1 800 ₽',
    rating: '4,91',
    reviews: 184,
    title: 'Дворы, парадные и старые истории',
  },
  {
    badge: 'Сегодня',
    category: 'Вечерние',
    duration: '1,5 часа · На катере',
    image: '/images/drawbridges.webp',
    price: 'от 1 590 ₽',
    rating: '4,88',
    reviews: 517,
    title: 'Разводные мосты с воды',
  },
  {
    category: 'По воде',
    duration: '5 часов · Мини-группа',
    image: '/images/kronstadt.webp',
    price: 'от 3 200 ₽',
    rating: '4,94',
    reviews: 96,
    title: 'Форты и маяки Кронштадта',
  },
];

function Icon({ name }: { readonly name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    calendar: (
      <>
        <path d="M6 2v3M14 2v3M3 8h14" />
        <rect height="15" rx="2" width="16" x="2" y="4" />
      </>
    ),
    heart: (
      <path d="M17.4 4.6a4.5 4.5 0 0 0-6.4 0L10 5.7 8.9 4.6a4.5 4.5 0 0 0-6.3 6.4l1 1L10 18l6.4-6 1-1a4.5 4.5 0 0 0 0-6.4Z" />
    ),
    home: (
      <>
        <path d="m2 9 8-7 8 7" />
        <path d="M4 8v10h12V8M8 18v-6h4v6" />
      </>
    ),
    map: (
      <>
        <path d="m2 5 5-2 6 2 5-2v14l-5 2-6-2-5 2Z" />
        <path d="M7 3v14M13 5v14" />
      </>
    ),
    profile: (
      <>
        <circle cx="10" cy="7" r="4" />
        <path d="M3 19c.6-4 3-6 7-6s6.4 2 7 6" />
      </>
    ),
    search: (
      <>
        <circle cx="9" cy="9" r="6" />
        <path d="m14 14 4 4" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" className="icon" fill="none" viewBox="0 0 20 20">
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        {paths[name]}
      </g>
    </svg>
  );
}

function ExperienceCard({ experience }: { readonly experience: Experience }) {
  return (
    <article className="experience-card">
      <div className="experience-card__media">
        <img
          alt=""
          height="560"
          loading="lazy"
          src={experience.image}
          width="760"
        />
        {experience.badge ? (
          <span className="experience-card__badge">{experience.badge}</span>
        ) : null}
        <button
          aria-label={`Добавить «${experience.title}» в избранное`}
          className="favorite-button"
          type="button"
        >
          <Icon name="heart" />
        </button>
      </div>
      <div className="experience-card__content">
        <p className="experience-card__meta">{experience.duration}</p>
        <h3>{experience.title}</h3>
        <div className="experience-card__rating">
          <span aria-hidden="true">★</span>
          <strong>{experience.rating}</strong>
          <span>{experience.reviews} отзывов</span>
        </div>
        <p className="experience-card__price">{experience.price}</p>
      </div>
    </article>
  );
}

export function HomePage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const maxPlatform = getMaxPlatform();

  const filteredExperiences = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ru');

    return experiences.filter((experience) => {
      const matchesCategory =
        activeCategory === null || experience.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${experience.title} ${experience.category}`
          .toLocaleLowerCase('ru')
          .includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <div className="app-shell" id="top">
      <header className="topbar">
        <button
          aria-label="Выбрать город"
          className="location-button"
          type="button"
        >
          <span className="brand-mark">В</span>
          <span>
            <small>Ваш город</small>
            <strong>Санкт-Петербург</strong>
          </span>
          <span aria-hidden="true" className="chevron">
            ⌄
          </span>
        </button>
        <button aria-label="Избранное" className="topbar-action" type="button">
          <Icon name="heart" />
        </button>
      </header>

      <main>
        <section className="hero">
          <img
            alt="Канал в центре Санкт-Петербурга в утреннем свете"
            className="hero__image"
            fetchPriority="high"
            height="739"
            src="/images/saint-petersburg-hero.webp"
            width="1600"
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
          <button className="date-button" type="button">
            <Icon name="calendar" />
            Любая дата
          </button>
        </section>

        <section className="content-section categories-section" id="explore">
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
              <h2>Популярное в Петербурге</h2>
            </div>
            <button className="text-button" type="button">
              Все
            </button>
          </div>

          {filteredExperiences.length > 0 ? (
            <div className="experience-grid">
              {filteredExperiences.map((experience) => (
                <ExperienceCard
                  experience={experience}
                  key={experience.title}
                />
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
          <button type="button">Посмотреть подборку</button>
        </section>
      </main>

      <nav aria-label="Основная навигация" className="bottom-navigation">
        <a
          aria-current="page"
          className="bottom-navigation__item is-active"
          href="#top"
        >
          <Icon name="home" />
          <span>Главная</span>
        </a>
        <a className="bottom-navigation__item" href="#explore">
          <Icon name="map" />
          <span>Каталог</span>
        </a>
        <a className="bottom-navigation__item" href="#favorites" id="favorites">
          <Icon name="heart" />
          <span>Избранное</span>
        </a>
        <a className="bottom-navigation__item" href="#profile" id="profile">
          <Icon name="profile" />
          <span>Профиль</span>
        </a>
      </nav>

      {!maxPlatform.isAvailable ? (
        <span className="development-badge">Browser preview</span>
      ) : null}
    </div>
  );
}
