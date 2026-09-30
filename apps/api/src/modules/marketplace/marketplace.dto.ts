import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Matches,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const cityIds = ['saint-petersburg', 'moscow', 'kazan', 'kostroma'] as const;
const categories = [
  'Обзорные',
  'Музеи',
  'По воде',
  'Вечерние',
  'Гастро',
  'С детьми',
] as const;

export class UpsertGuideProfileDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  bio!: string;
}

export class CreateExperienceDto {
  @ApiProperty({ enum: cityIds })
  @IsIn(cityIds)
  cityId!: (typeof cityIds)[number];

  @ApiProperty({ enum: categories })
  @IsIn(categories)
  category!: (typeof categories)[number];

  @IsString()
  @MinLength(6)
  @MaxLength(120)
  @ApiProperty({ type: String })
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(240)
  @ApiProperty({ type: String })
  intro!: string;

  @IsString()
  @MinLength(40)
  @MaxLength(3000)
  @ApiProperty({ type: String })
  description!: string;

  @IsInt()
  @Min(30)
  @Max(720)
  @ApiProperty({ type: Number })
  durationMinutes!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(80)
  @ApiProperty({ type: String })
  format!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @ApiProperty({ type: Number })
  groupSize!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  @ApiProperty({ type: String })
  childrenPolicy!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(240)
  @ApiProperty({ type: String })
  meetingPoint!: string;

  @IsInt()
  @Min(100)
  @Max(1_000_000)
  @ApiProperty({ type: Number })
  priceRub!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsUrl({ require_protocol: true }, { each: true })
  @ApiProperty({ type: [String] })
  photoUrls!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(60)
  @Matches(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/, {
    each: true,
  })
  @ApiProperty({ type: [String] })
  scheduleSlots!: string[];
}

export class UploadExperiencePhotoDto {
  @IsString()
  @MaxLength(180)
  @ApiProperty({ type: String })
  filename!: string;

  @IsString()
  @MaxLength(4_200_000)
  @ApiProperty({ type: String })
  dataUrl!: string;
}

export class CreateBookingDto {
  @IsString()
  @MaxLength(120)
  @ApiProperty({ type: String })
  experienceId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @ApiProperty({ type: String })
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @ApiProperty({ type: String })
  time!: string;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(720)
  @ApiProperty({ required: false, type: Number })
  durationMinutes?: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @ApiProperty({ type: Number })
  participants!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @ApiProperty({ type: String })
  title!: string;

  @IsIn(cityIds)
  @ApiProperty({ enum: cityIds })
  cityId!: (typeof cityIds)[number];

  @IsString()
  @MaxLength(2000)
  @ApiProperty({ type: String })
  imageUrl!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(240)
  @ApiProperty({ type: String })
  meetingPoint!: string;

  @IsInt()
  @Min(100)
  @Max(1_000_000)
  @ApiProperty({ type: Number })
  priceRub!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  @ApiProperty({ type: Number })
  groupSize!: number;
}

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({ type: Number })
  rating!: number;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  @ApiProperty({ type: String })
  comment!: string;
}

export class CompleteScheduleSlotDto {
  @IsString()
  @MaxLength(120)
  @ApiProperty({ type: String })
  experienceId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @ApiProperty({ type: String })
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  @ApiProperty({ type: String })
  time!: string;
}
