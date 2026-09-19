import { Injectable, NotFoundException } from '@nestjs/common';

import { DatabaseService } from '../database/database.service.js';
import type { AuthenticatedMaxUser } from '../max/max-auth.service.js';
import type {
  CreateExperienceDto,
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

@Injectable()
export class MarketplaceService {
  private photoSchemaReady: Promise<void> | null = null;

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
