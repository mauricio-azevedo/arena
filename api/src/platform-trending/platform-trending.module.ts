import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformTrendingPlayersController } from './platform-trending-players.controller';
import { PlatformTrendingPlayersProjectionService } from './platform-trending-players-projection.service';
import { PlatformTrendingPlayersReadService } from './platform-trending-players-read.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlatformTrendingPlayersController],
  providers: [
    PlatformTrendingPlayersProjectionService,
    PlatformTrendingPlayersReadService,
  ],
  exports: [
    PlatformTrendingPlayersProjectionService,
    PlatformTrendingPlayersReadService,
  ],
})
export class PlatformTrendingModule {}
