import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class AuthenticateMaxDto {
  @ApiProperty({
    description: 'Signed launch data received from window.WebApp.initData',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(16_384)
  initData!: string;
}
