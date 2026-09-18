import { describe, expect, it } from 'vitest';

import {
  experiences,
  getExperienceDetails,
  getExperienceRestrictions,
  getExperiencesForCity,
} from './experiences';
import { getGuideForCity } from './guides';

describe('experience catalog', () => {
  it.each([
    ['saint-petersburg', 4],
    ['moscow', 4],
    ['kazan', 4],
    ['kostroma', 4],
  ] as const)('%s contains %i experiences', (cityId, expectedCount) => {
    const cityExperiences = getExperiencesForCity(cityId);

    expect(cityExperiences).toHaveLength(expectedCount);
    expect(cityExperiences.every((item) => item.cityId === cityId)).toBe(true);
  });

  it('contains details for every experience', () => {
    expect(
      experiences.every((experience) => {
        const details = getExperienceDetails(experience.id);
        return details && details.highlights.length > 0;
      }),
    ).toBe(true);
  });

  it('assigns a guide to every experience', () => {
    expect(
      experiences.every((experience) => getGuideForCity(experience.cityId)),
    ).toBe(true);
  });

  it('contains relevant restrictions for every experience', () => {
    const restrictionSets = experiences.map((experience) =>
      getExperienceRestrictions(experience.id),
    );

    expect(
      restrictionSets.every((restrictions) => restrictions.length > 0),
    ).toBe(true);
    expect(
      new Set(restrictionSets.map((items) => items.join('|'))).size,
    ).toBeGreaterThan(8);
  });
});
