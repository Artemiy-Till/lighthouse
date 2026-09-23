import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
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
  title!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(240)
  intro!: string;

  @IsString()
  @MinLength(40)
  @MaxLength(3000)
  description!: string;

  @IsInt()
  @Min(30)
  @Max(720)
  durationMinutes!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(80)
  format!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  groupSize!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  childrenPolicy!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(240)
  meetingPoint!: string;

  @IsInt()
  @Min(100)
  @Max(1_000_000)
  priceRub!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsUrl({ require_protocol: true }, { each: true })
  photoUrls!: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(60)
  @Matches(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/, {
    each: true,
  })
  scheduleSlots!: string[];
}

export class UploadExperiencePhotoDto {
  @IsString()
  @MaxLength(180)
  filename!: string;

  @IsString()
  @MaxLength(4_200_000)
  dataUrl!: string;
}

export class CreateBookingDto {
  @IsString()
  @MaxLength(120)
  experienceId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  time!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  participants!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsIn(cityIds)
  cityId!: (typeof cityIds)[number];

  @IsString()
  @MaxLength(2000)
  imageUrl!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(240)
  meetingPoint!: string;

  @IsInt()
  @Min(100)
  @Max(1_000_000)
  priceRub!: number;

  @IsInt()
  @Min(1)
  @Max(100)
  groupSize!: number;
}

export class ConnectTourChatDto {
  @IsString()
  @Matches(/^https:\/\/(?:www\.)?max\.ru\/.+/i)
  @MaxLength(2048)
  inviteLink!: string;
}

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  comment!: string;
}

export class CompleteScheduleSlotDto {
  @IsString()
  @MaxLength(120)
  experienceId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  time!: string;
}
