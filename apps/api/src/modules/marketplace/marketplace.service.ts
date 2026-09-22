import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import { MaxApiClient } from '../max/max-api.client.js';
import type { AuthenticatedMaxUser } from '../max/max-auth.service.js';
import type {
  CompleteScheduleSlotDto,
  CreateExperienceDto,
  CreateBookingDto,
  CreateReviewDto,
  UpsertGuideProfileDto,
} from './marketplace.dto.js';

interface GuideRow {
  id: string;
  max_user_id: string;
  max_username: string | null;
  display_name: string;
  bio: string;
  photo_url: string | null;
  created_at: Date;
}

interface ExperienceRow {
  available_slots: Array<{
    date: string;
    remaining: number;
    status: 'completed' | 'scheduled';
    time: string;
  }> | null;
  id: string;
  city_id: string;
  category: string;
  title: string;
  intro: string;
  description: string;
  duration_minutes: number;
  format: string;
  group_size: number;
  children_policy: string;
  meeting_point: string;
  price_rub: number;
  photo_urls: string[];
  created_at: Date;
  guide_id: string;
  guide_name: string;
  guide_bio: string;
  guide_photo_url: string | null;
  rating_avg: number | string;
  review_count: number;
}

interface BookingRow {
  id: string;
  experience_id: string;
  title: string;
  city_id: string;
  image_url: string;
  meeting_point: string;
  booking_date: string | Date;
  booking_time: string;
  participants: number;
  unit_price_rub: number;
  total_price_rub: number;
  status: 'cancelled' | 'completed' | 'confirmed';
  created_at: Date;
  review_id: string | null;
  review_rating: number | null;
  review_comment: string | null;
  review_created_at: Date | null;
  guide_max_user_id?: string | null;
  guide_display_name?: string | null;
  guide_max_username?: string | null;
}

interface ReviewRow {
  id: string;
  booking_id: string;
  experience_id: string;
  rating: number;
  comment: string;
  created_at: Date;
}

interface PublicReviewRow {
  author_name: string;
  author_photo_url: string | null;
  comment: string;
  created_at: Date;
  id: string;
  rating: number;
}

function mapGuide(row: GuideRow) {
  return {
    bio: row.bio,
    createdAt: row.created_at.toISOString(),
    displayName: row.display_name,
    id: row.id,
    maxUsername: row.max_username,
    photoUrl: row.photo_url,
  };
}

function mapExperience(row: ExperienceRow) {
  return {
    availableSlots: row.available_slots ?? [],
    category: row.category,
    children: row.children_policy,
    cityId: row.city_id,
    createdAt: row.created_at.toISOString(),
    description: row.description,
    durationMinutes: row.duration_minutes,
    format: row.format,
    groupSize: row.group_size,
    groupType: 'Авторская экскурсия',
    guide: {
      bio: row.guide_bio,
      displayName: row.guide_name,
      id: row.guide_id,
      photoUrl: row.guide_photo_url,
    },
    highlights: [row.intro],
    id: row.id,
    intro: row.intro,
    meetingPoint: row.meeting_point,
    photos: row.photo_urls,
    priceRub: row.price_rub,
    rating: Number(row.rating_avg),
    reviewCount: row.review_count,
    status: 'published' as const,
    title: row.title,
  };
}

function mapBooking(row: BookingRow) {
  const date =
    row.booking_date instanceof Date
      ? row.booking_date.toISOString().slice(0, 10)
      : String(row.booking_date).slice(0, 10);
  return {
    cityId: row.city_id,
    createdAt: row.created_at.toISOString(),
    date,
    experienceId: row.experience_id,
    id: row.id,
    imageUrl: row.image_url,
    meetingPoint: row.meeting_point,
    participants: row.participants,
    guideContact:
      row.guide_max_user_id && row.guide_display_name
        ? {
            displayName: row.guide_display_name,
            maxUserId: row.guide_max_user_id,
            username: row.guide_max_username ?? null,
          }
        : null,
    status: row.status,
    time: row.booking_time.slice(0, 5),
    title: row.title,
    totalPriceRub: row.total_price_rub,
    unitPriceRub: row.unit_price_rub,
    review:
      row.review_id && row.review_created_at
        ? {
            comment: row.review_comment ?? '',
            createdAt: row.review_created_at.toISOString(),
            id: row.review_id,
            rating: row.review_rating ?? 0,
          }
        : null,
  };
}

