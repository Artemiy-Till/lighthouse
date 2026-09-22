import { type ReactNode } from 'react';

export type IconName =
  | 'calendar'
  | 'check'
  | 'clock'
  | 'heart'
  | 'home'
  | 'map'
  | 'moon'
  | 'orders'
  | 'profile'
  | 'search'
  | 'settings'
  | 'support'
  | 'users'
  | 'wallet';

export function Icon({ name }: { readonly name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    calendar: (
      <>
        <path d="M6 2v3M14 2v3M3 8h14" />
        <rect height="15" rx="2" width="16" x="2" y="4" />
      </>
    ),
    check: <path d="m4 10 4 4 8-8" />,
    clock: (
      <>
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 5.5v5l3 2" />
      </>
    ),
    heart: (
      <path d="M17.4 4.6a4.5 4.5 0 0 0-6.4 0L10 5.7 8.9 4.6a4.5 4.5 0 0 0-6.3 6.4l1 1L10 18l6.4-6 1-1a4.5 4.5 0 0 0 0-6.4Z" />
    ),
    home: (
      <>
        <path d="m2 9 8-7 8 7" />
        <path d="M4 8v10h12V8M8 18v-6h4v6" />
      </>
    ),
    map: (
      <>
        <path d="m2 5 5-2 6 2 5-2v14l-5 2-6-2-5 2Z" />
        <path d="M7 3v14M13 5v14" />
      </>
    ),
    moon: <path d="M16.5 13.2A7 7 0 0 1 6.8 3.5a7 7 0 1 0 9.7 9.7Z" />,
    orders: (
      <>
        <path d="M4 2h12v16l-2-1.5L12 18l-2-1.5L8 18l-2-1.5L4 18Z" />
        <path d="M7 6h6M7 10h6M7 14h3" />
      </>
    ),
    profile: (
      <>
        <circle cx="10" cy="7" r="4" />
        <path d="M3 19c.6-4 3-6 7-6s6.4 2 7 6" />
      </>
    ),
    search: (
      <>
        <circle cx="9" cy="9" r="6" />
        <path d="m14 14 4 4" />
      </>
    ),
    settings: (
      <>
        <circle cx="10" cy="10" r="3" />
        <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M15.7 4.3l-1.4 1.4M5.7 14.3l-1.4 1.4" />
      </>
    ),
    support: (
      <>
        <path d="M3 4h14v10H8l-4 3v-3H3Z" />
        <path d="M7 9h.01M10 9h.01M13 9h.01" />
      </>
    ),
    users: (
      <>
        <circle cx="7" cy="7" r="3" />
        <circle cx="14.5" cy="8" r="2.5" />
        <path d="M1.5 17c.5-3.5 2.4-5.5 5.5-5.5s5 2 5.5 5.5M12 12.5c3-.8 5.8 1 6.5 4.5" />
      </>
    ),
    wallet: (
      <>
        <path d="M3 5.5h12.5A1.5 1.5 0 0 1 17 7v8.5H4.5A1.5 1.5 0 0 1 3 14Z" />
        <path d="M4.5 3h9v2.5M13 9h4v4h-4a2 2 0 0 1 0-4Z" />
      </>
    ),
  };

  return (
    <svg aria-hidden="true" className="icon" fill="none" viewBox="0 0 20 20">
      <g
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      >
        {paths[name]}
      </g>
    </svg>
  );
}
