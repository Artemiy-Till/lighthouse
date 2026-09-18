import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { AuthenticateMaxDto } from './max-auth.dto.js';
import {
  MaxAuthService,
  type MaxAuthenticationResult,
} from './max-auth.service.js';

@ApiTags('authentication')
@Controller('auth/max')
export class MaxAuthController {
  constructor(private readonly maxAuthService: MaxAuthService) {}

  @Post()
  @ApiOkResponse({ description: 'Verified MAX user profile' })
  authenticate(@Body() body: AuthenticateMaxDto): MaxAuthenticationResult {
    return this.maxAuthService.authenticate(body.initData);
  }
}
