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
  max_username: 'artemiy',
  photo_url: 'https://example.com/artemiy.jpg',
};

const maxUser = {
  firstName: 'Артемий',
  id: '42',
  languageCode: 'ru',
  lastName: null,
  photoUrl: 'https://example.com/artemiy.jpg',
  username: 'artemiy',
} as const;

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
  is_own: false,
  meeting_point: 'У памятника на главной площади',
  photo_urls: ['https://example.com/photo.jpg'],
  price_rub: 1700,
  rating_avg: 0,
  review_count: 0,
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
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [experienceRow] })
      .mockResolvedValueOnce({ rows: [bookingRow] });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    const result = await service.createBooking(maxUser, {
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
    expect(query.mock.calls[7]?.[1]).toEqual(['experience-1', '42']);
    expect(query.mock.calls[8]?.[1]).toEqual(
      expect.arrayContaining([
        'experience-1',
        '2026-10-10',
        '12:00',
        '42',
        'artemiy',
        'Артемий',
        experienceRow.title,
        1700,
      ]),
    );
    expect(query.mock.calls[8]?.[1]).toHaveLength(13);
  });

  it('does not let a guide book their own published experience', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ ...experienceRow, is_own: true }],
      });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    await expect(
      service.createBooking(maxUser, {
        cityId: 'kostroma',
        date: '2026-10-10',
        experienceId: 'experience-1',
        groupSize: 10,
        imageUrl: experienceRow.photo_urls[0]!,
        meetingPoint: experienceRow.meeting_point,
        participants: 1,
        priceRub: experienceRow.price_rub,
        time: '12:00',
        title: experienceRow.title,
      }),
    ).rejects.toThrow('A guide cannot book their own experience');
  });

  it('creates a booking when the optional guest-name column is not migrated yet', async () => {
    const bookingRow = {
      booking_date: '2026-10-10',
      booking_time: '12:00:00',
      city_id: 'kostroma',
      created_at: new Date('2026-09-19T09:00:00.000Z'),
      experience_id: 'experience-1',
      id: 'booking-legacy-schema',
      image_url: 'https://example.com/photo.jpg',
      meeting_point: experienceRow.meeting_point,
      participants: 1,
      status: 'confirmed' as const,
      title: experienceRow.title,
      total_price_rub: 1700,
      unit_price_rub: 1700,
    };
    const query = vi.fn();
    for (let index = 0; index < 7; index += 1) {
      query.mockResolvedValueOnce({ rows: [] });
    }
    query
      .mockResolvedValueOnce({ rows: [experienceRow] })
      .mockRejectedValueOnce(
        Object.assign(new Error('column "guest_name" does not exist'), {
          code: '42703',
        }),
      )
      .mockResolvedValueOnce({ rows: [bookingRow] });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    const result = await service.createBooking(maxUser, {
      cityId: 'kostroma',
      date: '2026-10-10',
      experienceId: 'experience-1',
      groupSize: 10,
      imageUrl: experienceRow.photo_urls[0]!,
      meetingPoint: experienceRow.meeting_point,
      participants: 1,
      priceRub: 1700,
      time: '12:00',
      title: experienceRow.title,
    });

    expect(result.id).toBe('booking-legacy-schema');
    expect(query.mock.calls[8]?.[0]).toContain('guest_name');
    expect(query.mock.calls[9]?.[0]).not.toContain('guest_name');
    expect(query.mock.calls[9]?.[1]).toHaveLength(12);
  });

  it('keeps guide-owned experiences out of regular booking history', async () => {
    const query = vi.fn();
    for (let index = 0; index < 8; index += 1) {
      query.mockResolvedValueOnce({ rows: [] });
    }
    query.mockResolvedValueOnce({
      rows: [
        {
          booking_date: '2099-10-10',
          booking_time: '12:00:00',
          city_id: 'kostroma',
          created_at: new Date('2026-09-21T08:00:00.000Z'),
          experience_id: 'experience-1',
          guide_display_name: 'Артемий',
          guide_max_user_id: '84',
          guide_max_username: 'artemiy',
          id: 'booking-1',
          image_url: 'https://example.com/photo.jpg',
          meeting_point: experienceRow.meeting_point,
          participants: 2,
          review_comment: null,
          review_created_at: null,
          review_id: null,
          review_rating: null,
          status: 'confirmed',
          title: experienceRow.title,
          total_price_rub: 3400,
          unit_price_rub: 1700,
        },
      ],
    });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    const result = await service.listBookings(maxUser);

    expect(query.mock.calls[8]?.[0]).toContain('not exists');
    expect(query.mock.calls[8]?.[0]).toContain(
      'own_guide.max_user_id = b.max_user_id',
    );
    expect(query.mock.calls[8]?.[0]).toContain(
      'booked_guide.max_user_id as guide_max_user_id',
    );
    expect(query.mock.calls[8]?.[1]).toEqual(['42']);
    expect(result.items[0]?.guideContact).toEqual({
      displayName: 'Артемий',
      maxUserId: '84',
      username: 'artemiy',
    });
  });

  it('returns the guide contact for legacy profiles without a saved username', async () => {
    const query = vi.fn();
    for (let index = 0; index < 8; index += 1) {
      query.mockResolvedValueOnce({ rows: [] });
    }
    query.mockResolvedValueOnce({
      rows: [
        {
          booking_date: '2099-10-10',
          booking_time: '12:00:00',
          city_id: 'kostroma',
          created_at: new Date('2026-09-21T08:00:00.000Z'),
          experience_id: 'experience-1',
          guide_display_name: 'Артемий',
          guide_max_user_id: '84',
          guide_max_username: null,
          id: 'booking-1',
          image_url: 'https://example.com/photo.jpg',
          meeting_point: experienceRow.meeting_point,
          participants: 2,
          review_comment: null,
          review_created_at: null,
          review_id: null,
          review_rating: null,
          status: 'confirmed',
          title: experienceRow.title,
          total_price_rub: 3400,
          unit_price_rub: 1700,
        },
      ],
    });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    const result = await service.listBookings(maxUser);

    expect(result.items[0]?.guideContact).toEqual({
      displayName: 'Артемий',
      maxUserId: '84',
      username: null,
    });
  });

  it('lists guest contacts only inside the guide schedule', async () => {
    const query = vi.fn();
    for (let index = 0; index < 6; index += 1) {
      query.mockResolvedValueOnce({ rows: [] });
    }
    query.mockResolvedValueOnce({
      rows: [
        {
          booking_count: 1,
          booking_date: '2099-10-10',
          booking_time: '12:00:00',
          capacity: 8,
          experience_id: 'experience-1',
          guests: [
            {
              bookingId: 'booking-1',
              guestName: 'Мария Иванова',
              maxUserId: '42',
              participants: 2,
              username: 'artemiy',
            },
          ],
          participants: 2,
          status: 'scheduled',
          title: experienceRow.title,
        },
      ],
    });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    const result = await service.listGuideSchedule('84');

    expect(query.mock.calls[6]?.[0]).toContain(
      "'guestName', to_jsonb(b) ->> 'guest_name'",
    );
    expect(query.mock.calls[6]?.[0]).toContain("'maxUserId', b.max_user_id");
    expect(query.mock.calls[6]?.[1]).toEqual(['84']);
    expect(result.items[0]?.guests).toEqual([
      {
        bookingId: 'booking-1',
        guestName: 'Мария Иванова',
        maxUserId: '42',
        participants: 2,
        username: 'artemiy',
      },
    ]);
  });

  it('creates one review for a completed booking', async () => {
    const reviewRow = {
      booking_id: '3c999a75-cf3b-41d3-b13f-996e9f11f8db',
      comment: 'Отличная экскурсия и очень интересный гид.',
      created_at: new Date('2026-09-19T10:00:00.000Z'),
      experience_id: 'experience-1',
      id: 'review-1',
      rating: 5,
    };
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [
          {
            experience_id: 'experience-1',
            review_id: null,
            reviewable: true,
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [reviewRow] });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    const result = await service.createReview(
      {
        firstName: 'Артемий',
        id: '42',
        languageCode: 'ru',
        lastName: 'Иванов',
        photoUrl: 'https://example.com/avatar.jpg',
        username: 'artemiy',
      },
      reviewRow.booking_id,
      { comment: `  ${reviewRow.comment}  `, rating: 5 },
    );

    expect(result).toMatchObject({
      bookingId: reviewRow.booking_id,
      comment: reviewRow.comment,
      rating: 5,
    });
    expect(query.mock.calls[9]?.[1]).toEqual([
      reviewRow.booking_id,
      '42',
      'experience-1',
      'Артемий Иванов',
      'https://example.com/avatar.jpg',
      5,
      reviewRow.comment,
    ]);
  });

  it('lists public reviews for a published experience', async () => {
    const publicReview = {
      author_name: 'Мария Иванова',
      author_photo_url: 'https://example.com/maria.jpg',
      comment: 'Очень интересная экскурсия.',
      created_at: new Date('2026-09-20T08:00:00.000Z'),
      id: 'review-1',
      rating: 5,
    };
    const query = vi.fn();
    for (let index = 0; index < 8; index += 1) {
      query.mockResolvedValueOnce({ rows: [] });
    }
    query.mockResolvedValueOnce({ rows: [publicReview] });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    const result = await service.listExperienceReviews('experience-1');

    expect(result.items).toEqual([
      {
        authorName: publicReview.author_name,
        authorPhotoUrl: publicReview.author_photo_url,
        comment: publicReview.comment,
        createdAt: publicReview.created_at.toISOString(),
        id: publicReview.id,
        rating: publicReview.rating,
      },
    ]);
    expect(query.mock.calls[8]?.[0]).toContain('order by r.created_at desc');
    expect(query.mock.calls[8]?.[1]).toEqual(['experience-1']);
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
        username: 'artemiy',
      },
      { bio: guideRow.bio, displayName: 'Артемий' },
    );

    expect(result.displayName).toBe('Артемий');
    expect(query).toHaveBeenCalledWith(expect.stringContaining('on conflict'), [
      '42',
      'Артемий',
      guideRow.bio,
      guideRow.photo_url,
      'artemiy',
    ]);
    expect(result.photoUrl).toBe(guideRow.photo_url);
  });

  it('clears a stale username when MAX launch data has no public username', async () => {
    const query = vi.fn().mockResolvedValue({
      rows: [{ ...guideRow, max_username: null }],
    });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    await service.upsertGuideProfile(
      {
        firstName: 'Артемий',
        id: '42',
        languageCode: 'ru',
        lastName: null,
        photoUrl: guideRow.photo_url,
        username: null,
      },
      {
        bio: guideRow.bio,
        displayName: 'Артемий',
      },
    );

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('max_username = excluded.max_username'),
      ['42', 'Артемий', guideRow.bio, guideRow.photo_url, null],
    );
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
        scheduleSlots: ['2027-09-21T12:00'],
        title: 'Первое знакомство с городом',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates an experience through its verified guide profile', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [guideRow] })
      .mockResolvedValueOnce({ rows: [experienceRow] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
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
      scheduleSlots: ['2027-09-21T12:00'],
      title: experienceRow.title,
    });

    expect(result.title).toBe('Обновлённое знакомство с городом');
    expect(result.rating).toBe(0);
    expect(result.reviewCount).toBe(0);
    expect(query.mock.calls[10]?.[1]).toEqual([
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

  it('lets only the verified guide complete a booked schedule slot', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ experience_id: 'experience-1' }] });
    const service = new MarketplaceService({
      query,
    } as unknown as DatabaseService);

    await expect(
      service.completeGuideSchedule('42', {
        date: '2026-10-10',
        experienceId: 'experience-1',
        time: '12:00',
      }),
    ).resolves.toEqual({ completed: true });
    expect(query.mock.calls[6]?.[0]).toContain("s.status = 'scheduled'");
    expect(query.mock.calls[6]?.[1]).toEqual([
      'experience-1',
      '2026-10-10',
      '12:00',
      '42',
    ]);
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
