import { type Experience } from '../data/experiences';
import { useFavorites } from '../features/favorites/FavoritesContext';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

export function ExperienceCard({
  experience,
}: {
  readonly experience: Experience;
}) {
  const { favoriteIds, toggleFavorite } = useFavorites();
  const isFavorite = favoriteIds.has(experience.id);

  return (
    <article className="experience-card">
      <Link
        aria-label={`Подробнее об экскурсии «${experience.title}»`}
        className="experience-card__link"
        to={`/experiences/${experience.id}`}
      />
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
          aria-label={
            isFavorite
              ? `Удалить «${experience.title}» из избранного`
              : `Добавить «${experience.title}» в избранное`
          }
          aria-pressed={isFavorite}
          className={`favorite-button${isFavorite ? ' is-favorite' : ''}`}
          onClick={(event) => {
            event.preventDefault();
            toggleFavorite(experience.id);
          }}
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
