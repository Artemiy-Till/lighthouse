import { type ReactNode } from 'react';

export type IconName =
  | 'bell'
  | 'calendar'
  | 'heart'
  | 'home'
  | 'map'
  | 'orders'
  | 'profile'
  | 'search';

export function Icon({ name }: { readonly name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    bell: (
      <>
        <path d="M4 14h12l-1.5-2V8a4.5 4.5 0 0 0-9 0v4Z" />
        <path d="M8 17h4" />
      </>
    ),
    calendar: (
      <>
        <path d="M6 2v3M14 2v3M3 8h14" />
        <rect height="15" rx="2" width="16" x="2" y="4" />
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
