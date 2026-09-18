import { Link } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';
import { useMaxConnection } from '../features/max/useMaxConnection';
import { useTheme } from '../features/theme/ThemeContext';

const profileMenu = [
  { icon: '💬', label: 'Поддержка', meta: 'Ответим в чате' },
  { icon: '⚙️', label: 'Настройки', meta: 'Язык и уведомления' },
] as const;

export function ProfilePage() {
  const { theme, toggleTheme } = useTheme();
  const { integration, platform, session } = useMaxConnection();
  const isDark = theme === 'dark';
  const hasMaxLaunchData = Boolean(platform.isAvailable && platform.initData);
  const maxUser = session.data?.user;
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
          <div>
            <span className="profile-card__badge">
              {maxUser ? 'Профиль MAX' : 'Демо-профиль'}
            </span>
            <h1>{displayName}</h1>
            <p>{profileDescription}</p>
          </div>
        </header>

        <section
          aria-live="polite"
          className={`max-connection ${
            integration.data?.connected ? 'is-connected' : ''
          }`}
        >
          <span aria-hidden="true" className="max-connection__indicator" />
          <div>
            <strong>
              {integration.isPending
                ? 'Проверяем подключение…'
                : integration.data?.connected
                  ? 'Сервис MAX подключён'
                  : 'Сервис MAX временно недоступен'}
            </strong>
            <small>
              {integration.data?.connected
                ? `Бот ${integration.data.bot.name} готов к работе`
                : 'Профиль и бронирования продолжат работать в демо-режиме'}
            </small>
          </div>
        </section>

        <section aria-labelledby="next-booking" className="booking-card">
          <div className="booking-card__topline">
            <span>Ближайшая прогулка</span>
            <strong>Подтверждено</strong>
          </div>
          <h2 id="next-booking">Петербург: первое знакомство</h2>
          <div className="booking-details">
            <div>
              <span>Дата</span>
              <strong>21 сентября, 12:00</strong>
            </div>
            <div>
              <span>Участники</span>
              <strong>2 взрослых</strong>
            </div>
          </div>
          <Link className="booking-card__action" to="/orders">
            Открыть заказ
          </Link>
        </section>

        <section aria-label="Разделы профиля" className="profile-menu">
          <Link to="/orders">
            <span aria-hidden="true" className="profile-menu__icon">
              🎟️
            </span>
            <span>
              <strong>Мои заказы</strong>
              <small>1 предстоящий</small>
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
              {isDark ? '🌙' : '☀️'}
            </span>
            <span>
              <strong>Тёмная тема</strong>
              <small>{isDark ? 'Включена' : 'Выключена'}</small>
            </span>
            <span aria-hidden="true" className="theme-switch">
              <span />
            </span>
          </button>
          {profileMenu.map((item) => (
            <button key={item.label} type="button">
              <span aria-hidden="true" className="profile-menu__icon">
                {item.icon}
              </span>
              <span>
                <strong>{item.label}</strong>
                <small>{item.meta}</small>
              </span>
              <span aria-hidden="true" className="profile-menu__arrow">
                ›
              </span>
            </button>
          ))}
        </section>

        <p className="prototype-caption">
          {maxUser
            ? 'Профиль подтверждён подписанными данными запуска MAX. Бронирования пока демонстрационные.'
            : 'Бронирования пока демонстрационные. Данные профиля появятся автоматически при запуске внутри MAX.'}
        </p>
      </main>
    </AppLayout>
  );
}
