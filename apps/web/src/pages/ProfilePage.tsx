import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { getBookings } from '../api/client';
import { AppLayout } from '../components/AppLayout';
import { Icon } from '../components/Icon';
import { useMaxConnection } from '../features/max/useMaxConnection';
import { useSettings } from '../features/settings/SettingsContext';
import { useTheme } from '../features/theme/ThemeContext';

function formatBookingDate(value: string) {
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}.${month}.${year}` : value;
}

export function ProfilePage() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useSettings();
  const { platform, session } = useMaxConnection();
  const isDark = theme === 'dark';
  const hasMaxLaunchData = Boolean(platform.isAvailable && platform.initData);
  const maxUser = session.data?.user;
  const initData = platform.initData ?? '';
  const bookings = useQuery({
    enabled: Boolean(initData && session.data?.authenticated),
    queryFn: () => getBookings(initData),
    queryKey: ['bookings'],
    retry: false,
  });
  const today = new Date().toISOString().slice(0, 10);
  const nextBooking = bookings.data?.items
    .filter((item) => item.status === 'confirmed' && item.date >= today)
    .sort((left, right) =>
      `${left.date}${left.time}`.localeCompare(`${right.date}${right.time}`),
    )[0];
  const displayName = maxUser
    ? [maxUser.firstName, maxUser.lastName].filter(Boolean).join(' ')
    : 'Артемий';
  const profileDescription = maxUser
    ? maxUser.username
      ? `@${maxUser.username}`
      : 'Профиль подтверждён через MAX'
    : hasMaxLaunchData
      ? session.isError
        ? 'Не удалось подтвердить профиль. Перезапустите мини-приложение.'
        : 'Проверяем данные профиля MAX…'
      : 'Откройте мини-приложение внутри MAX, чтобы войти автоматически.';
  const avatarFallback = displayName.trim().charAt(0).toUpperCase() || 'М';

  return (
    <AppLayout>
      <main className="secondary-page profile-page">
        <div className="profile-settings-header">
          <Link aria-label="На главную" to="/">
            <span aria-hidden="true">‹</span>
          </Link>
          <h1>Настройки</h1>
          <span aria-hidden="true" />
        </div>

        <header className="profile-card">
          {maxUser?.photoUrl ? (
            <img
              alt=""
              className="profile-avatar profile-avatar--image"
              src={maxUser.photoUrl}
            />
          ) : (
            <div aria-hidden="true" className="profile-avatar">
              {avatarFallback}
            </div>
          )}
          <div className="profile-card__copy">
            <h1>{displayName}</h1>
            <p className="profile-card__description">{profileDescription}</p>
          </div>
          {maxUser ? (
            <span
              aria-label="Профиль подтверждён"
              className="profile-card__verification"
            >
              <Icon name="check" />
            </span>
          ) : null}
        </header>

        {nextBooking ? (
          <section aria-labelledby="next-booking" className="booking-card">
            <div className="booking-card__topline">
              <span>Ближайшая прогулка</span>
              <strong>Подтверждено</strong>
            </div>
            <h2 id="next-booking">{nextBooking.title}</h2>
            <div className="booking-details">
              <div>
                <span>Дата:</span>
                <strong>{formatBookingDate(nextBooking.date)}</strong>
              </div>
              <div>
                <span>Время:</span>
                <strong>{nextBooking.time}</strong>
              </div>
            </div>
            <Link className="booking-card__action" to="/orders">
              Открыть заказ
            </Link>
          </section>
        ) : null}

        <section className="profile-settings-group">
          <h2>Основные настройки</h2>
          <div aria-label="Разделы профиля" className="profile-menu">
            <Link to="/professional">
              <span aria-hidden="true" className="profile-menu__icon">
                <Icon name="map" />
              </span>
              <span>
                <strong>{t('profile.guide')}</strong>
                <small>{t('profile.guideHint')}</small>
              </span>
              <span aria-hidden="true" className="profile-menu__arrow">
                ›
              </span>
            </Link>
            <Link to="/orders">
              <span aria-hidden="true" className="profile-menu__icon">
                <Icon name="orders" />
              </span>
              <span>
                <strong>{t('profile.orders')}</strong>
                <small>
                  {nextBooking ? t('profile.hasOrder') : t('profile.noOrders')}
                </small>
              </span>
              <span aria-hidden="true" className="profile-menu__arrow">
                ›
              </span>
            </Link>
            <button
              aria-checked={isDark}
              className="profile-theme-toggle"
              onClick={toggleTheme}
              role="switch"
              type="button"
            >
              <span aria-hidden="true" className="profile-menu__icon">
                <Icon name="moon" />
              </span>
              <span>
                <strong>{t('profile.theme')}</strong>
                <small>{isDark ? t('common.on') : t('common.off')}</small>
              </span>
              <span aria-hidden="true" className="theme-switch">
                <span />
              </span>
            </button>
            <Link to="/settings">
              <span aria-hidden="true" className="profile-menu__icon">
                <Icon name="settings" />
              </span>
              <span>
                <strong>{t('profile.settings')}</strong>
                <small>{t('profile.settingsHint')}</small>
              </span>
              <span aria-hidden="true" className="profile-menu__arrow">
                ›
              </span>
            </Link>
          </div>
        </section>

        <section className="profile-settings-group">
          <h2>Помощь</h2>
          <div className="profile-menu profile-menu--support">
            <button type="button">
              <span aria-hidden="true" className="profile-menu__icon">
                <Icon name="support" />
              </span>
              <span>
                <strong>Поддержка</strong>
                <small>Ответим в чате</small>
              </span>
              <span aria-hidden="true" className="profile-menu__arrow">
                ›
              </span>
            </button>
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
