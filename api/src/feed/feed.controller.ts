import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FeedReaderService } from './feed-reader.service';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedReader: FeedReaderService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findFeed(@CurrentUser() user: AuthUser) {
    return this.feedReader.findUserFeed(user.sub);
  }

  @Get('groups/:groupId')
  @UseGuards(JwtAuthGuard)
  findGroupFeed(@CurrentUser() user: AuthUser, @Param('groupId') groupId: string) {
    return this.feedReader.findGroupFeed(user.sub, groupId);
  }
}
