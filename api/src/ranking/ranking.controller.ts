import { Controller, Get, Param } from '@nestjs/common';
import { RankingService } from './ranking.service';

@Controller('groups/:groupId/ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get()
  findAll(@Param('groupId') groupId: string) {
    return this.rankingService.findAll(groupId);
  }
}
