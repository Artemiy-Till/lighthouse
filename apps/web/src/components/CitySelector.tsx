import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { cities, type CityId } from '../data/cities';
import { formatOfferCount, getExperiencesForCity } from '../data/experiences';
import { useCity } from '../features/city/CityContext';
import { usePublishedExperiences } from '../features/marketplace/usePublishedExperiences';
import { useSettings } from '../features/settings/SettingsContext';

export function CitySelector() {
  const { city, selectCity } = useCity();
  const { language, t } = useSettings();
  const publishedExperiences = usePublishedExperiences();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const handleSelect = (id: CityId) => {
    selectCity(id);
    setIsOpen(false);
  };

  return (
    <>
      <button
        aria-label={`${t('city.choose')} ${city.name}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="location-button"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <img
          alt=""
          className="city-thumbnail"
          height="40"
          src={city.heroImage}
          width="40"
        />
        <span>
          <small>{t('city.your')}</small>
          <strong>{city.name}</strong>
        </span>
        <span aria-hidden="true" className="chevron">
          ⌄
        </span>
      </button>

      {isOpen
        ? createPortal(
            <div
              className="city-dialog-backdrop"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) setIsOpen(false);
              }}
              role="presentation"
            >
              <section
                aria-labelledby="city-dialog-title"
                aria-modal="true"
                className="city-dialog"
                role="dialog"
              >
                <div className="city-dialog__handle" />
                <header>
                  <div>
                    <p className="section-kicker">{t('city.destination')}</p>
                    <h2 id="city-dialog-title">{t('city.title')}</h2>
                  </div>
                  <button
                    aria-label={t('city.close')}
                    className="city-dialog__close"
                    onClick={() => setIsOpen(false)}
                    type="button"
                  >
                    ×
                  </button>
                </header>
                <div className="city-options">
                  {cities.map((item) => {
                    const isSelected = city.id === item.id;
                    const publishedOfferCount =
                      publishedExperiences.data?.items.filter(
                        (experience) => experience.cityId === item.id,
                      ).length ?? 0;
                    const offerCount =
                      getExperiencesForCity(item.id).length +
                      publishedOfferCount;

                    return (
                      <button
                        aria-label={`${item.name}. ${
                          language === 'en'
                            ? `${offerCount} experiences`
                            : formatOfferCount(offerCount)
                        }`}
                        aria-pressed={isSelected}
                        className={isSelected ? 'is-selected' : ''}
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        type="button"
                      >
                        <span className="city-options__thumbnail">
                          <img
                            alt=""
                            height="48"
                            loading="lazy"
                            src={item.heroImage}
                            width="48"
                          />
                          {isSelected ? (
                            <span aria-hidden="true">✓</span>
                          ) : null}
                        </span>
                        <span>
                          <strong>{item.name}</strong>
                          <small>
                            {language === 'en'
                              ? `${offerCount} experiences`
                              : formatOfferCount(offerCount)}
                          </small>
                        </span>
                        <span
                          aria-hidden="true"
                          className="city-options__arrow"
                        >
                          ›
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