function mapReview(row: ReviewRow) {
  return {
    bookingId: row.booking_id,
    comment: row.comment,
    createdAt: row.created_at.toISOString(),
    experienceId: row.experience_id,
    id: row.id,
    rating: row.rating,
  };
}

function mapPublicReview(row: PublicReviewRow) {
  return {
    authorName: row.author_name,
    authorPhotoUrl: row.author_photo_url,
    comment: row.comment,
    createdAt: row.created_at.toISOString(),
    id: row.id,
    rating: row.rating,
  };
}

@Injectable()
export class MarketplaceService {
  private photoSchemaReady: Promise<void> | null = null;
  private guidePhotoSchemaReady: Promise<void> | null = null;
  private bookingSchemaReady: Promise<void> | null = null;
  private reviewSchemaReady: Promise<void> | null = null;
  private scheduleSchemaReady: Promise<void> | null = null;

  constructor(
    private readonly database: DatabaseService,
    private readonly maxApiClient?: MaxApiClient,
  ) {}

  private ensurePhotoSchema() {
    this.photoSchemaReady ??= this.database
      .query(
        `alter table published_experiences
         add column if not exists photo_urls text[] not null default '{}'::text[]`,
      )
      .then(() => undefined)
      .catch((error: unknown) => {
        this.photoSchemaReady = null;
        throw error;
      });
    return this.photoSchemaReady;
  }

  private ensureGuidePhotoSchema() {
    this.guidePhotoSchemaReady ??= this.database
      .query(
        `alter table guide_profiles
         add column if not exists photo_url text`,
      )
      .then(() =>
        this.database.query(
          `alter table guide_profiles
           add column if not exists max_username text`,
        ),
      )
      .then(() => undefined)
      .catch((error: unknown) => {
        this.guidePhotoSchemaReady = null;
        throw error;
      });
    return this.guidePhotoSchemaReady;
  }

  private ensureBookingSchema() {
    this.bookingSchemaReady ??= this.database
      .query(
        `create table if not exists experience_bookings (
          id uuid primary key default gen_random_uuid(),
          max_user_id text not null,
          max_username text,
          guest_name varchar(160),
          experience_id text not null,
          title varchar(120) not null,
          city_id varchar(40) not null,
          image_url text not null,
          meeting_point varchar(240) not null,
          booking_date date not null,
          booking_time time not null,
          participants integer not null check (participants between 1 and 100),
          unit_price_rub integer not null check (unit_price_rub > 0),
          total_price_rub integer not null check (total_price_rub > 0),
          status varchar(20) not null default 'confirmed'
            check (status in ('confirmed', 'cancelled')),
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )`,
      )
      .then(() =>
        this.database
          .query(
            `alter table experience_bookings
           add column if not exists max_username text,
           add column if not exists guest_name varchar(160)`,
          )
          .catch(() =>
            this.database.query(
              `alter table experience_bookings
             add column if not exists max_username text`,
            ),
          ),
      )
      .then(() =>
        this.database.query(
          `create table if not exists experience_booking_slots (
            experience_id text not null,
            booking_date date not null,
            booking_time time not null,
            capacity integer not null check (capacity between 1 and 100),
            booked integer not null default 0 check (booked >= 0),
            status varchar(20) not null default 'scheduled'
              check (status in ('scheduled', 'completed')),
            primary key (experience_id, booking_date, booking_time)
          )`,
        ),
      )
      .then(() =>
        this.database.query(
          `create index if not exists experience_bookings_user_date_idx
           on experience_bookings (max_user_id, booking_date desc, created_at desc)`,
        ),
      )
      .then(() => undefined)
      .catch((error: unknown) => {
        this.bookingSchemaReady = null;
        throw error;
      });
    return this.bookingSchemaReady;
  }

  private ensureScheduleSchema() {
    this.scheduleSchemaReady ??= this.ensureBookingSchema()
      .then(() =>
        this.database.query(
          `alter table experience_booking_slots
           add column if not exists status varchar(20) not null default 'scheduled'`,
        ),
      )
      .then(() =>
        this.database.query(
          `create index if not exists experience_booking_slots_status_idx
           on experience_booking_slots
             (experience_id, booking_date, booking_time, status)`,
        ),
      )
      .then(() => undefined)
      .catch((error: unknown) => {
        this.scheduleSchemaReady = null;
        throw error;
      });
    return this.scheduleSchemaReady;
  }

