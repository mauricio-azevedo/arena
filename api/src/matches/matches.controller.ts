import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MatchesService } from './matches.service';

type MatchBody = {
  teamAPlayer1Id: string;
  teamAPlayer2Id: string;
  teamBPlayer1Id: string;
  teamBPlayer2Id: string;
  gamesA: number;
  gamesB: number;
  playedAt?: string;
};

@Controller('groups/:groupId/matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: MatchBody,
  ) {
    return this.matchesService.create(groupId, user.sub, body);
  }

  @Get()
  findAll(@Param('groupId') groupId: string) {
    return this.matchesService.findAll(groupId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: MatchBody,
  ) {
    return this.matchesService.update(groupId, id, user.sub, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.matchesService.remove(groupId, id, user.sub);
  }
}
