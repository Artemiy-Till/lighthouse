import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { ExperienceCard } from '../components/ExperienceCard';
import { ThemeToggle } from '../components/ThemeToggle';
import { cities } from '../data/cities';
import { experiences } from '../data/experiences';
import { getGuideById } from '../data/guides';

export function GuidePage() {
  const { guideId = '' } = useParams();
  const navigate = useNavigate();
  const guide = getGuideById(guideId);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [guideId]);

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
        <img
          alt={`Гид ${guide.name}`}
          className="guide-profile__avatar"
          height="720"
          src={guide.avatar}
          width="720"
        />
        <h1>{guide.name}</h1>
        <p className="guide-profile__verified">✓ Личность подтверждена</p>
        <p className="guide-profile__tagline">{guide.tagline}</p>
        <p className="guide-profile__cities">{cityNames}</p>

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
