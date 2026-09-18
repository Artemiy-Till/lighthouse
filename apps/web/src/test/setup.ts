import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

window.scrollTo = vi.fn();

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
  delete window.WebApp;
  delete document.documentElement.dataset.theme;
  document.documentElement.style.removeProperty('color-scheme');
});
