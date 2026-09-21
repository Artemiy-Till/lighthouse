export type MaxClientPlatform =
  'android' | 'desktop' | 'ios' | 'web' | 'unknown';

interface MaxBackButton {
  hide(): void;
  offClick(callback: () => void): void;
  onClick(callback: () => void): void;
  show(): void;
}

interface MaxWebApp {
  readonly BackButton: MaxBackButton;
  readonly initData: string;
  readonly platform: Exclude<MaxClientPlatform, 'unknown'>;
  readonly version: string;
  getViewportSize(): Promise<{ height: string; width: string }>;
  openMaxLink?(url: string): void;
}

declare global {
  interface Window {
    WebApp?: MaxWebApp;
  }
}

export interface MaxPlatform {
  readonly initData: string | null;
  readonly isAvailable: boolean;
  readonly platform: MaxClientPlatform;
  readonly version: string | null;
  getViewportSize(): Promise<{ height: string; width: string } | null>;
  hideBackButton(): void;
  openMaxLink(url: string): boolean;
  showBackButton(callback: () => void): () => void;
}

function createBrowserPlatform(): MaxPlatform {
  return {
    initData: null,
    isAvailable: false,
    platform: 'web',
    version: null,
    getViewportSize() {
      return Promise.resolve({
        height: `${window.innerHeight}px`,
        width: `${window.innerWidth}px`,
      });
    },
    hideBackButton() {},
    openMaxLink() {
      return false;
    },
    showBackButton() {
      return () => undefined;
    },
  };
}

export function getMaxPlatform(): MaxPlatform {
  const webApp = window.WebApp;

  if (!webApp) {
    return createBrowserPlatform();
  }

  return {
    initData: webApp.initData,
    isAvailable: true,
    platform: webApp.platform,
    version: webApp.version,
    getViewportSize: () => webApp.getViewportSize(),
    hideBackButton: () => webApp.BackButton.hide(),
    openMaxLink(url) {
      if (!webApp.openMaxLink) return false;
      webApp.openMaxLink(url);
      return true;
    },
    showBackButton(callback) {
      webApp.BackButton.onClick(callback);
      webApp.BackButton.show();

      return () => {
        webApp.BackButton.offClick(callback);
        webApp.BackButton.hide();
      };
    },
  };
}