  private async replaceExperienceSchedule(
    experienceId: string,
    capacity: number,
    slots: readonly string[],
  ) {
    const uniqueSlots = [...new Set(slots)].sort();
    this.assertFutureSchedule(uniqueSlots);

    await this.database.query(
      `delete from experience_booking_slots
       where experience_id = $1
         and status = 'scheduled'
         and booked = 0
         and not (
           booking_date::text || 'T' || to_char(booking_time, 'HH24:MI') =
             any($2::text[])
         )`,
      [experienceId, uniqueSlots],
    );
    await this.database.query(
      `insert into experience_booking_slots (
         experience_id, booking_date, booking_time, capacity, booked, status
       )
       select $1, left(slot, 10)::date, substring(slot from 12)::time,
         $3, 0, 'scheduled'
       from unnest($2::text[]) slot
       on conflict (experience_id, booking_date, booking_time) do update
       set capacity = greatest(excluded.capacity, experience_booking_slots.booked)
       where experience_booking_slots.status = 'scheduled'`,
      [experienceId, uniqueSlots, capacity],
    );
  }

  private assertFutureSchedule(slots: readonly string[]) {
    const now = new Date();
    if (
      slots.some(
        (slot) => new Date(`${slot}:00+03:00`).getTime() <= now.getTime(),
      )
    ) {
      throw new BadRequestException('Schedule dates must be in the future');
    }
  }

  private ensureReviewSchema() {
    this.reviewSchemaReady ??= this.ensureScheduleSchema()
      .then(() =>
        this.database.query(
          `create table if not exists experience_reviews (
            id uuid primary key default gen_random_uuid(),
            booking_id uuid not null unique references experience_bookings(id) on delete cascade,
            max_user_id text not null,
            experience_id text not null,
            author_name varchar(160) not null,
            author_photo_url text,
            rating integer not null check (rating between 1 and 5),
            comment varchar(1000) not null,
            created_at timestamptz not null default now(),
            updated_at timestamptz not null default now()
          )`,
        ),
      )
      .then(() =>
        this.database.query(
          `create index if not exists experience_reviews_experience_created_idx
           on experience_reviews (experience_id, created_at desc)`,
        ),
      )
      .then(() => undefined)
      .catch((error: unknown) => {
        this.reviewSchemaReady = null;
        throw error;
      });
    return this.reviewSchemaReady;
  }

  async createBooking(user: AuthenticatedMaxUser, input: CreateBookingDto) {
    const maxUserId = user.id;
    const guestName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const today = new Date().toISOString().slice(0, 10);
    if (input.date < today) {
      throw new BadRequestException('Choose a future date');
    }

    const published = await this.database.query<
      Pick<
        ExperienceRow,
        | 'city_id'
        | 'group_size'
        | 'meeting_point'
        | 'photo_urls'
        | 'price_rub'
        | 'title'
      > & { is_own: boolean }
    >(
      `select e.city_id, e.group_size, e.meeting_point, e.photo_urls,
         e.price_rub, e.title, g.max_user_id = $2 as is_own
       from published_experiences e
       join guide_profiles g on g.id = e.guide_id
       where e.id::text = $1 and e.status = 'published'`,
      [input.experienceId, maxUserId],
    );
    const source = published.rows[0];
    if (source?.is_own) {
      throw new BadRequestException('A guide cannot book their own experience');
    }
    const title = source?.title ?? input.title.trim();
    const cityId = source?.city_id ?? input.cityId;
    const imageUrl = source?.photo_urls[0] ?? input.imageUrl;
    const meetingPoint = source?.meeting_point ?? input.meetingPoint.trim();
    const priceRub = source?.price_rub ?? input.priceRub;
    const groupSize = source?.group_size ?? input.groupSize;
    if (input.participants > groupSize) {
      throw new ConflictException('Not enough available places');
    }

    const reservation = source
      ? `update experience_booking_slots
         set booked = booked + $9
         where experience_id = $1
           and booking_date = $2::date
           and booking_time = $3::time
           and status = 'scheduled'
           and booked + $9 <= capacity
         returning experience_id`
      : `insert into experience_booking_slots (
           experience_id, booking_date, booking_time, capacity, booked, status
         ) values ($1, $2::date, $3::time, $11, $9, 'scheduled')
         on conflict (experience_id, booking_date, booking_time) do update
         set booked = experience_booking_slots.booked + excluded.booked,
             capacity = least(experience_booking_slots.capacity, excluded.capacity)
         where experience_booking_slots.booked + excluded.booked <=
           least(experience_booking_slots.capacity, excluded.capacity)
           and experience_booking_slots.status = 'scheduled'
         returning experience_id`;
    const maxUsernameParameter = source ? '$11' : '$12';
    const result = await this.database.query<BookingRow>(
      `with reserved_slot as (
         ${reservation}
       )
       insert into experience_bookings (
         max_user_id, experience_id, title, city_id, image_url,
         meeting_point, booking_date, booking_time, participants,
         unit_price_rub, total_price_rub, max_username
       )
       select $4, $1, $5, $6, $7, $8, $2::date, $3::time,
         $9, $10, $9 * $10, ${maxUsernameParameter}
       from reserved_slot
       returning id, experience_id, title, city_id, image_url, meeting_point,
         booking_date, booking_time, participants, unit_price_rub,
         total_price_rub, status, created_at`,
      [
        input.experienceId,
        input.date,
        input.time,
        maxUserId,
        title,
        cityId,
        imageUrl,
        meetingPoint,
        input.participants,
        priceRub,
        ...(source ? [] : [groupSize]),
        user.username,
      ],
    );
    if (!result.rows[0]) {
      throw new ConflictException('Not enough available places');
    }
    await this.database
      .query(
        `update experience_bookings
         set guest_name = $2, updated_at = now()
         where id = $1`,
        [result.rows[0].id, guestName || null],
      )
      .catch(() => undefined);
    return mapBooking(result.rows[0]);
  }

