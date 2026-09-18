import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { DateSelector } from '../components/DateSelector';
import { Icon } from '../components/Icon';
import { cities } from '../data/cities';
import {
  getExperienceById,
  getExperienceDetails,
  getExperienceRestrictions,
} from '../data/experiences';
import { getGuideForCity } from '../data/guides';
import { useFavorites } from '../features/favorites/FavoritesContext';

export function ExperienceDetailsPage() {
  const { experienceId = '' } = useParams();
  const navigate = useNavigate();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const experience = getExperienceById(experienceId);
  const details = getExperienceDetails(experienceId);
  const restrictions = getExperienceRestrictions(experienceId);
  const city = cities.find((item) => item.id === experience?.cityId);
  const guide = experience ? getGuideForCity(experience.cityId) : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [experienceId]);

  if (!experience || !details || !city) {
    return (
      <main className="experience-not-found">
        <span aria-hidden="true">🧭</span>
        <h1>Экскурсия не найдена</h1>
        <p>Возможно, ссылка устарела или предложение больше недоступно.</p>
        <Link className="primary-link" to="/catalog">
          Вернуться в каталог
        </Link>
      </main>
    );
  }

  const isFavorite = favoriteIds.has(experience.id);

  return (
    <main className="experience-details-page">
      <section className="experience-details-hero">
        <img
          alt={experience.title}
          fetchPriority="high"
          height="840"
          src={experience.image}
          width="1180"
        />
        <button
          aria-label="Вернуться назад"
          className="experience-details-hero__back"
          onClick={() => {
            void navigate(-1);
          }}
          type="button"
        >
          ←
        </button>
        <button
          aria-label={
            isFavorite
              ? `Удалить «${experience.title}» из избранного`
              : `Добавить «${experience.title}» в избранное`
          }
          aria-pressed={isFavorite}
          className={`experience-details-hero__favorite${isFavorite ? ' is-favorite' : ''}`}
          onClick={() => toggleFavorite(experience.id)}
          type="button"
        >
          <Icon name="heart" />
        </button>
        <span className="experience-details-hero__counter">1 / 1</span>
      </section>

      <div className="experience-details-content">
        <header className="experience-details-header">
          <p className="experience-details-rating">
            <span aria-hidden="true">★</span>
            <strong>{experience.rating}</strong>
            <span>· {experience.reviews} отзывов</span>
          </p>
          <h1>{experience.title}</h1>
          <p className="experience-details-intro">{details.intro}</p>
          <p className="experience-details-location">⌖ {city.name}</p>
        </header>

        <section className="experience-facts-card">
          <h2>{details.groupType}</h2>
          <dl>
            <div>
              <dt>Длительность</dt>
              <dd>{experience.duration.split(' · ')[0]}</dd>
            </div>
            <div>
              <dt>Размер группы</dt>
              <dd>{details.groupSize}</dd>
            </div>
            <div>
              <dt>Дети</dt>
              <dd>{details.children}</dd>
            </div>
            <div>
              <dt>Как проходит</dt>
              <dd>{details.format}</dd>
            </div>
          </dl>

          <div className="experience-booking-cta">
            <p>
              {experience.price} <span>за человека</span>
            </p>
            <DateSelector
              defaultLabel="Выбрать дату"
              onChange={setSelectedDate}
              value={selectedDate}
            />
          </div>

          <div className="experience-benefits">
            <p>
              <span aria-hidden="true">⚡</span>
              <strong>Моментальное подтверждение</strong>
              <small>Без ожидания ответа гида</small>
            </p>
            <p>
              <span aria-hidden="true">✓</span>
              <strong>Безопасное бронирование</strong>
              <small>Данные заказа будут защищены</small>
            </p>
          </div>
        </section>

        <section className="experience-description">
          <h2>Об экскурсии</h2>
          <p>{details.description}</p>
        </section>

        {guide ? (
          <section className="experience-guide">
            <h2>Ваш гид</h2>
            <Link
              aria-label={`Открыть профиль гида ${guide.name}`}
              className="experience-guide__card"
              to={`/guides/${guide.id}`}
            >
              <img
                alt=""
                height="720"
                loading="lazy"
                src={guide.avatar}
                width="720"
              />
              <span className="experience-guide__info">
                <strong>{guide.name}</strong>
                <small>{guide.tagline}</small>
                <span>
                  ★ {guide.rating} · {guide.reviewCount} отзывов
                </span>
              </span>
              <span aria-hidden="true" className="experience-guide__arrow">
                ›
              </span>
            </Link>
          </section>
        ) : null}

        <section className="experience-more">
          <h2>Подробнее</h2>
          <details>
            <summary>Что вас ожидает</summary>
            <ul>
              {details.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </details>
          <details>
            <summary>Место встречи</summary>
            <p>{details.meetingPoint}</p>
          </details>
        </section>

        {restrictions.length > 0 ? (
          <section className="experience-restrictions">
            <details open>
              <summary>Не подойдёт для:</summary>
              <ul>
                {restrictions.map((restriction) => (
                  <li key={restriction}>{restriction}</li>
                ))}
              </ul>
            </details>
          </section>
        ) : null}

        <section className="experience-terms">
          <h2>Условия бронирования</h2>
          <ul>
            <li>
              <span aria-hidden="true">▣</span>Оплата после подтверждения заказа
            </li>
            <li>
              <span aria-hidden="true">↩</span>Бесплатная отмена за 48 часов
            </li>
            <li>
              <span aria-hidden="true">A</span>Экскурсия проходит на русском
              языке
            </li>
          </ul>
        </section>

        <p className="prototype-caption">
          Пока это прототип: выбор времени и оформление заказа подключим на
          следующем этапе.
        </p>
      </div>
    </main>
  );
}
