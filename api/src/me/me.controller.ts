import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MePasswordService } from './me-password.service';
import { MeService } from './me.service';
import { ProfileSummaryService } from './profile-summary/profile-summary.service';
import { ProfileMatchesService } from './profile-matches/profile-matches.service';
import type { UpdatePasswordInput } from './types/update-password-input.type';
import type { UpdateProfileInput } from './types/update-profile-input.type';

@Controller('me')
export class MeController {
  constructor(
    private readonly meService: MeService,
    private readonly mePasswordService: MePasswordService,
    private readonly profileSummary: ProfileSummaryService,
    private readonly profileMatches: ProfileMatchesService,
  ) {}

  @Get('groups')
  @UseGuards(JwtAuthGuard)
  findMyGroups(@CurrentUser() user: AuthUser) {
    return this.meService.findMyGroups(user.sub);
  }

  @Get('profile/summary')
  @UseGuards(JwtAuthGuard)
  getProfileSummary(@CurrentUser() user: AuthUser) {
    return this.profileSummary.getProfileSummary(user.sub, { includeEmail: true });
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateProfileInput,
  ) {
    return this.meService.updateProfile(user.sub, body);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  updatePassword(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdatePasswordInput,
  ) {
    return this.mePasswordService.updatePassword(user.sub, body);
  }

  @Get('profile/matches')
  @UseGuards(JwtAuthGuard)
  getProfileMatches(@CurrentUser() user: AuthUser) {
    return this.profileMatches.findMatches(user.sub);
  }
}
