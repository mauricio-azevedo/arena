import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlayersService } from './players.service';

@Controller('groups/:groupId/players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { userId: string; displayName?: string },
  ) {
    return this.playersService.create(groupId, user.sub, body);
  }

  @Get()
  findAll(@Param('groupId') groupId: string) {
    return this.playersService.findAll(groupId);
  }
}
