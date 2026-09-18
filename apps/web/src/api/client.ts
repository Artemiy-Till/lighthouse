const DEFAULT_PRODUCTION_API_URL = 'https://lighthouse-api-lwsx.vercel.app';

const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const apiBaseUrl = configuredApiUrl
  ? configuredApiUrl.replace(/\/$/, '')
  : import.meta.env.DEV
    ? ''
    : DEFAULT_PRODUCTION_API_URL;

export interface MaxUser {
  readonly firstName: string;
  readonly id: string;
  readonly languageCode: string | null;
  readonly lastName: string | null;
  readonly photoUrl: string | null;
  readonly username: string | null;
}

export interface MaxSession {
  readonly authenticated: true;
  readonly user: MaxUser;
}

export type MaxIntegrationStatus =
  | {
      readonly bot: {
        readonly id: string;
        readonly name: string;
        readonly username: string | null;
      };
      readonly configured: true;
      readonly connected: true;
    }
  | {
      readonly configured: boolean;
      readonly connected: false;
      readonly reason: string;
    };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function authenticateMax(initData: string): Promise<MaxSession> {
  return request<MaxSession>('/auth/max', {
    body: JSON.stringify({ initData }),
    method: 'POST',
  });
}

export function getMaxIntegrationStatus(): Promise<MaxIntegrationStatus> {
  return request<MaxIntegrationStatus>('/integrations/max/status');
}
