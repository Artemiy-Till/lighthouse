import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import type { AuthenticatedMaxUser } from '../max/max-auth.service.js';
import type {
  CreateExperienceDto,
  CreateBookingDto,
  UpsertGuideProfileDto,
} from './marketplace.dto.js';

interface GuideRow {
  id: string;
  max_user_id: string;
  display_name: string;
  bio: string;
  created_at: Date;
}

interface ExperienceRow {
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
  status: 'cancelled' | 'confirmed';
  created_at: Date;
}

function mapGuide(row: GuideRow) {
  return {
    bio: row.bio,
    createdAt: row.created_at.toISOString(),
    displayName: row.display_name,
    id: row.id,
  };
}

function mapExperience(row: ExperienceRow) {
  return {
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
    },
    highlights: [row.intro],
    id: row.id,
    intro: row.intro,
    meetingPoint: row.meeting_point,
    photos: row.photo_urls,
    priceRub: row.price_rub,
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
    status: row.status,
    time: row.booking_time.slice(0, 5),
    title: row.title,
    totalPriceRub: row.total_price_rub,
    unitPriceRub: row.unit_price_rub,
  };
}

@Injectable()
export class MarketplaceService {
  private photoSchemaReady: Promise<void> | null = null;
  private bookingSchemaReady: Promise<void> | null = null;

  constructor(private readonly database: DatabaseService) {}

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

