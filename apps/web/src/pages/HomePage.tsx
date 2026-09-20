import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { Icon } from '../components/Icon';
import { ThemeToggle } from '../components/ThemeToggle';
import { cities } from '../data/cities';
import { useCity } from '../features/city/CityContext';
import { useMaxConnection } from '../features/max/useMaxConnection';
import { useSettings } from '../features/settings/SettingsContext';

export function HomePage() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { city, selectCity } = useCity();
  const { session } = useMaxConnection();
  const { t } = useSettings();
  const firstName = session.data?.user.firstName.trim() || 'Артемий';

  return (
    <AppLayout>
      <main className="home-landing">
        <header className="home-landing__header">
          <div>
            <h1>
              {t('home.greeting')} {firstName}
            </h1>
            <p>{t('home.welcome')}</p>
          </div>
          <div className="home-landing__actions">
            <ThemeToggle />
          </div>
        </header>

        <form
          className="home-landing__search"
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
          <button aria-label={t('home.openCatalog')} type="submit">
            <Icon name="map" />
          </button>
        </form>

        <section className="home-destinations">
          <h2>{t('home.destinationsTitle')}</h2>
          <div aria-label={t('city.title')} className="home-city-tabs">
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

        <Link
          aria-label={`${t('home.seeTours')} — ${city.name}`}
          className="home-selected-city"
          to="/catalog"
        >
          <img alt="" key={city.id} src={city.heroImage} />
          <span aria-hidden="true" className="home-selected-city__scrim" />
          <span className="home-selected-city__copy">
            <small>{t('home.selectedCity')}</small>
            <strong>{city.name}</strong>
            <span>{city.subtitle}</span>
          </span>
          <span className="home-selected-city__action">
            <span>{t('home.seeTours')}</span>
            <i aria-hidden="true">→</i>
          </span>
        </Link>
      </main>
    </AppLayout>
  );
}
