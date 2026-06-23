import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClaimRequestsService } from './claim-requests.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ClaimRequestsController {
  constructor(private readonly claimRequests: ClaimRequestsService) {}

  @Post('groups/:groupId/claim-requests')
  create(
    @Param('groupId') groupId: string,
    @Body() body: { memberId: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.claimRequests.createRequest(groupId, body.memberId, user.sub);
  }

  @Get('claim-requests/:id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.claimRequests.getRequest(id, user.sub);
  }

  @Post('claim-requests/:id/approve')
  approve(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.claimRequests.approve(id, user.sub);
  }

  @Post('claim-requests/:id/decline')
  decline(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.claimRequests.decline(id, user.sub);
  }
}
