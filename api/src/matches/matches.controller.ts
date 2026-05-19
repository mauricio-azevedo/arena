import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
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
  create(@Param('groupId') groupId: string, @Body() body: MatchBody) {
    return this.matchesService.create(groupId, body);
  }

  @Get()
  findAll(@Param('groupId') groupId: string) {
    return this.matchesService.findAll(groupId);
  }

  @Patch(':id')
  update(
    @Param('groupId') groupId: string,
    @Param('id') id: string,
    @Body() body: MatchBody,
  ) {
    return this.matchesService.update(groupId, id, body);
  }

  @Delete(':id')
  remove(@Param('groupId') groupId: string, @Param('id') id: string) {
    return this.matchesService.remove(groupId, id);
  }
}
