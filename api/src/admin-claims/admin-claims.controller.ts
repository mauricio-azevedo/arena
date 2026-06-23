import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminClaimsService } from './admin-claims.service';

@Controller('groups/:groupId/members/:memberId')
@UseGuards(JwtAuthGuard)
export class AdminClaimsController {
  constructor(private readonly adminClaims: AdminClaimsService) {}

  @Post('claim-self')
  claimSelf(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminClaims.claimForSelf(groupId, memberId, user.sub);
  }

  @Post('invite-to-claim')
  inviteToClaim(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @Body() body: { targetUserId: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminClaims.inviteToClaim(
      groupId,
      memberId,
      user.sub,
      body.targetUserId,
    );
  }
}
