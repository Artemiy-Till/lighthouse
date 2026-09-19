import { useSettings } from '../features/settings/SettingsContext';
import { useTheme } from '../features/theme/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useSettings();
  const isDark = theme === 'dark';

  return (
    <button
      aria-label={isDark ? t('theme.toLight') : t('theme.toDark')}
      aria-pressed={isDark}
      className="topbar-action theme-toggle"
      onClick={toggleTheme}
      type="button"
    >
      <span aria-hidden="true">{isDark ? '☀' : '☾'}</span>
    </button>
  );
}