  async listBookings(user: AuthenticatedMaxUser) {
    await this.ensureBookingSchema();
    await this.ensureReviewSchema();
    const result = await this.database.query<BookingRow>(
      `select b.id, b.experience_id, b.title, b.city_id, b.image_url,
         b.meeting_point, b.booking_date, b.booking_time, b.participants,
         b.unit_price_rub, b.total_price_rub,
         case when b.status = 'confirmed' and s.status = 'completed'
           then 'completed' else b.status end as status,
         b.created_at,
         r.id as review_id, r.rating as review_rating,
         r.comment as review_comment, r.created_at as review_created_at,
         booked_guide.max_user_id as guide_max_user_id,
         booked_guide.display_name as guide_display_name,
         booked_guide.max_username as guide_max_username
       from experience_bookings b
       left join experience_reviews r on r.booking_id = b.id
       left join experience_booking_slots s
         on s.experience_id = b.experience_id
        and s.booking_date = b.booking_date
        and s.booking_time = b.booking_time
       left join published_experiences booked_experience
         on booked_experience.id::text = b.experience_id
       left join guide_profiles booked_guide
         on booked_guide.id = booked_experience.guide_id
       where b.max_user_id = $1
         and not exists (
           select 1
           from published_experiences own_experience
           join guide_profiles own_guide
             on own_guide.id = own_experience.guide_id
           where own_experience.id::text = b.experience_id
             and own_guide.max_user_id = b.max_user_id
         )
       order by b.booking_date desc, b.booking_time desc, b.created_at desc`,
      [user.id],
    );
    return { items: result.rows.map(mapBooking) };
  }

  async createReview(
    user: AuthenticatedMaxUser,
    bookingId: string,
    input: CreateReviewDto,
  ) {
    await this.ensureReviewSchema();
    const eligibility = await this.database.query<{
      experience_id: string;
      review_id: string | null;
      reviewable: boolean;
    }>(
      `select b.experience_id,
         (b.status = 'confirmed' and (
           s.status = 'completed' or b.booking_date + b.booking_time <=
             now() at time zone 'Europe/Moscow')) as reviewable,
         r.id as review_id
       from experience_bookings b
       left join experience_reviews r on r.booking_id = b.id
       left join experience_booking_slots s
         on s.experience_id = b.experience_id
        and s.booking_date = b.booking_date
        and s.booking_time = b.booking_time
       where b.id = $1 and b.max_user_id = $2`,
      [bookingId, user.id],
    );
    const booking = eligibility.rows[0];
    if (!booking) throw new NotFoundException('Booking not found');
    if (!booking.reviewable) {
      throw new BadRequestException(
        'A review can only be added after a completed experience',
      );
    }
    if (booking.review_id) {
      throw new ConflictException('A review already exists for this booking');
    }

    const authorName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const result = await this.database.query<ReviewRow>(
      `insert into experience_reviews (
         booking_id, max_user_id, experience_id, author_name,
         author_photo_url, rating, comment
       ) values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (booking_id) do nothing
       returning id, booking_id, experience_id, rating, comment, created_at`,
      [
        bookingId,
        user.id,
        booking.experience_id,
        authorName || 'Гость MAX',
        user.photoUrl,
        input.rating,
        input.comment.trim(),
      ],
    );
    if (!result.rows[0]) {
      throw new ConflictException('A review already exists for this booking');
    }
    return mapReview(result.rows[0]);
  }

