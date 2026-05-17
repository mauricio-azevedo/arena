import { Body, Controller, Get, Post } from '@nestjs/common';
import { PlayersService } from './players.service';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  create(@Body() body: { name: string }) {
    return this.playersService.create(body.name);
  }

  @Get()
  findAll() {
    return this.playersService.findAll();
  }
}
