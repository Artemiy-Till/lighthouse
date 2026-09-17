import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { cities, type CityId } from '../data/cities';
import { useCity } from '../features/city/CityContext';

export function CitySelector() {
  const { city, selectCity } = useCity();
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
        aria-label={`Выбрать город. Сейчас ${city.name}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="location-button"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <span className="brand-mark">В</span>
        <span>
          <small>Ваш город</small>
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
                    <p className="section-kicker">Направление</p>
                    <h2 id="city-dialog-title">Выберите город</h2>
                  </div>
                  <button
                    aria-label="Закрыть выбор города"
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

                    return (
                      <button
                        aria-pressed={isSelected}
                        className={isSelected ? 'is-selected' : ''}
                        key={item.id}
                        onClick={() => handleSelect(item.id)}
                        type="button"
                      >
                        <span className="city-options__mark">
                          {isSelected ? '✓' : item.name.slice(0, 1)}
                        </span>
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.subtitle}</small>
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
