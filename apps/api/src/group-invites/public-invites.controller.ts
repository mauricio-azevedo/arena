import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupInvitesService } from './group-invites.service';

@Controller('invites')
export class PublicInvitesController {
  constructor(private readonly groupInvitesService: GroupInvitesService) {}

  @Get(':token')
  findByToken(@Param('token') token: string) {
    return this.groupInvitesService.findByToken(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  accept(@Param('token') token: string, @CurrentUser() user: AuthUser) {
    return this.groupInvitesService.acceptByToken(token, {
      userId: user.sub,
    });
  }

  // Recognition summary for a guest picked from the open list. Public (token is the auth).
  @Get(':token/guests/:guestId/summary')
  guestSummary(
    @Param('token') token: string,
    @Param('guestId') guestId: string,
  ) {
    return this.groupInvitesService.getGuestSummary(token, guestId);
  }

  // Take over the guest (open-list pick or closed-link target). Requires an account.
  @Post(':token/claim/:guestId')
  @UseGuards(JwtAuthGuard)
  claim(
    @Param('token') token: string,
    @Param('guestId') guestId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.groupInvitesService.claimGuest(token, guestId, user.sub);
  }
}
