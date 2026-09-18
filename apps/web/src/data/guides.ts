import { type CityId } from './cities';

export interface Guide {
  readonly about: string;
  readonly avatar: string;
  readonly cityIds: readonly CityId[];
  readonly credentials: readonly string[];
  readonly id: string;
  readonly languages: readonly string[];
  readonly name: string;
  readonly rating: string;
  readonly reviewCount: number;
  readonly tagline: string;
  readonly yearsExperience: number;
}

export const guides: readonly Guide[] = [
  {
    about:
      'Историк и городской исследователь. Люблю показывать знакомые места через детали, которые легко пропустить: архитектурные символы, судьбы жителей и живые городские истории.',
    avatar: '/images/guide-alexey.webp',
    cityIds: ['saint-petersburg', 'moscow'],
    credentials: [
      'Высшее историческое образование',
      'Аккредитованный городской гид',
      'Автор маршрутов по архитектуре',
    ],
    id: 'alexey-smirnov',
    languages: ['Русский', 'Английский'],
    name: 'Алексей Смирнов',
    rating: '4,96',
    reviewCount: 742,
    tagline: 'Историк и автор городских маршрутов',
    yearsExperience: 8,
  },
  {
    about:
      'Родилась и выросла в Казани. Рассказываю о городе через диалог культур, семейные истории и национальную кухню. На моих прогулках много общения и никаких заученных лекций.',
    avatar: '/images/guide-dilara.webp',
    cityIds: ['kazan'],
    credentials: [
      'Аккредитованный гид по Казани',
      'Специалист по истории Татарстана',
      'Автор семейных экскурсий',
    ],
    id: 'dilara-safiullina',
    languages: ['Русский', 'Татарский', 'Английский'],
    name: 'Диляра Сафиуллина',
    rating: '4,98',
    reviewCount: 536,
    tagline: 'Гид по истории и культуре Татарстана',
    yearsExperience: 7,
  },
  {
    about:
      'Живу в Костроме и исследую Русский Север. Показываю город без спешки: от купеческих площадей до деревянных улиц и волжских панорам. Особенно люблю семейные маршруты.',
    avatar: '/images/guide-elena.webp',
    cityIds: ['kostroma'],
    credentials: [
      'Аккредитованный гид по Костромской области',
      'Краевед и музейный педагог',
      'Автор маршрутов для семей с детьми',
    ],
    id: 'elena-volkova',
    languages: ['Русский', 'Английский'],
    name: 'Елена Волкова',
    rating: '4,97',
    reviewCount: 318,
    tagline: 'Краевед и знаток Русского Севера',
    yearsExperience: 9,
  },
];

export function getGuideById(id: string) {
  return guides.find((guide) => guide.id === id);
}

export function getGuideForCity(cityId: CityId) {
  return guides.find((guide) => guide.cityIds.includes(cityId));
}
