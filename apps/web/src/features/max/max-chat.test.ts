import { describe, expect, it } from 'vitest';

import { getMaxUserChatUrl } from './max-chat';

describe('getMaxUserChatUrl', () => {
  it('keeps shared MAX profile paths navigable', () => {
    expect(
      getMaxUserChatUrl(
        '42',
        'u/f9LHodD0cOIPk8AoK_E_B-B36RTkRhkmXXOi99ryKmJwAsRLTzkaFpa-k2I',
      ),
    ).toBe(
      'https://max.ru/u/f9LHodD0cOIPk8AoK_E_B-B36RTkRhkmXXOi99ryKmJwAsRLTzkaFpa-k2I',
    );
  });

  it('still supports ordinary usernames', () => {
    expect(getMaxUserChatUrl('42', '@artemiy_guide')).toBe(
      'https://max.ru/artemiy_guide',
    );
  });
});
