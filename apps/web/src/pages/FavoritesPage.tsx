import { Link } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { ExperienceCard } from '../components/ExperienceCard';
import { experiences } from '../data/experiences';
import { useFavorites } from '../features/favorites/FavoritesContext';

export function FavoritesPage() {
  const { favoriteIds } = useFavorites();
  const favoriteExperiences = experiences.filter((experience) =>
    favoriteIds.has(experience.id),
  );

  return (
    <AppLayout>
      <main className="secondary-page">
        <header className="page-header">
          <p className="section-kicker">Сохранённое</p>
          <h1>Избранное</h1>
          <p>Все идеи для будущих прогулок в одном месте.</p>
        </header>

        {favoriteExperiences.length > 0 ? (
          <>
            <div className="favorites-note">
              <span aria-hidden="true">💜</span>
              <p>
                Сохранено: <strong>{favoriteExperiences.length}</strong>.
                Нажмите на сердце в карточке, чтобы удалить экскурсию.
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
            <h2>Здесь пока пусто</h2>
            <p>
              Сохраняйте понравившиеся экскурсии, чтобы вернуться к ним позже.
            </p>
            <Link className="primary-link" to="/catalog">
              Перейти в каталог
            </Link>
          </div>
        )}
      </main>
    </AppLayout>
  );
}
