import { describe, expect, it } from 'vitest';

import { cities } from './cities';
import { experiences, getExperiencesForCity } from './experiences';
import { guides } from './guides';

describe('experience catalog', () => {
  it('does not expose invented offers or guide profiles', () => {
    expect(experiences).toHaveLength(0);
    expect(guides).toHaveLength(0);
    for (const city of cities) {
      expect(getExperiencesForCity(city.id)).toHaveLength(0);
    }
  });
});
