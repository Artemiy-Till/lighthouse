import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { UpsertGuideProfileDto } from './marketplace.dto.js';

describe('UpsertGuideProfileDto', () => {
  it('accepts guide details without a manually entered MAX link', async () => {
    const profile = new UpsertGuideProfileDto();
    profile.bio = 'Профессиональный гид с большим опытом работы.';
    profile.displayName = 'Полина';

    await expect(validate(profile)).resolves.toHaveLength(0);
  });

  it('validates the public guide details', async () => {
    const profile = new UpsertGuideProfileDto();
    profile.bio = 'Коротко';
    profile.displayName = 'П';

    const errors = await validate(profile);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['bio', 'displayName']),
    );
  });
});
