import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { useSettings } from '../features/settings/SettingsContext';
import { Icon } from './Icon';

interface DateSelectorProps {
  readonly defaultLabel?: string;
  readonly onChange: (date: string | null) => void;
  readonly value: string | null;
}

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getNextSaturday(date: Date) {
  const daysUntilSaturday = (6 - date.getDay() + 7) % 7;
  return addDays(date, daysUntilSaturday);
}

function formatDate(value: string, locale: string) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year!, month! - 1, day);
  const includeYear = year !== new Date().getFullYear();

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    ...(includeYear ? { year: 'numeric' } : {}),
  }).format(date);
}

export function DateSelector({
  defaultLabel,
  onChange,
  value,
}: DateSelectorProps) {
  const { language, t } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(value ?? '');
  const today = useMemo(() => new Date(), []);
  const quickDates = useMemo(
    () => [
      { label: t('date.today'), value: toLocalIsoDate(today) },
      { label: t('date.tomorrow'), value: toLocalIsoDate(addDays(today, 1)) },
      {
        label: t('date.weekend'),
        value: toLocalIsoDate(getNextSaturday(today)),
      },
    ],
    [t, today],
  );

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

  const openSelector = () => {
    setDraftDate(value ?? '');
    setIsOpen(true);
  };

  const applyDate = () => {
    if (!draftDate) return;
    onChange(draftDate);
    setIsOpen(false);
  };

  const clearDate = () => {
    onChange(null);
    setDraftDate('');
    setIsOpen(false);
  };

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`date-button${value ? ' date-button--selected' : ''}`}
        onClick={openSelector}
        type="button"
      >
        <Icon name="calendar" />
        <span>
          {value
            ? formatDate(value, language === 'en' ? 'en-US' : 'ru-RU')
            : (defaultLabel ?? t('date.any'))}
        </span>
      </button>

      {isOpen
        ? createPortal(
            <div
              className="date-dialog-backdrop"
              onMouseDown={(event) => {
                if (event.currentTarget === event.target) setIsOpen(false);
              }}
              role="presentation"
            >
              <section
                aria-labelledby="date-dialog-title"
                aria-modal="true"
                className="date-dialog"
                role="dialog"
              >
                <div className="date-dialog__handle" />
                <header>
                  <div>
                    <p className="section-kicker">{t('date.kicker')}</p>
                    <h2 id="date-dialog-title">{t('date.title')}</h2>
                  </div>
                  <button
                    aria-label={t('date.close')}
                    className="date-dialog__close"
                    onClick={() => setIsOpen(false)}
                    type="button"
                  >
                    ×
                  </button>
                </header>

                <div
                  aria-label={t('date.quick')}
                  className="date-quick-options"
                >
                  {quickDates.map((option) => (
                    <button
                      aria-pressed={draftDate === option.value}
                      className={
                        draftDate === option.value ? 'is-selected' : ''
                      }
                      key={option.label}
                      onClick={() => setDraftDate(option.value)}
                      type="button"
                    >
                      <strong>{option.label}</strong>
                      <span>
                        {formatDate(
                          option.value,
                          language === 'en' ? 'en-US' : 'ru-RU',
                        )}
                      </span>
                    </button>
                  ))}
                </div>

                <label className="date-input-field">
                  <span>{t('date.calendar')}</span>
                  <input
                    min={toLocalIsoDate(today)}
                    onChange={(event) => setDraftDate(event.target.value)}
                    type="date"
                    value={draftDate}
                  />
                </label>

                <div className="date-dialog__actions">
                  <button
                    className="date-dialog__reset"
                    onClick={clearDate}
                    type="button"
                  >
                    {t('date.any')}
                  </button>
                  <button
                    className="date-dialog__apply"
                    disabled={!draftDate}
                    onClick={applyDate}
                    type="button"
                  >
                    {t('date.show')}
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
