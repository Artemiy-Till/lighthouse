import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface CatalogFilterState {
  readonly duration: 'any' | 'long' | 'medium' | 'short';
  readonly format: 'any' | 'transport' | 'walking' | 'water';
  readonly maxPrice: number | null;
  readonly minRating: number | null;
}

export const emptyCatalogFilters: CatalogFilterState = {
  duration: 'any',
  format: 'any',
  maxPrice: null,
  minRating: null,
};

export function countActiveCatalogFilters(filters: CatalogFilterState) {
  return [
    filters.maxPrice !== null,
    filters.duration !== 'any',
    filters.format !== 'any',
    filters.minRating !== null,
  ].filter(Boolean).length;
}

interface CatalogFiltersProps {
  readonly onChange: (filters: CatalogFilterState) => void;
  readonly value: CatalogFilterState;
}

export function CatalogFilters({ onChange, value }: CatalogFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const activeCount = countActiveCatalogFilters(value);

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

  const openFilters = () => {
    setDraft(value);
    setIsOpen(true);
  };

  const applyFilters = () => {
    onChange(draft);
    setIsOpen(false);
  };

  const resetFilters = () => {
    setDraft(emptyCatalogFilters);
    onChange(emptyCatalogFilters);
    setIsOpen(false);
  };

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`catalog-filter-button${activeCount > 0 ? ' is-active' : ''}`}
        onClick={openFilters}
        type="button"
      >
        <span aria-hidden="true">☷</span>
        Фильтры
        {activeCount > 0 ? (
          <strong aria-label={`${activeCount} активных фильтра`}>
            {activeCount}
          </strong>
        ) : null}
      </button>

      {isOpen
        ? createPortal(
            <div
              className="catalog-filter-backdrop"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) setIsOpen(false);
              }}
              role="presentation"
            >
              <section
                aria-labelledby="catalog-filter-title"
                aria-modal="true"
                className="catalog-filter-dialog"
                role="dialog"
              >
                <div className="catalog-filter-dialog__handle" />
                <header>
                  <div>
                    <p className="section-kicker">Настройте выдачу</p>
                    <h2 id="catalog-filter-title">Фильтры</h2>
                  </div>
                  <button
                    aria-label="Закрыть фильтры"
                    className="catalog-filter-dialog__close"
                    onClick={() => setIsOpen(false)}
                    type="button"
                  >
                    ×
                  </button>
                </header>

                <fieldset className="catalog-filter-group">
                  <legend>Цена за человека</legend>
                  <div className="catalog-filter-options">
                    {[
                      { label: 'Любая', value: null },
                      { label: 'До 1 500 ₽', value: 1500 },
                      { label: 'До 2 000 ₽', value: 2000 },
                      { label: 'До 3 000 ₽', value: 3000 },
                    ].map((option) => (
                      <label key={option.label}>
                        <input
                          checked={draft.maxPrice === option.value}
                          name="price-filter"
                          onChange={() =>
                            setDraft({ ...draft, maxPrice: option.value })
                          }
                          type="radio"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="catalog-filter-group">
                  <legend>Длительность</legend>
                  <div className="catalog-filter-options">
                    {[
                      { label: 'Любая', value: 'any' },
                      { label: 'До 2 часов', value: 'short' },
                      { label: '2–3 часа', value: 'medium' },
                      { label: 'Более 3 часов', value: 'long' },
                    ].map((option) => (
                      <label key={option.value}>
                        <input
                          checked={draft.duration === option.value}
                          name="duration-filter"
                          onChange={() =>
                            setDraft({
                              ...draft,
                              duration:
                                option.value as CatalogFilterState['duration'],
                            })
                          }
                          type="radio"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="catalog-filter-group">
                  <legend>Формат</legend>
                  <div className="catalog-filter-options">
                    {[
                      { label: 'Любой', value: 'any' },
                      { label: 'Пешком', value: 'walking' },
                      { label: 'По воде', value: 'water' },
                      { label: 'На транспорте', value: 'transport' },
                    ].map((option) => (
                      <label key={option.value}>
                        <input
                          checked={draft.format === option.value}
                          name="format-filter"
                          onChange={() =>
                            setDraft({
                              ...draft,
                              format:
                                option.value as CatalogFilterState['format'],
                            })
                          }
                          type="radio"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="catalog-filter-group">
                  <legend>Рейтинг</legend>
                  <div className="catalog-filter-options catalog-filter-options--rating">
                    {[
                      { label: 'Любой', value: null },
                      { label: 'От 4,90', value: 4.9 },
                      { label: 'От 4,95', value: 4.95 },
                    ].map((option) => (
                      <label key={option.label}>
                        <input
                          checked={draft.minRating === option.value}
                          name="rating-filter"
                          onChange={() =>
                            setDraft({ ...draft, minRating: option.value })
                          }
                          type="radio"
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="catalog-filter-dialog__actions">
                  <button onClick={resetFilters} type="button">
                    Сбросить
                  </button>
                  <button onClick={applyFilters} type="button">
                    Показать варианты
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
