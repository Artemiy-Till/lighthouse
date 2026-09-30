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

// Guide profiles come from publications made by MAX users.
export const guides: readonly Guide[] = [];

export function getGuideById(id: string) {
  return guides.find((guide) => guide.id === id);
}

export function getGuideForCity(cityId: CityId) {
  return guides.find((guide) => guide.cityIds.includes(cityId));
}
