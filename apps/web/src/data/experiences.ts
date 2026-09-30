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

export interface ExperienceDetails {
  readonly children: string;
  readonly description: string;
  readonly format: string;
  readonly groupSize: string;
  readonly groupType: string;
  readonly highlights: readonly string[];
  readonly intro: string;
  readonly meetingPoint: string;
}

export const categories = [
  { emoji: '🚶', label: 'Обзорные' },
  { emoji: '🏛️', label: 'Музеи' },
  { emoji: '⛵', label: 'По воде' },
  { emoji: '🌙', label: 'Вечерние' },
  { emoji: '🍽️', label: 'Гастро' },
  { emoji: '👨‍👩‍👧', label: 'С детьми' },
] as const;

// Only experiences published through MAX are shown in the app.
export const experiences: readonly Experience[] = [];

export function getExperiencesForCity(cityId: CityId) {
  return experiences.filter((experience) => experience.cityId === cityId);
}

export function formatOfferCount(count: number) {
  if (count % 10 === 1 && count % 100 !== 11) return `${count} предложение`;
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return `${count} предложения`;
  }
  return `${count} предложений`;
}

export function getExperienceById(id: string) {
  return experiences.find((experience) => experience.id === id);
}

export function getExperienceDetails(
  _id: string,
): ExperienceDetails | undefined {
  return undefined;
}

export function getExperienceRestrictions(_id: string): readonly string[] {
  return [];
}
