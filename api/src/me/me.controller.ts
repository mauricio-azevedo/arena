import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MeService } from './me.service';
import { ProfileSummaryService } from './profile-summary/profile-summary.service';

@Controller('me')
export class MeController {
  constructor(
    private readonly meService: MeService,
    private readonly profileSummary: ProfileSummaryService,
  ) {}

  @Get('groups')
  @UseGuards(JwtAuthGuard)
  findMyGroups(@CurrentUser() user: AuthUser) {
    return this.meService.findMyGroups(user.sub);
  }

  @Get('profile/summary')
  @UseGuards(JwtAuthGuard)
  getProfileSummary(@CurrentUser() user: AuthUser) {
    return this.profileSummary.getProfileSummary(user.sub);
  }
}
