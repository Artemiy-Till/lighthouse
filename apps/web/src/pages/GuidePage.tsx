import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { getPublishedExperiences } from '../api/client';
import { ExperienceCard } from '../components/ExperienceCard';
import { ThemeToggle } from '../components/ThemeToggle';
import { cities } from '../data/cities';
import { experiences } from '../data/experiences';
import { getGuideById } from '../data/guides';
import { toExperience } from '../features/marketplace/usePublishedExperiences';

function reviewLabel(count: number) {
  if (count === 0) return 'Нет отзывов';
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return `${count} отзывов`;
  if (mod10 === 1) return `${count} отзыв`;
  if (mod10 >= 2 && mod10 <= 4) return `${count} отзыва`;
  return `${count} отзывов`;
}

function routeLabel(count: number) {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return 'маршрутов';
  if (mod10 === 1) return 'маршрут';
  if (mod10 >= 2 && mod10 <= 4) return 'маршрута';
  return 'маршрутов';
}

export function GuidePage() {
  const { guideId = '' } = useParams();
  const navigate = useNavigate();
  const guide = getGuideById(guideId);
  const published = useQuery({
    enabled: !guide,
    queryFn: () => getPublishedExperiences(),
    queryKey: ['published-experiences'],
    retry: false,
    staleTime: 15_000,
  });
  const publishedGuideExperiences = (published.data?.items ?? []).filter(
    (experience) => experience.guide.id === guideId,
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [guideId]);

  if (!guide && published.isPending) {
    return (
      <p className="compact-loading" role="status">
        Загружаем профиль гида…
      </p>
    );
  }

  if (!guide && publishedGuideExperiences.length > 0) {
    const publicGuide = publishedGuideExperiences[0]!.guide;
    const cityNames = [
      ...new Set(
        publishedGuideExperiences.map(
          (experience) =>
            cities.find((city) => city.id === experience.cityId)?.name,
        ),
      ),
    ]
      .filter((name): name is string => Boolean(name))
      .join(' · ');
    const reviewCount = publishedGuideExperiences.reduce(
      (total, experience) => total + (experience.reviewCount ?? 0),
      0,
    );
    const weightedRating =
      reviewCount > 0
        ? publishedGuideExperiences.reduce(
            (total, experience) =>
              total + (experience.rating ?? 0) * (experience.reviewCount ?? 0),
            0,
          ) / reviewCount
        : 0;

    return (
      <main className="guide-page">
        <header className="guide-page__topbar">
          <button
            aria-label="Вернуться назад"
            className="guide-page__back"
            onClick={() => void navigate(-1)}
            type="button"
          >
            ←
          </button>
          <strong>Профиль гида</strong>
          <ThemeToggle />
        </header>

        <section className="guide-profile">
          <div className="guide-profile__identity">
            {publicGuide.photoUrl ? (
              <img
                alt={`Гид ${publicGuide.displayName}`}
                className="guide-profile__avatar"
                height="720"
                src={publicGuide.photoUrl}
                width="720"
              />
            ) : (
              <span
                aria-hidden="true"
                className="guide-profile__avatar guide-profile__avatar--fallback"
              >
                {publicGuide.displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="guide-profile__copy">
              <h1 aria-label={publicGuide.displayName}>
                {publicGuide.displayName}
                <span
                  aria-label="Личность подтверждена через MAX"
                  className="guide-profile__verification-mark"
                  role="img"
                >
                  ✓
                </span>
              </h1>
              <p className="guide-profile__cities">{cityNames}</p>
            </div>
          </div>

          <dl className="guide-stats">
            <div>
              <dt>
                {reviewCount > 0
                  ? `★ ${weightedRating.toLocaleString('ru-RU', {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 1,
                    })}`
                  : '—'}
              </dt>
              <dd>{reviewLabel(reviewCount)}</dd>
            </div>
            <div>
              <dt>MAX</dt>
              <dd>профиль подтверждён</dd>
            </div>
            <div>
              <dt>{publishedGuideExperiences.length}</dt>
              <dd>{routeLabel(publishedGuideExperiences.length)} в каталоге</dd>
            </div>
          </dl>
        </section>

        <div className="guide-page__content">
          <section className="guide-section">
            <h2>О гиде</h2>
            <p>{publicGuide.bio}</p>
          </section>

          <section className="guide-section">
            <h2>Опыт и квалификация</h2>
            <ul className="guide-credentials">
              <li>
                <span aria-hidden="true">✓</span>
                Профиль гида подтверждён через MAX
              </li>
              <li>
                <span aria-hidden="true">✓</span>
                Автор опубликованных маршрутов
              </li>
            </ul>
          </section>

          <section className="guide-tours">
            <div className="section-heading">
              <span>МАРШРУТЫ ГИДА</span>
            </div>
            <div className="experience-grid">
              {publishedGuideExperiences.map((experience) => (
                <ExperienceCard
                  experience={toExperience(experience)}
                  key={experience.id}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!guide) {
    return (
      <main className="experience-not-found">
        <span aria-hidden="true">🧭</span>
        <h1>Гид не найден</h1>
        <p>Возможно, ссылка устарела или профиль временно недоступен.</p>
        <Link className="primary-link" to="/catalog">
          Вернуться в каталог
        </Link>
      </main>
    );
  }

  const guideExperiences = experiences.filter((experience) =>
    guide.cityIds.includes(experience.cityId),
  );
  const cityNames = guide.cityIds
    .map((cityId) => cities.find((city) => city.id === cityId)?.name)
    .filter(Boolean)
    .join(' · ');

  return (
    <main className="guide-page">
      <header className="guide-page__topbar">
        <button
          aria-label="Вернуться назад"
          className="guide-page__back"
          onClick={() => void navigate(-1)}
          type="button"
        >
          ←
        </button>
        <strong>Профиль гида</strong>
        <ThemeToggle />
      </header>

      <section className="guide-profile">
        <div className="guide-profile__identity">
          <img
            alt={`Гид ${guide.name}`}
            className="guide-profile__avatar"
            height="720"
            src={guide.avatar}
            width="720"
          />
          <div className="guide-profile__copy">
            <h1 aria-label={guide.name}>
              {guide.name}
              <span
                aria-label="Личность подтверждена"
                className="guide-profile__verification-mark"
                role="img"
              >
                ✓
              </span>
            </h1>
            <p className="guide-profile__cities">{cityNames}</p>
          </div>
        </div>

        <dl className="guide-stats">
          <div>
            <dt>★ {guide.rating}</dt>
            <dd>{guide.reviewCount} отзывов</dd>
          </div>
          <div>
            <dt>{guide.yearsExperience} лет</dt>
            <dd>проводит экскурсии</dd>
          </div>
          <div>
            <dt>{guideExperiences.length}</dt>
            <dd>
              {guideExperiences.length === 4 ? 'маршрута' : 'маршрутов'} в
              каталоге
            </dd>
          </div>
        </dl>
      </section>

      <div className="guide-page__content">
        <section className="guide-section">
          <h2>О гиде</h2>
          <p>{guide.about}</p>
        </section>

        <section className="guide-section">
          <h2>Опыт и квалификация</h2>
          <ul className="guide-credentials">
            {guide.credentials.map((credential) => (
              <li key={credential}>
                <span aria-hidden="true">✓</span>
                {credential}
              </li>
            ))}
          </ul>
          <p className="guide-languages">
            <strong>Языки:</strong> {guide.languages.join(', ')}
          </p>
        </section>

        <section className="guide-tours">
          <div className="section-heading">
            <span>МАРШРУТЫ ГИДА</span>
          </div>
          <div className="experience-grid">
            {guideExperiences.map((experience) => (
              <ExperienceCard experience={experience} key={experience.id} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
