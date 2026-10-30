import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  updatePasswordBodySchema,
  updateProfileBodySchema,
  type UpdatePasswordBody,
  type UpdateProfileBody,
} from '@arena/contracts/me';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { MePasswordService } from './me-password.service';
import { MeService } from './me.service';
import { ProfileSummaryService } from './profile-summary/profile-summary.service';
import { ProfileMatchesService } from './profile-matches/profile-matches.service';

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
    return this.profileSummary.getProfileSummary(user.sub, {
      includeEmail: true,
    });
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateProfileBodySchema))
    body: UpdateProfileBody,
  ) {
    return this.meService.updateProfile(user.sub, body);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  updatePassword(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updatePasswordBodySchema))
    body: UpdatePasswordBody,
  ) {
    return this.mePasswordService.updatePassword(user.sub, body);
  }

  @Get('profile/matches')
  @UseGuards(JwtAuthGuard)
  getProfileMatches(@CurrentUser() user: AuthUser) {
    return this.profileMatches.findMatches(user.sub);
  }
}
