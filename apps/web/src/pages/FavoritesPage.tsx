import { Link } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { ExperienceCard } from '../components/ExperienceCard';
import { experiences } from '../data/experiences';
import { useFavorites } from '../features/favorites/FavoritesContext';
import { useSettings } from '../features/settings/SettingsContext';

export function FavoritesPage() {
  const { favoriteIds } = useFavorites();
  const { t } = useSettings();
  const favoriteExperiences = experiences.filter((experience) =>
    favoriteIds.has(experience.id),
  );

  return (
    <AppLayout>
      <main className="secondary-page">
        <header className="page-header">
          <p className="section-kicker">{t('favorites.kicker')}</p>
          <h1>{t('favorites.title')}</h1>
          <p>{t('favorites.subtitle')}</p>
        </header>

        {favoriteExperiences.length > 0 ? (
          <>
            <div className="favorites-note">
              <span aria-hidden="true">💜</span>
              <p>
                {t('favorites.saved')}{' '}
                <strong>{favoriteExperiences.length}</strong>.{' '}
                {t('favorites.hint')}
              </p>
            </div>
            <div className="catalog-grid">
              {favoriteExperiences.map((experience) => (
                <ExperienceCard experience={experience} key={experience.id} />
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state empty-state--large">
            <span aria-hidden="true">♡</span>
            <h2>{t('favorites.emptyTitle')}</h2>
            <p>{t('favorites.emptyText')}</p>
            <Link className="primary-link" to="/catalog">
              {t('favorites.toCatalog')}
            </Link>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
