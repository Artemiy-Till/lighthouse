import { Link } from 'react-router-dom';

import { useSettings } from '../features/settings/SettingsContext';

export function ProfileBackLink() {
  const { t } = useSettings();

  return (
    <Link
      aria-label={t('navigation.backToProfile')}
      className="page-back-link"
      to="/profile"
    >
      <span aria-hidden="true" className="page-back-link__arrow">
        ←
      </span>
      <span>{t('nav.profile')}</span>
    </Link>
  );
}
