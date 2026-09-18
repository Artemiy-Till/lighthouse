import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsString,
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
}