  async cancelBooking(maxUserId: string, id: string) {
    await this.ensureBookingSchema();
    const result = await this.database.query<{ id: string }>(
      `with cancelled_booking as (
         update experience_bookings
         set status = 'cancelled', updated_at = now()
         where id = $1 and max_user_id = $2 and status = 'confirmed'
           and booking_date >= current_date
         returning id, experience_id, booking_date, booking_time, participants
       ), released_slot as (
         update experience_booking_slots slot
         set booked = greatest(0, slot.booked - booking.participants)
         from cancelled_booking booking
         where slot.experience_id = booking.experience_id
           and slot.booking_date = booking.booking_date
           and slot.booking_time = booking.booking_time
       )
       select id from cancelled_booking`,
      [id, maxUserId],
    );
    if (!result.rows[0]) throw new NotFoundException('Booking not found');
    return { cancelled: true, id: result.rows[0].id };
  }

  async getGuideProfile(user: AuthenticatedMaxUser) {
    await this.ensureGuidePhotoSchema();
    const result = await this.database.query<GuideRow>(
      `update guide_profiles
       set photo_url = $2,
           max_username = $3,
           updated_at = case
             when photo_url is distinct from $2
               or max_username is distinct from $3
             then now()
             else updated_at
           end
       where max_user_id = $1
       returning id, max_user_id, max_username, display_name, bio, photo_url,
         created_at`,
      [user.id, user.photoUrl, user.username],
    );
    return result.rows[0] ? mapGuide(result.rows[0]) : null;
  }

  async upsertGuideProfile(
    user: AuthenticatedMaxUser,
    input: UpsertGuideProfileDto,
  ) {
    await this.ensureGuidePhotoSchema();
    const result = await this.database.query<GuideRow>(
      `insert into guide_profiles (
         max_user_id, display_name, bio, photo_url, max_username
       )
       values ($1, $2, $3, $4, $5)
       on conflict (max_user_id) do update
       set display_name = excluded.display_name,
           bio = excluded.bio,
           photo_url = excluded.photo_url,
           max_username = excluded.max_username,
           updated_at = now()
       returning id, max_user_id, max_username, display_name, bio, photo_url,
         created_at`,
      [
        user.id,
        input.displayName.trim(),
        input.bio.trim(),
        user.photoUrl,
        user.username,
      ],
    );
    return mapGuide(result.rows[0]!);
  }

  async createExperience(maxUserId: string, input: CreateExperienceDto) {
    this.assertFutureSchedule(input.scheduleSlots);
    await this.ensurePhotoSchema();
    await this.ensureGuidePhotoSchema();
    await this.ensureScheduleSchema();
    const guide = await this.database.query<GuideRow>(
      `select id, max_user_id, display_name, bio, photo_url, created_at
       from guide_profiles where max_user_id = $1`,
      [maxUserId],
    );
    const profile = guide.rows[0];
    if (!profile) {
      throw new NotFoundException('Create a professional profile first');
    }

    const result = await this.database.query<ExperienceRow>(
      `insert into published_experiences (
         guide_id, city_id, category, title, intro, description,
         duration_minutes, format, group_size, children_policy,
         meeting_point, price_rub, photo_urls
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       returning id, city_id, category, title, intro, description,
         duration_minutes, format, group_size, children_policy,
         meeting_point, price_rub, photo_urls, created_at, guide_id,
         $14::text as guide_name, $15::text as guide_bio,
         $16::text as guide_photo_url, 0 as rating_avg,
         0::integer as review_count, '[]'::json as available_slots`,
      [
        profile.id,
        input.cityId,
        input.category,
        input.title.trim(),
        input.intro.trim(),
        input.description.trim(),
        input.durationMinutes,
        input.format.trim(),
        input.groupSize,
        input.childrenPolicy.trim(),
        input.meetingPoint.trim(),
        input.priceRub,
        input.photoUrls,
        profile.display_name,
        profile.bio,
        profile.photo_url,
      ],
    );
    const created = result.rows[0]!;
    await this.replaceExperienceSchedule(
      created.id,
      input.groupSize,
      input.scheduleSlots,
    );
    created.available_slots = input.scheduleSlots.map((slot) => ({
      date: slot.slice(0, 10),
      remaining: input.groupSize,
      status: 'scheduled',
      time: slot.slice(11),
    }));
    return mapExperience(created);
  }

