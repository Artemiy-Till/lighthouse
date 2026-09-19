import { useQuery } from '@tanstack/react-query';

import {
  getPublishedExperience,
  getPublishedExperiences,
  type PublishedExperience,
} from '../../api/client';
import { cities, type CityId } from '../../data/cities';
import type { Experience, ExperienceDetails } from '../../data/experiences';

function formatDuration(minutes: number, format: string) {
  const hours = minutes / 60;
  const value = Number.isInteger(hours)
    ? String(hours)
    : hours.toFixed(1).replace('.', ',');
  return `${value} ${hours === 1 ? 'час' : 'часа'} · ${format}`;
}

function cityImage(cityId: CityId) {
  return (
    cities.find((city) => city.id === cityId)?.heroImage ??
    '/images/saint-petersburg-hero.webp'
  );
}

export function toExperience(item: PublishedExperience): Experience {
  const reviews = item.reviewCount ?? 0;
  return {
    badge: 'Новая',
    category: item.category,
    cityId: item.cityId,
    duration: formatDuration(item.durationMinutes, item.format),
    id: item.id,
    image: item.photos[0] ?? cityImage(item.cityId),
    price: `от ${item.priceRub.toLocaleString('ru-RU')} ₽`,
    rating:
      reviews > 0
        ? (item.rating ?? 0).toLocaleString('ru-RU', {
            maximumFractionDigits: 2,
            minimumFractionDigits: 1,
          })
        : '0,0',
    reviews,
    title: item.title,
  };
}

export function toExperienceDetails(
  item: PublishedExperience,
): ExperienceDetails {
  return {
    children: item.children,
    description: item.description,
    format: item.format,
    groupSize: `До ${item.groupSize} человек`,
    groupType: item.groupType,
    highlights: item.highlights,
    intro: item.intro,
    meetingPoint: item.meetingPoint,
  };
}

export function usePublishedExperiences(cityId?: CityId) {
  return useQuery({
    queryFn: () => getPublishedExperiences(cityId),
    queryKey: ['published-experiences', cityId],
    retry: false,
    staleTime: 15_000,
  });
}

export function usePublishedExperience(id: string, enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: () => getPublishedExperience(id),
    queryKey: ['published-experience', id],
    retry: false,
  });
}