  private ensureBookingSchema() {
    this.bookingSchemaReady ??= this.database
      .query(
        `create table if not exists experience_bookings (
          id uuid primary key default gen_random_uuid(),
          max_user_id text not null,
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

  async createBooking(maxUserId: string, input: CreateBookingDto) {
    await this.ensurePhotoSchema();
    await this.ensureBookingSchema();
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
      >
    >(
      `select city_id, group_size, meeting_point, photo_urls, price_rub, title
       from published_experiences
       where id::text = $1 and status = 'published'`,
      [input.experienceId],
    );
    const source = published.rows[0];
    const title = source?.title ?? input.title.trim();
    const cityId = source?.city_id ?? input.cityId;
    const imageUrl = source?.photo_urls[0] ?? input.imageUrl;
    const meetingPoint = source?.meeting_point ?? input.meetingPoint.trim();
    const priceRub = source?.price_rub ?? input.priceRub;
    const groupSize = source?.group_size ?? input.groupSize;
    if (input.participants > groupSize) {
      throw new ConflictException('Not enough available places');
    }

    const result = await this.database.query<BookingRow>(
      `with booking_lock as (
         select pg_advisory_xact_lock(hashtext($1 || ':' || $2 || ':' || $3))
       ), occupied as (
         select coalesce(sum(participants), 0)::integer as count
         from booking_lock
         left join experience_bookings on experience_id = $1
           and booking_date = $2::date and booking_time = $3::time
           and status = 'confirmed'
       )
       insert into experience_bookings (
         max_user_id, experience_id, title, city_id, image_url,
         meeting_point, booking_date, booking_time, participants,
         unit_price_rub, total_price_rub
       )
       select $4, $1, $5, $6, $7, $8, $2::date, $3::time,
         $9, $10, $9 * $10
       from occupied
       where occupied.count + $9 <= $11
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
        groupSize,
      ],
    );
    if (!result.rows[0]) {
      throw new ConflictException('Not enough available places');
    }
    return mapBooking(result.rows[0]);
  }

  async listBookings(maxUserId: string) {
    await this.ensureBookingSchema();
    const result = await this.database.query<BookingRow>(
      `select id, experience_id, title, city_id, image_url, meeting_point,
         booking_date, booking_time, participants, unit_price_rub,
         total_price_rub, status, created_at
       from experience_bookings
       where max_user_id = $1
       order by booking_date desc, booking_time desc, created_at desc`,
      [maxUserId],
    );
    return { items: result.rows.map(mapBooking) };
  }

  async cancelBooking(maxUserId: string, id: string) {
    await this.ensureBookingSchema();
    const result = await this.database.query<{ id: string }>(
      `update experience_bookings
       set status = 'cancelled', updated_at = now()
       where id = $1 and max_user_id = $2 and status = 'confirmed'
         and booking_date >= current_date
       returning id`,
      [id, maxUserId],
    );
    if (!result.rows[0]) throw new NotFoundException('Booking not found');
    return { cancelled: true, id: result.rows[0].id };
  }

  async getGuideProfile(maxUserId: string) {
    const result = await this.database.query<GuideRow>(
      `select id, max_user_id, display_name, bio, created_at
       from guide_profiles where max_user_id = $1`,
      [maxUserId],
    );
    return result.rows[0] ? mapGuide(result.rows[0]) : null;
  }

  async upsertGuideProfile(
    user: AuthenticatedMaxUser,
    input: UpsertGuideProfileDto,
  ) {
    const result = await this.database.query<GuideRow>(
      `insert into guide_profiles (max_user_id, display_name, bio)
       values ($1, $2, $3)
       on conflict (max_user_id) do update
       set display_name = excluded.display_name,
           bio = excluded.bio,
           updated_at = now()
       returning id, max_user_id, display_name, bio, created_at`,
      [user.id, input.displayName.trim(), input.bio.trim()],
    );
    return mapGuide(result.rows[0]!);
  }

  async createExperience(maxUserId: string, input: CreateExperienceDto) {
    await this.ensurePhotoSchema();
    const guide = await this.database.query<GuideRow>(
      `select id, max_user_id, display_name, bio, created_at
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
         $14::text as guide_name, $15::text as guide_bio`,
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
      ],
    );
    return mapExperience(result.rows[0]!);
  }

  async listOwnExperiences(maxUserId: string) {
    await this.ensurePhotoSchema();
    const result = await this.database.query<ExperienceRow>(
      `select e.id, e.city_id, e.category, e.title, e.intro,
         e.description, e.duration_minutes, e.format, e.group_size,
         e.children_policy, e.meeting_point, e.price_rub, e.photo_urls,
         e.created_at, g.id as guide_id, g.display_name as guide_name,
         g.bio as guide_bio
       from published_experiences e
       join guide_profiles g on g.id = e.guide_id
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
    await this.ensurePhotoSchema();
    const guide = await this.database.query<GuideRow>(
      `select id, max_user_id, display_name, bio, created_at
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
         $15::text as guide_name, $16::text as guide_bio`,
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
      ],
    );
    if (!result.rows[0]) {
      throw new NotFoundException('Experience not found');
    }
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
    const result = await this.database.query<ExperienceRow>(
      `select e.id, e.city_id, e.category, e.title, e.intro,
         e.description, e.duration_minutes, e.format, e.group_size,
         e.children_policy, e.meeting_point, e.price_rub, e.photo_urls,
         e.created_at,
         g.id as guide_id, g.display_name as guide_name, g.bio as guide_bio
       from published_experiences e
       join guide_profiles g on g.id = e.guide_id
       where e.status = 'published' and ($1::text is null or e.city_id = $1)
       order by e.created_at desc`,
      [cityId ?? null],
    );
    return { items: result.rows.map(mapExperience) };
  }

  async getExperience(id: string) {
    await this.ensurePhotoSchema();
    const result = await this.database.query<ExperienceRow>(
      `select e.id, e.city_id, e.category, e.title, e.intro,
         e.description, e.duration_minutes, e.format, e.group_size,
         e.children_policy, e.meeting_point, e.price_rub, e.photo_urls,
         e.created_at,
         g.id as guide_id, g.display_name as guide_name, g.bio as guide_bio
       from published_experiences e
       join guide_profiles g on g.id = e.guide_id
       where e.id = $1 and e.status = 'published'`,
      [id],
    );
    if (!result.rows[0]) throw new NotFoundException('Experience not found');
    return mapExperience(result.rows[0]);
  }
}
