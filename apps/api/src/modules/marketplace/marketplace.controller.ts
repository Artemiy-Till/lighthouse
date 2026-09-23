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
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { timingSafeEqual } from 'node:crypto';

import { MaxAuthService } from '../max/max-auth.service.js';
import {
  CompleteScheduleSlotDto,
  CreateBookingDto,
  CreateExperienceDto,
  CreateReviewDto,
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
    private readonly config: ConfigService,
  ) {}

  private authenticate(initData?: string) {
    if (!initData)
      throw new UnauthorizedException('MAX launch data is required');
    return this.maxAuth.authenticate(initData).user;
  }

  @Post('integrations/max/webhook')
  handleMaxWebhook(
    @Headers('x-max-bot-api-secret') receivedSecret: string | undefined,
    @Body() body: unknown,
  ) {
    const expectedSecret = this.config.get<string>('MAX_WEBHOOK_SECRET');
    const received = Buffer.from(receivedSecret ?? '');
    const expected = Buffer.from(expectedSecret ?? '');
    if (
      !expectedSecret ||
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      throw new UnauthorizedException('Invalid MAX webhook secret');
    }
    return this.marketplace.handleMaxWebhook(body);
  }

  @Get('experiences')
  list(@Query('cityId') cityId?: string) {
    return this.marketplace.listExperiences(cityId);
  }

  @Get('experiences/:id')
  get(@Param('id') id: string) {
    return this.marketplace.getExperience(id);
  }

  @Get('experiences/:id/reviews')
  reviews(@Param('id') id: string) {
    return this.marketplace.listExperienceReviews(id);
  }

  @Post('bookings')
  createBooking(
    @Headers('x-max-init-data') initData: string | undefined,
    @Body() body: CreateBookingDto,
  ) {
    const user = this.authenticate(initData);
    return this.marketplace.createBooking(user, body);
  }

  @Get('bookings')
  listBookings(@Headers('x-max-init-data') initData: string | undefined) {
    const user = this.authenticate(initData);
    return this.marketplace.listBookings(user);
  }

  @Post('bookings/:id/contact')
  sendGuideContact(
    @Headers('x-max-init-data') initData: string | undefined,
    @Param('id') id: string,
  ) {
    return this.marketplace.sendGuideContact(
      this.authenticate(initData).id,
      id,
    );
  }

  @Delete('bookings/:id')
  cancelBooking(
    @Headers('x-max-init-data') initData: string | undefined,
    @Param('id') id: string,
  ) {
    const user = this.authenticate(initData);
    return this.marketplace.cancelBooking(user.id, id);
  }

  @Post('bookings/:id/review')
  createReview(
    @Headers('x-max-init-data') initData: string | undefined,
    @Param('id') id: string,
    @Body() body: CreateReviewDto,
  ) {
    return this.marketplace.createReview(this.authenticate(initData), id, body);
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

  @Get('professional/schedule')
  listGuideSchedule(@Headers('x-max-init-data') initData: string | undefined) {
    return this.marketplace.listGuideSchedule(this.authenticate(initData).id);
  }

  @Post('professional/bookings/:id/contact')
  sendGuestContact(
    @Headers('x-max-init-data') initData: string | undefined,
    @Param('id') id: string,
  ) {
    return this.marketplace.sendGuestContact(
      this.authenticate(initData).id,
      id,
    );
  }

  @Post('professional/schedule/complete')
  completeGuideSchedule(
    @Headers('x-max-init-data') initData: string | undefined,
    @Body() body: CompleteScheduleSlotDto,
  ) {
    return this.marketplace.completeGuideSchedule(
      this.authenticate(initData).id,
      body,
    );
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
