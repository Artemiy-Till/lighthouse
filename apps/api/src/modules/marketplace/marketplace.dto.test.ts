import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { UpsertGuideProfileDto } from './marketplace.dto.js';

function profileWith(maxUsername: string) {
  const profile = new UpsertGuideProfileDto();
  profile.bio = 'Профессиональный гид с большим опытом работы.';
  profile.displayName = 'Полина';
  profile.maxUsername = maxUsername;
  return profile;
}

describe('UpsertGuideProfileDto', () => {
  it('accepts a profile link copied from MAX', async () => {
    const errors = await validate(
      profileWith(
        'https://max.ru/u/f9LHodD0cOIPk8AoK_E_B-B36RTkRhkmXXOi99ryKmJwAsRLTzkaFpa-k2I',
      ),
    );

    expect(errors).toHaveLength(0);
  });

  it('rejects a profile link from another domain', async () => {
    const errors = await validate(profileWith('https://example.com/u/profile'));

    expect(errors.some((error) => error.property === 'maxUsername')).toBe(true);
  });
});
