import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

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
  const { t } = useSettings();

  return (
    <div className="app-shell" id="top">
      {children}
      <nav aria-label={t('nav.main')} className="bottom-navigation">
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
