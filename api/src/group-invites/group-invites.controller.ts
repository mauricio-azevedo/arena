import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthUser } from '../auth/auth.types';
import { GroupInvitesService } from './group-invites.service';

@Controller('groups/:groupId/invites')
export class GroupInvitesController {
  constructor(private readonly groupInvitesService: GroupInvitesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      maxUses?: number;
      expiresAt?: string;
    },
  ) {
    return this.groupInvitesService.create(groupId, {
      ...body,
      createdById: user.sub,
    });
  }

  @Get(':token')
  findByToken(@Param('token') token: string) {
    return this.groupInvitesService.findByToken(token);
  }

  @Post(':token/accept')
  accept(
    @Param('groupId') groupId: string,
    @Param('token') token: string,
    @Body() body: { userId: string },
  ) {
    return this.groupInvitesService.accept(groupId, token, body);
  }
}
