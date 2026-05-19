import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MembersService } from './members.service';

@Controller('groups/:groupId/members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { userId: string; displayName?: string },
  ) {
    return this.membersService.create(groupId, user.sub, body);
  }

  @Get()
  findAll(@Param('groupId') groupId: string) {
    return this.membersService.findAll(groupId);
  }
}
