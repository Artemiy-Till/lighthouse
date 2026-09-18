import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { DatabaseService } from '../database/database.service.js';
import { MarketplaceService } from './marketplace.service.js';

const guideRow = {
  bio: 'Показываю город через его истории и людей.',
  created_at: new Date('2026-09-18T18:00:00.000Z'),
  display_name: 'Артемий',
  id: 'guide-1',
  max_user_id: '42',
};

describe('MarketplaceService', () => {
  it('upserts a professional profile using the verified MAX id', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [guideRow] });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    const result = await service.upsertGuideProfile(
      {
        firstName: 'Артемий',
        id: '42',
        languageCode: 'ru',
        lastName: null,
        photoUrl: null,
        username: null,
      },
      { bio: guideRow.bio, displayName: 'Артемий' },
    );

    expect(result.displayName).toBe('Артемий');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('on conflict'), [
      '42',
      'Артемий',
      guideRow.bio,
    ]);
  });

  it('requires a professional profile before publishing', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    await expect(
      service.createExperience('42', {
        category: 'Обзорные',
        childrenPolicy: 'Можно с детьми от 7 лет',
        cityId: 'kostroma',
        description:
          'Большая авторская прогулка по историческому центру города.',
        durationMinutes: 120,
        format: 'Пешком',
        groupSize: 10,
        intro: 'Главные истории города за два часа.',
        meetingPoint: 'У памятника на главной площади',
        priceRub: 1500,
        title: 'Первое знакомство с городом',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
