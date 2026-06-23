import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProfileMatchesService } from '../me/profile-matches/profile-matches.service';
import { ProfileSummaryService } from '../me/profile-summary/profile-summary.service';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly profileSummaryService: ProfileSummaryService,
    private readonly profileMatchesService: ProfileMatchesService,
  ) {}

  @Get('search')
  @UseGuards(JwtAuthGuard)
  search(@Query('q') q: string | undefined, @CurrentUser() user: AuthUser) {
    return this.usersService.search(q ?? '', user.sub);
  }

  @Get(':userId/profile/summary')
  findProfileSummary(@Param('userId') userId: string) {
    return this.profileSummaryService.getProfileSummary(userId);
  }

  @Get(':userId/profile/matches')
  findProfileMatches(@Param('userId') userId: string) {
    return this.profileMatchesService.findMatches(userId);
  }

  @Get(':userId/groups')
  findUserGroups(@Param('userId') userId: string) {
    return this.usersService.findGroups(userId);
  }
}
