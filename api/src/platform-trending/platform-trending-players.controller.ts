import { Controller, Get } from '@nestjs/common';
import { PlatformTrendingPlayersReadService } from './platform-trending-players-read.service';

@Controller('platform/trending-players')
export class PlatformTrendingPlayersController {
  constructor(
    private readonly trendingPlayers: PlatformTrendingPlayersReadService,
  ) {}

  @Get()
  listTrendingPlayers() {
    return this.trendingPlayers.listTrendingPlayers();
  }
}
