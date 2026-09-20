import { AppLayout } from '../components/AppLayout';
import { ProfileBackLink } from '../components/ProfileBackLink';
import { useSettings } from '../features/settings/SettingsContext';
import { useTheme } from '../features/theme/ThemeContext';

interface ToggleRowProps {
  readonly checked: boolean;
  readonly hint: string;
  readonly label: string;
  readonly onChange: (value: boolean) => void;
}

function ToggleRow({ checked, hint, label, onChange }: ToggleRowProps) {
  return (
    <button
      aria-checked={checked}
      className="settings-option settings-option--toggle"
      onClick={() => onChange(!checked)}
      role="switch"
      type="button"
    >
      <span className="settings-option__copy">
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <span aria-hidden="true" className="settings-toggle">
        <span />
      </span>
    </button>
  );
}

export function SettingsPage() {
  const {
    bookingReminders,
    guideMessages,
    language,
    offers,
    setBookingReminders,
    setGuideMessages,
    setLanguage,
    setOffers,
    t,
  } = useSettings();
  const { setTheme, theme } = useTheme();

  return (
    <AppLayout>
      <main className="secondary-page settings-page">
        <ProfileBackLink />
        <header className="secondary-header">
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </header>

        <section className="settings-section">
          <h2>{t('settings.interface')}</h2>
          <div className="settings-option">
            <span className="settings-option__copy">
              <strong>{t('settings.language')}</strong>
            </span>
            <div
              aria-label={t('settings.language')}
              className="settings-segmented"
              role="group"
            >
              <button
                aria-pressed={language === 'ru'}
                onClick={() => setLanguage('ru')}
                type="button"
              >
                RU
              </button>
              <button
                aria-pressed={language === 'en'}
                onClick={() => setLanguage('en')}
                type="button"
              >
                EN
              </button>
            </div>
          </div>
          <div className="settings-option">
            <span className="settings-option__copy">
              <strong>{t('settings.appearance')}</strong>
            </span>
            <div
              aria-label={t('settings.appearance')}
              className="settings-segmented"
              role="group"
            >
              <button
                aria-pressed={theme === 'light'}
                onClick={() => setTheme('light')}
                type="button"
              >
                {t('settings.light')}
              </button>
              <button
                aria-pressed={theme === 'dark'}
                onClick={() => setTheme('dark')}
                type="button"
              >
                {t('settings.dark')}
              </button>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2>{t('settings.notifications')}</h2>
          <ToggleRow
            checked={bookingReminders}
            hint={t('settings.remindersHint')}
            label={t('settings.reminders')}
            onChange={setBookingReminders}
          />
          <ToggleRow
            checked={guideMessages}
            hint={t('settings.messagesHint')}
            label={t('settings.messages')}
            onChange={setGuideMessages}
          />
          <ToggleRow
            checked={offers}
            hint={t('settings.offersHint')}
            label={t('settings.offers')}
            onChange={setOffers}
          />
        </section>

        <p className="settings-saved">✓ {t('settings.saved')}</p>
      </main>
    </AppLayout>
  );
}
