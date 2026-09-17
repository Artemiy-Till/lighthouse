import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { getMaxPlatform } from '../platform/max/max-platform';
import { Icon, type IconName } from './Icon';

const navigation: readonly {
  readonly icon: IconName;
  readonly label: string;
  readonly to: string;
}[] = [
  { icon: 'home', label: 'Главная', to: '/' },
  { icon: 'map', label: 'Каталог', to: '/catalog' },
  { icon: 'heart', label: 'Избранное', to: '/favorites' },
  { icon: 'orders', label: 'Заказы', to: '/orders' },
  { icon: 'profile', label: 'Профиль', to: '/profile' },
];

export function AppLayout({ children }: { readonly children: ReactNode }) {
  const maxPlatform = getMaxPlatform();

  return (
    <div className="app-shell" id="top">
      {children}
      <nav aria-label="Основная навигация" className="bottom-navigation">
        {navigation.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `bottom-navigation__item${isActive ? ' is-active' : ''}`
            }
            end={item.to === '/'}
            key={item.to}
            to={item.to}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      {!maxPlatform.isAvailable ? (
        <span className="development-badge">Browser preview</span>
      ) : null}
    </div>
  );
}
