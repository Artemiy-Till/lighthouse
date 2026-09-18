import { describe, expect, it } from 'vitest';

import {
  experiences,
  getExperienceDetails,
  getExperiencesForCity,
} from './experiences';

describe('experience catalog', () => {
  it.each([
    ['saint-petersburg', 4],
    ['moscow', 4],
    ['kazan', 4],
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
});
