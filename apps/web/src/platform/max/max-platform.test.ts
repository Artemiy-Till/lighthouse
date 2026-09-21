import { afterEach, describe, expect, it, vi } from 'vitest';

import { getMaxPlatform } from './max-platform';

describe('getMaxPlatform', () => {
  afterEach(() => {
    delete window.WebApp;
  });

  it('provides a safe browser fallback outside MAX', () => {
    const platform = getMaxPlatform();

    expect(platform.isAvailable).toBe(false);
    expect(platform.initData).toBeNull();
    expect(platform.platform).toBe('web');
  });

  it('exposes signed init data without parsing it as trusted data', () => {
    const openMaxLink = vi.fn();
    window.WebApp = {
      BackButton: {
        hide() {},
        offClick() {},
        onClick() {},
        show() {},
      },
      initData: 'auth_date=1&hash=signed',
      platform: 'ios',
      version: '26.20.0',
      openMaxLink,
      getViewportSize() {
        return Promise.resolve({ height: '800px', width: '390px' });
      },
    };

    const platform = getMaxPlatform();

    expect(platform.isAvailable).toBe(true);
    expect(platform.initData).toBe('auth_date=1&hash=signed');
    expect(platform.platform).toBe('ios');
    expect(platform.openMaxLink('https://max.ru/artemiy')).toBe(true);
    expect(openMaxLink).toHaveBeenCalledWith('https://max.ru/artemiy');
  });
});
