import { type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

import {
  type TranslationKey,
  useSettings,
} from '../features/settings/SettingsContext';
import { getMaxPlatform } from '../platform/max/max-platform';
import { Icon, type IconName } from './Icon';

const navigation: readonly {
  readonly icon: IconName;
  readonly label: TranslationKey;
  readonly to: string;
}[] = [
  { icon: 'home', label: 'nav.home', to: '/' },
  { icon: 'map', label: 'nav.catalog', to: '/catalog' },
  { icon: 'heart', label: 'nav.favorites', to: '/favorites' },
  { icon: 'orders', label: 'nav.orders', to: '/orders' },
  { icon: 'profile', label: 'nav.profile', to: '/profile' },
];

export function AppLayout({ children }: { readonly children: ReactNode }) {
  const maxPlatform = getMaxPlatform();
  const { pathname } = useLocation();
  const { t } = useSettings();
  const activeNavigationIndex = navigation.findIndex(({ to }) =>
    to === '/'
      ? pathname === '/'
      : pathname === to || pathname.startsWith(`${to}/`),
  );

  return (
    <div className="app-shell" id="top">
      {children}
      <nav
        aria-label={t('nav.main')}
        className="bottom-navigation"
        data-active-index={
          activeNavigationIndex >= 0 ? activeNavigationIndex : undefined
        }
      >
        <span aria-hidden="true" className="bottom-navigation__indicator" />
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
            <span>{t(item.label)}</span>
          </NavLink>
        ))}
      </nav>
      {!maxPlatform.isAvailable ? (
        <span className="development-badge">Browser preview</span>
      ) : null}
    </div>
  );
}
