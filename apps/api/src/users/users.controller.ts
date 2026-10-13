import { Controller, Get, Param } from '@nestjs/common';
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
