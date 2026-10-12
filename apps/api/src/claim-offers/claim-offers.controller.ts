import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClaimOffersService } from './claim-offers.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ClaimOffersController {
  constructor(private readonly claimOffers: ClaimOffersService) {}

  // --- Admin: anchor / clear / read the email on a stub ---
  @Post('groups/:groupId/members/:memberId/claim-email')
  setEmail(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @Body() body: { email: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.claimOffers.setClaimEmail(
      groupId,
      memberId,
      user.sub,
      body.email,
    );
  }

  @Delete('groups/:groupId/members/:memberId/claim-email')
  clearEmail(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.claimOffers.clearClaimEmail(groupId, memberId, user.sub);
  }

  @Get('groups/:groupId/members/:memberId/claim-email')
  getEmail(
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.claimOffers.getClaimEmailState(groupId, memberId, user.sub);
  }

  // --- Recipient: read / confirm / decline the offer ---
  @Get('me/claims/:stubId')
  getOffer(@Param('stubId') stubId: string, @CurrentUser() user: AuthUser) {
    return this.claimOffers.getOffer(stubId, user.sub);
  }

  @Post('me/claims/:stubId/confirm')
  confirm(@Param('stubId') stubId: string, @CurrentUser() user: AuthUser) {
    return this.claimOffers.confirm(stubId, user.sub);
  }

  @Post('me/claims/:stubId/decline')
  decline(@Param('stubId') stubId: string, @CurrentUser() user: AuthUser) {
    return this.claimOffers.decline(stubId, user.sub);
  }
}
