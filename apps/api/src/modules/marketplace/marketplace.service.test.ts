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
  photo_url: 'https://example.com/artemiy.jpg',
};

const experienceRow = {
  category: 'Обзорные' as const,
  children_policy: 'Можно с детьми от 7 лет',
  city_id: 'kostroma',
  created_at: new Date('2026-09-18T19:00:00.000Z'),
  description: 'Большая авторская прогулка по историческому центру города.',
  duration_minutes: 120,
  format: 'Пешком',
  group_size: 10,
  guide_bio: guideRow.bio,
  guide_id: guideRow.id,
  guide_name: guideRow.display_name,
  guide_photo_url: guideRow.photo_url,
  id: 'experience-1',
  intro: 'Главные истории города за два часа.',
  meeting_point: 'У памятника на главной площади',
  photo_urls: ['https://example.com/photo.jpg'],
  price_rub: 1700,
  title: 'Обновлённое знакомство с городом',
};

describe('MarketplaceService', () => {
  it('creates a confirmed booking with a server-calculated total', async () => {
    const bookingRow = {
      booking_date: '2026-10-10',
      booking_time: '12:00:00',
      city_id: 'kostroma',
      created_at: new Date('2026-09-19T09:00:00.000Z'),
      experience_id: 'experience-1',
      id: 'booking-1',
      image_url: 'https://example.com/photo.jpg',
      meeting_point: experienceRow.meeting_point,
      participants: 2,
      status: 'confirmed' as const,
      title: experienceRow.title,
      total_price_rub: 3400,
      unit_price_rub: 1700,
    };
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [experienceRow] })
      .mockResolvedValueOnce({ rows: [bookingRow] });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    const result = await service.createBooking('42', {
      cityId: 'kostroma',
      date: '2026-10-10',
      experienceId: 'experience-1',
      groupSize: 99,
      imageUrl: 'https://untrusted.example/image.jpg',
      meetingPoint: 'Untrusted meeting point',
      participants: 2,
      priceRub: 1,
      time: '12:00',
      title: 'Untrusted title',
    });

    expect(result.totalPriceRub).toBe(3400);
    expect(query.mock.calls[5]?.[1]).toEqual(
      expect.arrayContaining([
        'experience-1',
        '2026-10-10',
        '12:00',
        '42',
        experienceRow.title,
        1700,
      ]),
    );
  });

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
        photoUrl: guideRow.photo_url,
        username: null,
      },
      { bio: guideRow.bio, displayName: 'Артемий' },
    );

    expect(result.displayName).toBe('Артемий');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('on conflict'), [
      '42',
      'Артемий',
      guideRow.bio,
      guideRow.photo_url,
    ]);
    expect(result.photoUrl).toBe(guideRow.photo_url);
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
        photoUrls: ['https://example.com/photo.jpg'],
        priceRub: 1500,
        title: 'Первое знакомство с городом',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates an experience through its verified guide profile', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [guideRow] })
      .mockResolvedValueOnce({ rows: [experienceRow] });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    const result = await service.updateExperience('42', 'experience-1', {
      category: experienceRow.category,
      childrenPolicy: experienceRow.children_policy,
      cityId: 'kostroma',
      description: experienceRow.description,
      durationMinutes: experienceRow.duration_minutes,
      format: experienceRow.format,
      groupSize: experienceRow.group_size,
      intro: experienceRow.intro,
      meetingPoint: experienceRow.meeting_point,
      photoUrls: experienceRow.photo_urls,
      priceRub: experienceRow.price_rub,
      title: experienceRow.title,
    });

    expect(result.title).toBe('Обновлённое знакомство с городом');
    expect(query.mock.calls[3]?.[1]).toEqual([
      'experience-1',
      'guide-1',
      'kostroma',
      'Обзорные',
      experienceRow.title,
      experienceRow.intro,
      experienceRow.description,
      120,
      'Пешком',
      10,
      experienceRow.children_policy,
      experienceRow.meeting_point,
      1700,
      experienceRow.photo_urls,
      'Артемий',
      guideRow.bio,
      guideRow.photo_url,
    ]);
    expect(result.guide.photoUrl).toBe(guideRow.photo_url);
  });

  it('deletes only an experience owned by the verified guide', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ id: 'experience-1' }],
    });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    await expect(
      service.deleteExperience('42', 'experience-1'),
    ).resolves.toEqual({ deleted: true, id: 'experience-1' });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('g.max_user_id = $2'),
      ['experience-1', '42'],
    );
  });

  it('does not disclose or delete an experience owned by another guide', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    await expect(
      service.deleteExperience('other-user', 'experience-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
