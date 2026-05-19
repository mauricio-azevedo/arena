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
}
