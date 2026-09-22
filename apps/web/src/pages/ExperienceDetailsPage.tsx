import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { createBooking, type CreateBookingInput } from '../api/client';
import { useMaxConnection } from '../features/max/useMaxConnection';
import {
  toExperience,
  toExperienceDetails,
  usePublishedExperience,
  usePublishedExperienceReviews,
} from '../features/marketplace/usePublishedExperiences';
import { useSettings } from '../features/settings/SettingsContext';

function bookingErrorMessage(message: string) {
  if (message === 'Not enough available places') {
    return 'Это время уже занято или свободных мест больше нет. Обновите карточку и выберите другой слот.';
  }
  if (message === 'A guide cannot book their own experience') {
    return 'На свою экскурсию записаться нельзя.';
  }
  if (
    message === 'Expired MAX launch data' ||
    message === 'Invalid MAX launch data' ||
    message === 'MAX launch data is required'
  ) {
    return 'Сессия MAX устарела. Закройте и снова откройте мини-приложение.';
  }
  return 'Не удалось оформить запись. Попробуйте ещё раз.';
}

export function ExperienceDetailsPage() {
  const { experienceId = '' } = useParams();
  const navigate = useNavigate();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const { language, t } = useSettings();
  const { platform, session } = useMaxConnection();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [participants, setParticipants] = useState(1);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const booking = useMutation({
    mutationFn: (input: CreateBookingInput) =>
      createBooking(platform.initData ?? '', input),
    onSuccess: async () => {
      setBookingComplete(true);
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
  const staticExperience = getExperienceById(experienceId);
  const published = usePublishedExperience(experienceId, !staticExperience);
  const publishedReviews = usePublishedExperienceReviews(
    experienceId,
    Boolean(!staticExperience && published.data),
  );
  const experience =
    staticExperience ??
    (published.data ? toExperience(published.data) : undefined);
  const details = staticExperience
    ? getExperienceDetails(experienceId)
    : published.data
      ? toExperienceDetails(published.data)
      : undefined;
  const restrictions = getExperienceRestrictions(experienceId);
  const city = cities.find((item) => item.id === experience?.cityId);
  const guide = staticExperience
    ? getGuideForCity(staticExperience.cityId)
    : undefined;

  useEffect(() => {
    window.scrollTo(0, 0);
    setPhotoIndex(0);
  }, [experienceId]);

  useEffect(() => {
    if (staticExperience || !published.data) return;
    const availableSlots = published.data.availableSlots;
    const firstSlot = availableSlots?.[0];
    if (!firstSlot) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate(firstSlot.date);
    setSelectedTime(firstSlot.time);
  }, [published.data, staticExperience]);

  if (!staticExperience && published.isPending) {
    return (
      <main className="experience-not-found">
        <span aria-hidden="true">⏳</span>
        <h1>Загружаем экскурсию</h1>
      </main>
    );
  }

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
  const photos =
    published.data && published.data.photos.length > 0
      ? published.data.photos
      : [experience.image];
  const activePhoto = photos[photoIndex] ?? photos[0]!;
  const priceRub =
    published.data?.priceRub ?? Number(experience.price.replace(/\D/g, ''));
  const groupSize =
    published.data?.groupSize ??
    Number(details.groupSize.match(/\d+/)?.[0] ?? 1);
  const availableSlots = published.data?.availableSlots ?? [];
  const availableDates = [...new Set(availableSlots.map((slot) => slot.date))];
  const timesForDate = availableSlots.filter(
    (slot) => slot.date === selectedDate,
  );
  const selectedSlot = timesForDate.find((slot) => slot.time === selectedTime);
  const participantLimit = published.data
    ? Math.max(1, selectedSlot?.remaining ?? 1)
    : groupSize;
  const reviewLocale = language === 'en' ? 'en-US' : 'ru-RU';

  const formatReviewCount = (count: number) => {
    if (language === 'en')
      return `${count} ${count === 1 ? 'review' : 'reviews'}`;
    if (count % 10 === 1 && count % 100 !== 11) return `${count} отзыв`;
    if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
      return `${count} отзыва`;
    }
    return `${count} отзывов`;
  };

  return (
    <main className="experience-details-page">
      <section className="experience-details-hero">
        <img
          alt={experience.title}
          fetchPriority="high"
          height="840"
          src={activePhoto}
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
        {photos.length > 1 ? (
          <>
            <button
              aria-label="Предыдущая фотография"
              className="experience-details-hero__previous"
              onClick={() =>
                setPhotoIndex((photoIndex - 1 + photos.length) % photos.length)
              }
              type="button"
            >
              ‹
            </button>
            <button
              aria-label="Следующая фотография"
              className="experience-details-hero__next"
              onClick={() => setPhotoIndex((photoIndex + 1) % photos.length)}
              type="button"
            >
              ›
            </button>
          </>
        ) : null}
        <span className="experience-details-hero__counter">
          {photoIndex + 1} / {photos.length}
        </span>
      </section>

      <div className="experience-details-content">
        <header className="experience-details-header">
          <p className="experience-details-rating">
            {experience.reviews > 0 ? (
              <>
                <span aria-hidden="true">★</span>
                <strong>{experience.rating}</strong>
                <span>· {experience.reviews} отзывов</span>
              </>
            ) : (
              <span>{t('card.noReviews')}</span>
            )}
          </p>
          <div className="experience-details-title-row">
            <div>
              <h1>{experience.title}</h1>
              <p className="experience-details-intro">{details.intro}</p>
            </div>
            <p className="experience-details-price">
              <strong>{experience.price}</strong>
              <span>за человека</span>
            </p>
          </div>
          <p className="experience-details-location">{city.name}</p>
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
            {published.data ? (
              availableDates.length > 0 ? (
                <label className="booking-field">
                  <span>Доступная дата</span>
                  <select
                    aria-label="Доступная дата"
                    onChange={(event) => {
                      const date = event.target.value;
                      setSelectedDate(date);
                      setSelectedTime(
                        availableSlots.find((slot) => slot.date === date)
                          ?.time ?? '',
                      );
                      setParticipants(1);
                    }}
                    value={selectedDate ?? ''}
                  >
                    {availableDates.map((date) => (
                      <option key={date} value={date}>
                        {new Intl.DateTimeFormat('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        }).format(new Date(`${date}T12:00:00`))}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="booking-no-slots">
                  Гид пока не добавил свободные даты.
                </p>
              )
            ) : (
              <DateSelector
                defaultLabel="Выбрать дату"
                onChange={setSelectedDate}
                value={selectedDate}
              />
            )}
            <label className="booking-field">
              <span>Время начала</span>
              <select
                aria-label="Время начала"
                disabled={Boolean(published.data && timesForDate.length === 0)}
                onChange={(event) => {
                  setSelectedTime(event.target.value);
                  setParticipants(1);
                }}
                value={selectedTime}
              >
                {published.data ? (
                  timesForDate.map((slot) => (
                    <option key={slot.time} value={slot.time}>
                      {slot.time} · {slot.remaining} мест
                    </option>
                  ))
                ) : (
                  <>
                    <option value="10:00">10:00</option>
                    <option value="12:00">12:00</option>
                    <option value="15:00">15:00</option>
                    <option value="18:00">18:00</option>
                  </>
                )}
              </select>
            </label>
            <div className="participant-picker">
              <span>Участники</span>
              <div>
                <button
                  aria-label="Уменьшить количество участников"
                  disabled={participants === 1}
                  onClick={() => setParticipants((value) => value - 1)}
                  type="button"
                >
                  −
                </button>
                <strong>{participants}</strong>
                <button
                  aria-label="Увеличить количество участников"
                  disabled={participants === participantLimit}
                  onClick={() => setParticipants((value) => value + 1)}
                  type="button"
                >
                  +
                </button>
              </div>
            </div>
            <div className="booking-total">
              <span>Итого</span>
              <strong>
                {(priceRub * participants).toLocaleString('ru-RU')} ₽
              </strong>
            </div>
            {bookingComplete ? (
              <div className="booking-success" role="status">
                <strong>
                  <span aria-hidden="true" className="booking-success__check">
                    ✓
                  </span>
                  Вы записаны
                </strong>
                <span className="booking-success__caption">
                  Заказ сохранён и подтверждён.
                </span>
                <Link to="/orders">Открыть мои заказы</Link>
              </div>
            ) : (
              <button
                className="booking-submit"
                disabled={
                  !selectedDate ||
                  (Boolean(published.data) && !selectedSlot) ||
                  !platform.initData ||
                  !session.data?.authenticated ||
                  booking.isPending
                }
                onClick={() =>
                  booking.mutate({
                    cityId: experience.cityId,
                    date: selectedDate!,
                    experienceId: experience.id,
                    groupSize,
                    imageUrl: activePhoto,
                    meetingPoint: details.meetingPoint,
                    participants,
                    priceRub,
                    time: selectedTime,
                    title: experience.title,
                  })
                }
                type="button"
              >
                {booking.isPending
                  ? 'Оформляем запись…'
                  : selectedDate
                    ? 'Записаться на экскурсию'
                    : 'Сначала выберите дату'}
              </button>
            )}
            {!platform.initData ? (
              <p className="booking-message">
                Для записи откройте экскурсию внутри MAX.
              </p>
            ) : null}
            {booking.isError ? (
              <p className="booking-message booking-message--error">
                {bookingErrorMessage(booking.error.message)}
              </p>
            ) : null}
          </div>

          <div className="experience-benefits">
            <p>
              <strong>Моментальное подтверждение</strong>
              <small>Без ожидания ответа гида</small>
            </p>
            <p>
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
        ) : published.data ? (
          <section className="experience-guide">
            <h2>Ваш гид</h2>
            <div className="experience-guide__card">
              {published.data.guide.photoUrl ? (
                <img
                  alt={`Фото гида ${published.data.guide.displayName}`}
                  className="experience-guide__avatar experience-guide__avatar--image"
                  height="128"
                  src={published.data.guide.photoUrl}
                  width="128"
                />
              ) : (
                <span aria-hidden="true" className="experience-guide__avatar">
                  {published.data.guide.displayName.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="experience-guide__info">
                <strong>{published.data.guide.displayName}</strong>
                <small>{published.data.guide.bio}</small>
                <span>✓ Профиль гида подтверждён через MAX</span>
              </span>
            </div>
          </section>
        ) : null}

        {published.data ? (
          <section className="experience-reviews">
            <div className="experience-reviews__heading">
              <h2>{t('reviews.title')}</h2>
              {published.data.reviewCount > 0 ? (
                <span>
                  ★{' '}
                  {published.data.rating.toLocaleString(reviewLocale, {
                    maximumFractionDigits: 1,
                    minimumFractionDigits: 1,
                  })}{' '}
                  · {formatReviewCount(published.data.reviewCount)}
                </span>
              ) : null}
            </div>

            {publishedReviews.isPending ? (
              <p className="experience-reviews__state">
                {t('reviews.loading')}
              </p>
            ) : publishedReviews.isError ? (
              <p className="experience-reviews__state is-error">
                {t('reviews.error')}
              </p>
            ) : publishedReviews.data?.items.length ? (
              <ul className="experience-review-list">
                {publishedReviews.data.items.map((review) => (
                  <li key={review.id}>
                    <div className="experience-review__author">
                      {review.authorPhotoUrl ? (
                        <img
                          alt=""
                          height="48"
                          loading="lazy"
                          src={review.authorPhotoUrl}
                          width="48"
                        />
                      ) : (
                        <span aria-hidden="true">
                          {review.authorName.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <strong>{review.authorName}</strong>
                        <time dateTime={review.createdAt}>
                          {new Intl.DateTimeFormat(reviewLocale, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }).format(new Date(review.createdAt))}
                        </time>
                      </div>
                      <b
                        aria-label={`${review.rating} ${t('orders.reviewStars')}`}
                      >
                        {'★'.repeat(review.rating)}
                      </b>
                    </div>
                    <p>{review.comment}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="experience-reviews__state">{t('card.noReviews')}</p>
            )}
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
            <ul>
              <li>{details.meetingPoint}</li>
            </ul>
          </details>
          {restrictions.length > 0 ? (
            <details className="experience-more__restrictions">
              <summary>Не подойдёт для</summary>
              <ul>
                {restrictions.map((restriction) => (
                  <li key={restriction}>{restriction}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>

        <section className="experience-terms">
          <h2>Условия бронирования</h2>
          <ul>
            <li>Оплата после подтверждения заказа</li>
            <li>Бесплатная отмена за 48 часов</li>
            <li>Экскурсия проходит на русском языке</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
