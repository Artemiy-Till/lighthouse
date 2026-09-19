import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useSettings } from '../features/settings/SettingsContext';

export interface CatalogFilterState {
  readonly children: 'any' | 'family';
  readonly duration: 'any' | 'long' | 'medium' | 'short';
  readonly format: 'any' | 'transport' | 'walking' | 'water';
  readonly maxPrice: number | null;
  readonly minPrice: number | null;
  readonly minRating: number | null;
}

export const emptyCatalogFilters: CatalogFilterState = {
  children: 'any',
  duration: 'any',
  format: 'any',
  maxPrice: null,
  minPrice: null,
  minRating: null,
};

export function countActiveCatalogFilters(filters: CatalogFilterState) {
  return [
    filters.maxPrice !== null || filters.minPrice !== null,
    filters.duration !== 'any',
    filters.format !== 'any',
    filters.minRating !== null,
    filters.children !== 'any',
  ].filter(Boolean).length;
}

interface CatalogFiltersProps {
  readonly getResultCount: (filters: CatalogFilterState) => number;
  readonly onChange: (filters: CatalogFilterState) => void;
  readonly value: CatalogFilterState;
}

export function CatalogFilters({
  getResultCount,
  onChange,
  value,
}: CatalogFiltersProps) {
  const { language, t } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const activeCount = countActiveCatalogFilters(value);
  const draftResultCount = getResultCount(draft);

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
        {t('filter.button')}
        {activeCount > 0 ? (
          <strong aria-label={`${activeCount} ${t('filter.active')}`}>
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
                    <p className="section-kicker">{t('filter.kicker')}</p>
                    <h2 id="catalog-filter-title">{t('filter.button')}</h2>
                  </div>
                  <button
                    aria-label={t('filter.close')}
                    className="catalog-filter-dialog__close"
                    onClick={() => setIsOpen(false)}
                    type="button"
                  >
                    ×
                  </button>
                </header>

                <fieldset className="catalog-filter-group">
                  <legend>₽ {t('filter.price')}</legend>
                  <div className="catalog-filter-price-inputs">
                    <label>
                      <span>{language === 'en' ? 'From' : 'От'}</span>
                      <input
                        inputMode="numeric"
                        min={0}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            minPrice: event.target.value
                              ? Number(event.target.value)
                              : null,
                          })
                        }
                        placeholder="0"
                        type="number"
                        value={draft.minPrice ?? ''}
                      />
                    </label>
                    <label>
                      <span>{language === 'en' ? 'To' : 'До'}</span>
                      <input
                        inputMode="numeric"
                        min={0}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            maxPrice: event.target.value
                              ? Number(event.target.value)
                              : null,
                          })
                        }
                        placeholder={language === 'en' ? 'No limit' : 'Без лимита'}
                        type="number"
                        value={draft.maxPrice ?? ''}
                      />
                    </label>
                  </div>
                  <div
                    aria-label={language === 'en' ? 'Quick price' : 'Быстрая цена'}
                    className="catalog-filter-presets"
                  >
                    {[1500, 3000, 5000].map((price) => (
                      <button
                        aria-label={`${language === 'en' ? 'Up to' : 'До'} ${price.toLocaleString('ru-RU')} ₽`}
                        className={draft.maxPrice === price ? 'is-active' : ''}
                        key={price}
                        onClick={() =>
                          setDraft({ ...draft, maxPrice: price, minPrice: null })
                        }
                        type="button"
                      >
                        ≤ {price.toLocaleString('ru-RU')} ₽
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="catalog-filter-group">
                  <legend>◷ {t('filter.duration')}</legend>
                  <div className="catalog-filter-options">
                    {[
                      { label: t('filter.anyFeminine'), value: 'any' },
                      { label: t('filter.under2h'), value: 'short' },
                      { label: t('filter.twoThreeH'), value: 'medium' },
                      { label: t('filter.over3h'), value: 'long' },
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
                  <legend>⌖ {t('filter.format')}</legend>
                  <div className="catalog-filter-options">
                    {[
                      { label: t('filter.anyMasculine'), value: 'any' },
                      { label: t('filter.walking'), value: 'walking' },
                      { label: t('filter.water'), value: 'water' },
                      { label: t('filter.transport'), value: 'transport' },
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
                  <legend>★ {t('filter.rating')}</legend>
                  <div className="catalog-filter-options catalog-filter-options--rating">
                    {[
                      { label: t('filter.anyMasculine'), value: null },
                      { label: '4,0+', value: 4 },
                      { label: '4,5+', value: 4.5 },
                      { label: '4,8+', value: 4.8 },
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

                <fieldset className="catalog-filter-group">
                  <legend>☀ {t('filter.children')}</legend>
                  <div className="catalog-filter-options">
                    {[
                      { label: t('filter.doesNotMatter'), value: 'any' },
                      { label: t('filter.family'), value: 'family' },
                    ].map((option) => (
                      <label key={option.value}>
                        <input
                          checked={draft.children === option.value}
                          name="children-filter"
                          onChange={() =>
                            setDraft({
                              ...draft,
                              children:
                                option.value as CatalogFilterState['children'],
                            })
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
                    {t('filter.reset')}
                  </button>
                  <button
                    aria-label={t('date.show')}
                    disabled={draftResultCount === 0}
                    onClick={applyFilters}
                    type="button"
                  >
                    {draftResultCount === 0
                      ? language === 'en'
                        ? 'No matches'
                        : 'Ничего не найдено'
                      : language === 'en'
                        ? `Show ${draftResultCount}`
                        : `Показать · ${draftResultCount}`}
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
