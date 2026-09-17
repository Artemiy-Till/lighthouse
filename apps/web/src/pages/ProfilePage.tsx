import { Link } from 'react-router-dom';

import { AppLayout } from '../components/AppLayout';

const profileMenu = [
  { icon: '💬', label: 'Поддержка', meta: 'Ответим в чате' },
  { icon: '⚙️', label: 'Настройки', meta: 'Язык и уведомления' },
] as const;

export function ProfilePage() {
  return (
    <AppLayout>
      <main className="secondary-page profile-page">
        <header className="profile-card">
          <div aria-hidden="true" className="profile-avatar">
            А
          </div>
          <div>
            <span className="profile-card__badge">Демо-профиль</span>
            <h1>Артемий</h1>
            <p>Данные пользователя MAX подключим на следующем этапе.</p>
          </div>
        </header>

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
          Сейчас это демонстрационные данные. После подключения MAX здесь будет
          отображаться реальный пользователь и его бронирования.
        </p>
      </main>
    </AppLayout>
  );
}
