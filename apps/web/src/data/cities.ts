export type CityId = 'kazan' | 'moscow' | 'saint-petersburg';

export interface City {
  readonly heroImage: string;
  readonly id: CityId;
  readonly name: string;
  readonly prepositionalName: string;
  readonly subtitle: string;
}

export const cities: readonly City[] = [
  {
    heroImage: '/images/saint-petersburg-hero.webp',
    id: 'saint-petersburg',
    name: 'Санкт-Петербург',
    prepositionalName: 'Петербурге',
    subtitle: 'Каналы, дворцы и белые ночи',
  },
  {
    heroImage: '/images/moscow-kremlin.webp',
    id: 'moscow',
    name: 'Москва',
    prepositionalName: 'Москве',
    subtitle: 'История, архитектура и большие прогулки',
  },
  {
    heroImage: '/images/kazan-kremlin.webp',
    id: 'kazan',
    name: 'Казань',
    prepositionalName: 'Казани',
    subtitle: 'Две культуры и тысячелетняя история',
  },
];