  async listOwnExperiences(maxUserId: string) {
    await this.ensurePhotoSchema();
    await this.ensureGuidePhotoSchema();
    await this.ensureReviewSchema();
    await this.ensureScheduleSchema();
    const result = await this.database.query<ExperienceRow>(
      `select e.id, e.city_id, e.category, e.title, e.intro,
         e.description, e.duration_minutes, e.format, e.group_size,
         e.children_policy, e.meeting_point, e.price_rub, e.photo_urls,
         e.created_at, g.id as guide_id, g.display_name as guide_name,
         g.bio as guide_bio, g.photo_url as guide_photo_url,
         coalesce(review_stats.rating_avg, 0) as rating_avg,
         coalesce(review_stats.review_count, 0)::integer as review_count,
         schedule_stats.available_slots
       from published_experiences e
       join guide_profiles g on g.id = e.guide_id
       left join lateral (
         select avg(r.rating)::numeric as rating_avg, count(*) as review_count
         from experience_reviews r where r.experience_id = e.id::text
       ) review_stats on true
       left join lateral (
         select coalesce(json_agg(json_build_object(
           'date', s.booking_date::text,
           'time', to_char(s.booking_time, 'HH24:MI'),
           'remaining', greatest(0, s.capacity - s.booked),
           'status', s.status
         ) order by s.booking_date, s.booking_time), '[]'::json) available_slots
         from experience_booking_slots s
         where s.experience_id = e.id::text
           and s.status = 'scheduled'
           and s.booking_date + s.booking_time >
             now() at time zone 'Europe/Moscow'
       ) schedule_stats on true
       where g.max_user_id = $1 and e.status = 'published'
       order by e.created_at desc`,
      [maxUserId],
    );
    return { items: result.rows.map(mapExperience) };
  }

  async updateExperience(
    maxUserId: string,
    id: string,
    input: CreateExperienceDto,
  ) {
    this.assertFutureSchedule(input.scheduleSlots);
    await this.ensurePhotoSchema();
    await this.ensureGuidePhotoSchema();
    await this.ensureScheduleSchema();
    const guide = await this.database.query<GuideRow>(
      `select id, max_user_id, display_name, bio, photo_url, created_at
       from guide_profiles where max_user_id = $1`,
      [maxUserId],
    );
    const profile = guide.rows[0];
    if (!profile) {
      throw new NotFoundException('Professional profile not found');
    }

    const result = await this.database.query<ExperienceRow>(
      `update published_experiences
       set city_id = $3,
           category = $4,
           title = $5,
           intro = $6,
           description = $7,
           duration_minutes = $8,
           format = $9,
           group_size = $10,
           children_policy = $11,
           meeting_point = $12,
           price_rub = $13,
           photo_urls = $14,
           updated_at = now()
       where id = $1 and guide_id = $2 and status = 'published'
       returning id, city_id, category, title, intro, description,
         duration_minutes, format, group_size, children_policy,
         meeting_point, price_rub, photo_urls, created_at, guide_id,
         $15::text as guide_name, $16::text as guide_bio,
         $17::text as guide_photo_url, 0 as rating_avg,
         0::integer as review_count, '[]'::json as available_slots`,
      [
        id,
        profile.id,
        input.cityId,
        input.category,
        input.title.trim(),
        input.intro.trim(),
        input.description.trim(),
        input.durationMinutes,
        input.format.trim(),
        input.groupSize,
        input.childrenPolicy.trim(),
        input.meetingPoint.trim(),
        input.priceRub,
        input.photoUrls,
        profile.display_name,
        profile.bio,
        profile.photo_url,
      ],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('Experience not found');
    }
    await this.replaceExperienceSchedule(
      id,
      input.groupSize,
      input.scheduleSlots,
    );
    result.rows[0].available_slots = input.scheduleSlots.map((slot) => ({
      date: slot.slice(0, 10),
      remaining: input.groupSize,
      status: 'scheduled',
      time: slot.slice(11),
    }));
    return mapExperience(result.rows[0]);
  }

