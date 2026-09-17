export interface Experience {
  readonly badge?: string;
  readonly category: string;
  readonly duration: string;
  readonly id: string;
  readonly image: string;
  readonly price: string;
  readonly rating: string;
  readonly reviews: number;
  readonly title: string;
}

export const categories = [
  { emoji: '🚶', label: 'Обзорные' },
  { emoji: '🏛️', label: 'Музеи' },
  { emoji: '⛵', label: 'По воде' },
  { emoji: '🌙', label: 'Вечерние' },
  { emoji: '🍽️', label: 'Гастро' },
  { emoji: '👨‍👩‍👧', label: 'С детьми' },
] as const;

export const experiences: readonly Experience[] = [
  {
    badge: 'Хит',
    category: 'Обзорные',
    duration: '2 часа · Пешком',
    id: 'first-meeting',
    image: '/images/saint-petersburg-hero.webp',
    price: 'от 1 290 ₽',
    rating: '4,96',
    reviews: 328,
    title: 'Петербург: первое знакомство',
  },
  {
    badge: 'Авторская',
    category: 'Музеи',
    duration: '1,5 часа · Пешком',
    id: 'hidden-courtyards',
    image: '/images/hidden-courtyards.webp',
    price: 'от 1 800 ₽',
    rating: '4,91',
    reviews: 184,
    title: 'Дворы, парадные и старые истории',
  },
  {
    badge: 'Сегодня',
    category: 'Вечерние',
    duration: '1,5 часа · На катере',
    id: 'drawbridges',
    image: '/images/drawbridges.webp',
    price: 'от 1 590 ₽',
    rating: '4,88',
    reviews: 517,
    title: 'Разводные мосты с воды',
  },
  {
    category: 'По воде',
    duration: '5 часов · Мини-группа',
    id: 'kronstadt',
    image: '/images/kronstadt.webp',
    price: 'от 3 200 ₽',
    rating: '4,94',
    reviews: 96,
    title: 'Форты и маяки Кронштадта',
  },
];
