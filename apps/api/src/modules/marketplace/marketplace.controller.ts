import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { MaxAuthService } from '../max/max-auth.service.js';
import {
  CreateBookingDto,
  CreateExperienceDto,
  UploadExperiencePhotoDto,
  UpsertGuideProfileDto,
} from './marketplace.dto.js';
import { MarketplaceService } from './marketplace.service.js';
import { PhotoStorageService } from './photo-storage.service.js';

@ApiTags('marketplace')
@Controller()
export class MarketplaceController {
  constructor(
    private readonly marketplace: MarketplaceService,
    private readonly maxAuth: MaxAuthService,
    private readonly photoStorage: PhotoStorageService,
  ) {}

  private authenticate(initData?: string) {
    if (!initData)
      throw new UnauthorizedException('MAX launch data is required');
    return this.maxAuth.authenticate(initData).user;
  }

  @Get('experiences')
  list(@Query('cityId') cityId?: string) {
    return this.marketplace.listExperiences(cityId);
  }

  @Get('experiences/:id')
  get(@Param('id') id: string) {
    return this.marketplace.getExperience(id);
  }

  @Post('bookings')
  createBooking(
    @Headers('x-max-init-data') initData: string | undefined,
    @Body() body: CreateBookingDto,
  ) {
    const user = this.authenticate(initData);
    return this.marketplace.createBooking(user.id, body);
  }

  @Get('bookings')
  listBookings(@Headers('x-max-init-data') initData: string | undefined) {
    const user = this.authenticate(initData);
    return this.marketplace.listBookings(user.id);
  }

  @Delete('bookings/:id')
  cancelBooking(
    @Headers('x-max-init-data') initData: string | undefined,
    @Param('id') id: string,
  ) {
    const user = this.authenticate(initData);
    return this.marketplace.cancelBooking(user.id, id);
  }

  @Get('professional/profile')
  profile(@Headers('x-max-init-data') initData?: string) {
    const user = this.authenticate(initData);
    return this.marketplace.getGuideProfile(user);
  }

  @Put('professional/profile')
  saveProfile(
    @Headers('x-max-init-data') initData: string | undefined,
    @Body() body: UpsertGuideProfileDto,
  ) {
    return this.marketplace.upsertGuideProfile(
      this.authenticate(initData),
      body,
    );
  }

  @Post('professional/experiences')
  create(
    @Headers('x-max-init-data') initData: string | undefined,
    @Body() body: CreateExperienceDto,
  ) {
    const user = this.authenticate(initData);
    return this.marketplace.createExperience(user.id, body);
  }

  @Get('professional/experiences')
  listOwnExperiences(@Headers('x-max-init-data') initData: string | undefined) {
    const user = this.authenticate(initData);
    return this.marketplace.listOwnExperiences(user.id);
  }

  @Put('professional/experiences/:id')
  updateExperience(
    @Headers('x-max-init-data') initData: string | undefined,
    @Param('id') id: string,
    @Body() body: CreateExperienceDto,
  ) {
    const user = this.authenticate(initData);
    return this.marketplace.updateExperience(user.id, id, body);
  }

  @Delete('professional/experiences/:id')
  deleteExperience(
    @Headers('x-max-init-data') initData: string | undefined,
    @Param('id') id: string,
  ) {
    const user = this.authenticate(initData);
    return this.marketplace.deleteExperience(user.id, id);
  }

  @Post('professional/photos')
  uploadPhoto(
    @Headers('x-max-init-data') initData: string | undefined,
    @Body() body: UploadExperiencePhotoDto,
  ) {
    const user = this.authenticate(initData);
    return this.photoStorage.upload(user.id, body);
  }
}