  async deleteExperience(maxUserId: string, id: string) {
    const result = await this.database.query<{ id: string }>(
      `delete from published_experiences e
       using guide_profiles g
       where e.id = $1
         and e.guide_id = g.id
         and g.max_user_id = $2
       returning e.id`,
      [id, maxUserId],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('Experience not found');
    }
    return { deleted: true, id: result.rows[0].id };
  }

  async listExperiences(cityId?: string) {
    await this.ensurePhotoSchema();
    await this.ensureGuidePhotoSchema();
    await this.ensureReviewSchema();
    await this.ensureScheduleSchema();
    const result = await this.database.query<ExperienceRow>(
      `select e.id, e.city_id, e.category, e.title, e.intro,
         e.description, e.duration_minutes, e.format, e.group_size,
         e.children_policy, e.meeting_point, e.price_rub, e.photo_urls,
         e.created_at,
         g.id as guide_id, g.display_name as guide_name, g.bio as guide_bio,
         g.photo_url as guide_photo_url,
         coalesce(review_stats.rating_avg, 0) as rating_avg,
         coalesce(review_stats.review_count, 0)::integer as review_count,
         schedule_stats.available_slots
       from published_experiences e
       join guide_profiles g on g.id = e.guide_id
       left join lateral (
         select avg(r.rating)::numeric as rating_avg, count(*) as review_count
         from experience_reviews r where r.experience_id = e.id::text
       ) review_stats on true
       left join lateral (
         select coalesce(json_agg(json_build_object(
           'date', s.booking_date::text,
           'time', to_char(s.booking_time, 'HH24:MI'),
           'remaining', greatest(0, s.capacity - s.booked),
           'status', s.status
         ) order by s.booking_date, s.booking_time), '[]'::json) available_slots
         from experience_booking_slots s
         where s.experience_id = e.id::text
           and s.status = 'scheduled'
           and s.booking_date + s.booking_time >
             now() at time zone 'Europe/Moscow'
           and s.booked < s.capacity
       ) schedule_stats on true
       where e.status = 'published' and ($1::text is null or e.city_id = $1)
       order by e.created_at desc`,
      [cityId ?? null],
    );
    return { items: result.rows.map(mapExperience) };
  }

