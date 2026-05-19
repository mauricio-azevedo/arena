import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PlayersService } from './players.service';

@Controller('groups/:groupId/players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  create(
    @Param('groupId') groupId: string,
    @Body() body: { userId: string; displayName?: string },
  ) {
    return this.playersService.create(groupId, body);
  }

  @Get()
  findAll(@Param('groupId') groupId: string) {
    return this.playersService.findAll(groupId);
  }
}
