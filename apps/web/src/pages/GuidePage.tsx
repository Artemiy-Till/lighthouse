import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ExperienceCard } from '../components/ExperienceCard';
import { getPublishedExperiences } from '../api/client';
import { ThemeToggle } from '../components/ThemeToggle';
import { cities } from '../data/cities';
import { experiences } from '../data/experiences';
import { getGuideById } from '../data/guides';
import { toExperience } from '../features/marketplace/usePublishedExperiences';

export function GuidePage() {
  const { guideId = '' } = useParams();
  const navigate = useNavigate();
  const guide = getGuideById(guideId);
  const published = useQuery({
    queryFn: () => getPublishedExperiences(),
    queryKey: ['published-experiences'],
    retry: false,
    staleTime: 15_000,
  });
  const guideExperiences = (published.data?.items ?? []).filter(
    (experience) => experience.guide.id === guideId,
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [guideId]);

  if (!guide && published.isPending) {
    return <p className="compact-loading" role="status">Загрузка профиля гида</p>;
  }

  if (!guide && guideExperiences.length > 0) {
    const realGuide = guideExperiences[0]!.guide;
    const cityNames = [...new Set(guideExperiences.map((item) =>
      cities.find((city) => city.id === item.cityId)?.name,
    ))].filter(Boolean).join(' · ');

    return (
      <main className="guide-page">
        <header className="guide-page__topbar">
          <button aria-label="Вернуться назад" className="guide-page__back" onClick={() => void navigate(-1)} type="button">←</button>
          <strong>Профиль гида</strong>
          <ThemeToggle />
        </header>
        <section className="guide-profile">
          <div className="guide-profile__identity">
            {realGuide.photoUrl ? <img alt={`Гид ${realGuide.displayName}`} className="guide-profile__avatar" height="720" src={realGuide.photoUrl} width="720" /> : null}
            <div className="guide-profile__copy">
              <h1>{realGuide.displayName}<span aria-label="Личность подтверждена" className="guide-profile__verification-mark" role="img">✓</span></h1>
              <p className="guide-profile__cities">{cityNames}</p>
            </div>
          </div>
        </section>
        <div className="guide-page__content">
          <section className="guide-section"><h2>О гиде</h2><p>{realGuide.bio}</p></section>
          <section className="guide-tours">
            <div className="section-heading"><span>МАРШРУТЫ ГИДА</span></div>
            <div className="experience-grid">{guideExperiences.map((item) => <ExperienceCard experience={toExperience(item)} key={item.id} />)}</div>
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