  async getExperience(id: string) {
    await this.ensurePhotoSchema();
    await this.ensureGuidePhotoSchema();
    await this.ensureReviewSchema();
    await this.ensureScheduleSchema();
    const result = await this.database.query<ExperienceRow>(
      `select e.id, e.city_id, e.category, e.title, e.intro,
         e.description, e.duration_minutes, e.format, e.group_size,
         e.children_policy, e.meeting_point, e.price_rub, e.photo_urls,
         e.created_at,
         g.id as guide_id, g.display_name as guide_name, g.bio as guide_bio,
         g.photo_url as guide_photo_url,
         coalesce(review_stats.rating_avg, 0) as rating_avg,
         coalesce(review_stats.review_count, 0)::integer as review_count,
         schedule_stats.available_slots
       from published_experiences e
       join guide_profiles g on g.id = e.guide_id
       left join lateral (
         select avg(r.rating)::numeric as rating_avg, count(*) as review_count
         from experience_reviews r where r.experience_id = e.id::text
       ) review_stats on true
       left join lateral (
         select coalesce(json_agg(json_build_object(
           'date', s.booking_date::text,
           'time', to_char(s.booking_time, 'HH24:MI'),
           'remaining', greatest(0, s.capacity - s.booked),
           'status', s.status
         ) order by s.booking_date, s.booking_time), '[]'::json) available_slots
         from experience_booking_slots s
         where s.experience_id = e.id::text
           and s.status = 'scheduled'
           and s.booking_date + s.booking_time >
             now() at time zone 'Europe/Moscow'
           and s.booked < s.capacity
       ) schedule_stats on true
       where e.id = $1 and e.status = 'published'`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Experience not found');
    return mapExperience(result.rows[0]);
  }

  async listExperienceReviews(id: string) {
    await this.ensureReviewSchema();
    const result = await this.database.query<PublicReviewRow>(
      `select r.id, r.author_name, r.author_photo_url, r.rating,
         r.comment, r.created_at
       from experience_reviews r
       join published_experiences e on e.id::text = r.experience_id
       where r.experience_id = $1 and e.status = 'published'
       order by r.created_at desc`,
      [id],
    );
    return { items: result.rows.map(mapPublicReview) };
  }

  async listGuideSchedule(maxUserId: string) {
    await this.ensureScheduleSchema();
    const result = await this.database.query<{
      booking_count: number;
      booking_date: string | Date;
      booking_time: string;
      capacity: number;
      experience_id: string;
      guests: Array<{
        bookingId: string;
        guestName: string | null;
        maxUserId: string;
        participants: number;
        username: string | null;
      }>;
      participants: number;
      status: 'completed' | 'scheduled';
      title: string;
    }>(
      `select e.id::text as experience_id, e.title,
         s.booking_date, s.booking_time, s.capacity, s.status,
         count(b.id)::integer as booking_count,
         coalesce(sum(b.participants), 0)::integer as participants,
         coalesce(
           jsonb_agg(
             jsonb_build_object(
               'bookingId', b.id::text,
               'guestName', to_jsonb(b) ->> 'guest_name',
               'maxUserId', b.max_user_id,
               'participants', b.participants,
               'username', b.max_username
             ) order by b.created_at
           ) filter (where b.id is not null),
           '[]'::jsonb
         ) as guests
       from experience_booking_slots s
       join published_experiences e on e.id::text = s.experience_id
       join guide_profiles g on g.id = e.guide_id
       left join experience_bookings b
         on b.experience_id = s.experience_id
        and b.booking_date = s.booking_date
        and b.booking_time = s.booking_time
        and b.status = 'confirmed'
       where g.max_user_id = $1 and e.status = 'published'
         and (s.status = 'completed' or s.booking_date >= current_date)
       group by e.id, e.title, s.booking_date, s.booking_time,
         s.capacity, s.status
       order by case when s.status = 'scheduled' then 0 else 1 end,
         case when s.status = 'scheduled' then s.booking_date end asc,
         case when s.status = 'completed' then s.booking_date end desc,
         s.booking_time`,
      [maxUserId],
    );
    return {
      items: result.rows.map((row) => ({
        bookingCount: row.booking_count,
        capacity: row.capacity,
        date:
          row.booking_date instanceof Date
            ? row.booking_date.toISOString().slice(0, 10)
            : String(row.booking_date).slice(0, 10),
        experienceId: row.experience_id,
        guests: row.guests,
        participants: row.participants,
        status: row.status,
        time: row.booking_time.slice(0, 5),
        title: row.title,
      })),
    };
  }

  async sendGuestContact(maxUserId: string, bookingId: string) {
    if (!this.maxApiClient) {
      throw new BadRequestException('MAX messaging is unavailable');
    }
    const result = await this.database.query<{
      guest_name: string | null;
      guest_user_id: string;
      title: string;
    }>(
      `select coalesce(to_jsonb(b) ->> 'guest_name', 'Гость MAX') as guest_name,
         b.max_user_id as guest_user_id, e.title
       from experience_bookings b
       join published_experiences e on e.id::text = b.experience_id
       join guide_profiles g on g.id = e.guide_id
       where b.id::text = $1 and g.max_user_id = $2
         and b.status = 'confirmed'`,
      [bookingId, maxUserId],
    );
    const contact = result.rows[0];
    if (!contact) throw new NotFoundException('Guest booking not found');

    const bot = await this.maxApiClient.getCurrentBot();
    if (!bot.username) {
      throw new BadRequestException('MAX bot username is unavailable');
    }
    const guestName = contact.guest_name?.trim() || 'Гость MAX';
    const safeName = guestName.replace(/[\\[\]()_*~`>#+\-=|{}.!]/g, '\\$&');
    await this.maxApiClient.sendUserMessage(
      maxUserId,
      `Гость экскурсии «${contact.title}»: [${safeName}](max://user/${contact.guest_user_id})\n\nНажмите на имя гостя, чтобы открыть его профиль и написать.`,
    );
    return { botUrl: `https://max.ru/${bot.username}?start=guest-contact` };
  }

  async completeGuideSchedule(
    maxUserId: string,
    input: CompleteScheduleSlotDto,
  ) {
    await this.ensureScheduleSchema();
    const result = await this.database.query<{ experience_id: string }>(
      `update experience_booking_slots s
       set status = 'completed'
       from published_experiences e, guide_profiles g
       where s.experience_id = $1
         and s.booking_date = $2::date
         and s.booking_time = $3::time
         and s.status = 'scheduled'
         and s.booked > 0
         and e.id::text = s.experience_id
         and e.guide_id = g.id
         and g.max_user_id = $4
       returning s.experience_id`,
      [input.experienceId, input.date, input.time, maxUserId],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('Active scheduled experience not found');
    }
    return { completed: true as const };
  }
}
