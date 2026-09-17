import { type CityId } from './cities';

export interface Experience {
  readonly badge?: string;
  readonly category: string;
  readonly cityId: CityId;
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
    cityId: 'saint-petersburg',
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
    cityId: 'saint-petersburg',
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
    cityId: 'saint-petersburg',
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
    cityId: 'saint-petersburg',
    duration: '5 часов · Мини-группа',
    id: 'kronstadt',
    image: '/images/kronstadt.webp',
    price: 'от 3 200 ₽',
    rating: '4,94',
    reviews: 96,
    title: 'Форты и маяки Кронштадта',
  },
  {
    badge: 'Хит',
    category: 'Обзорные',
    cityId: 'moscow',
    duration: '2,5 часа · Пешком',
    id: 'moscow-first-meeting',
    image: '/images/moscow-kremlin.webp',
    price: 'от 1 490 ₽',
    rating: '4,97',
    reviews: 412,
    title: 'Москва: первое знакомство',
  },
  {
    badge: 'Новинка',
    category: 'С детьми',
    cityId: 'moscow',
    duration: '2 часа · Пешком',
    id: 'moscow-modern-center',
    image: '/images/moscow-zaryadye.webp',
    price: 'от 1 700 ₽',
    rating: '4,89',
    reviews: 86,
    title: 'Москва будущего: парк и новый центр',
  },
  {
    badge: 'Бестселлер',
    category: 'Музеи',
    cityId: 'moscow',
    duration: '1,5 часа · Пешком',
    id: 'moscow-metro',
    image: '/images/moscow-metro.webp',
    price: 'от 1 350 ₽',
    rating: '4,95',
    reviews: 276,
    title: 'Подземные дворцы московского метро',
  },
  {
    category: 'Гастро',
    cityId: 'moscow',
    duration: '3 часа · Мини-группа',
    id: 'moscow-old-lanes',
    image: '/images/moscow-lanes.webp',
    price: 'от 2 600 ₽',
    rating: '4,92',
    reviews: 143,
    title: 'Старая Москва: переулки и чайные истории',
  },
  {
    badge: 'Хит',
    category: 'Обзорные',
    cityId: 'kazan',
    duration: '2 часа · Пешком',
    id: 'kazan-kremlin',
    image: '/images/kazan-kremlin.webp',
    price: 'от 1 290 ₽',
    rating: '4,98',
    reviews: 351,
    title: 'Казанский кремль и две культуры',
  },
  {
    badge: 'Авторская',
    category: 'Гастро',
    cityId: 'kazan',
    duration: '3 часа · Пешком',
    id: 'kazan-tatar-quarter',
    image: '/images/kazan-tatar-quarter.webp',
    price: 'от 2 300 ₽',
    rating: '4,96',
    reviews: 207,
    title: 'Старо-Татарская слобода со вкусом',
  },
  {
    category: 'С детьми',
    cityId: 'kazan',
    duration: '2 часа · Пешком',
    id: 'kazan-bauman-street',
    image: '/images/kazan-bauman.webp',
    price: 'от 1 450 ₽',
    rating: '4,9',
    reviews: 118,
    title: 'Улица Баумана: легенды старой Казани',
  },
  {
    badge: 'Вечером',
    category: 'По воде',
    cityId: 'kazan',
    duration: '1,5 часа · На теплоходе',
    id: 'kazan-river',
    image: '/images/kazan-river.webp',
    price: 'от 1 600 ₽',
    rating: '4,91',
    reviews: 164,
    title: 'Огни Казани с воды',
  },
];

export function getExperiencesForCity(cityId: CityId) {
  return experiences.filter((experience) => experience.cityId === cityId);
}
