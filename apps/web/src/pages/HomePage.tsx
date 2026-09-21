import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { Icon } from '../components/Icon';
import { cities } from '../data/cities';
import { experiences } from '../data/experiences';
import { useCity } from '../features/city/CityContext';
import { useMaxConnection } from '../features/max/useMaxConnection';
import { useSettings } from '../features/settings/SettingsContext';

function ratingValue(value: string) {
  return Number(value.replace(',', '.')) || 0;
}

export function HomePage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { city, selectCity } = useCity();
  const { session } = useMaxConnection();
  const { t } = useSettings();
  const maxUser = session.data?.user;
  const avatarFallback =
    maxUser?.firstName?.trim().charAt(0).toUpperCase() || 'М';
  const popularExperiences = experiences
    .filter((experience) => experience.cityId === city.id)
    .sort(
      (left, right) =>
        ratingValue(right.rating) * right.reviews -
        ratingValue(left.rating) * left.reviews,
    )
    .slice(0, 4);

  return (
    <AppLayout>
      <main className="home-discovery">
        <section className="home-discovery__hero">
          <img alt="" key={city.id} src={city.heroImage} />
          <Link
            aria-label="Открыть профиль"
            className="home-discovery__profile"
            to="/profile"
          >
            {maxUser?.photoUrl ? (
              <img alt="" src={maxUser.photoUrl} />
            ) : (
              <span aria-hidden="true">{avatarFallback}</span>
            )}
          </Link>
          <div className="home-discovery__hero-copy">
            <p>Выбранный город</p>
            <h1>{city.name}</h1>
            <span>{city.subtitle}</span>
          </div>
        </section>

        <div className="home-discovery__actions">
          <form
            className="home-discovery__search"
            onSubmit={(event) => {
              event.preventDefault();
              const normalizedQuery = query.trim();
              void navigate(
                normalizedQuery
                  ? `/catalog?query=${encodeURIComponent(normalizedQuery)}`
                  : '/catalog',
              );
            }}
          >
            <Icon name="search" />
            <input
              aria-label={t('home.search')}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('home.search')}
              type="search"
              value={query}
            />
          </form>
          <Link
            aria-label={`${t('home.seeTours')} — ${city.name}`}
            className="home-discovery__catalog-link"
            to="/catalog"
          >
            Смотреть все экскурсии
          </Link>
        </div>

        <section className="home-discovery__cities">
          <h2>Выберите город</h2>
          <div
            aria-label={t('city.title')}
            className="home-discovery__city-list"
          >
            {cities.map((item) => {
              const isSelected = item.id === city.id;

              return (
                <button
                  aria-pressed={isSelected}
                  className={isSelected ? 'is-active' : ''}
                  key={item.id}
                  onClick={() => selectCity(item.id)}
                  type="button"
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </section>

        <section className="home-discovery__popular">
          <header>
            <div>
              <p>Лучшее рядом</p>
              <h2>Популярное в {city.prepositionalName}</h2>
            </div>
            <Link to="/catalog">Все</Link>
          </header>
          <div className="home-discovery__popular-list">
            {popularExperiences.map((experience) => (
              <Link
                className="home-popular-card"
                key={experience.id}
                to={`/experiences/${experience.id}`}
              >
                <img alt="" src={experience.image} />
                <span className="home-popular-card__scrim" />
                <span className="home-popular-card__rating">
                  ★ {experience.rating}
                </span>
                {experience.badge ? (
                  <span className="home-popular-card__badge">
                    {experience.badge}
                  </span>
                ) : null}
                <span className="home-popular-card__copy">
                  <small>{experience.duration}</small>
                  <strong>{experience.title}</strong>
                  <span>{experience.price}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
