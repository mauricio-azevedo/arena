import { Body, Controller, Get, Post } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  create(@Body() body: any) {
    return this.matchesService.create(body);
  }

  @Get()
  findAll() {
    return this.matchesService.findAll();
  }
}
