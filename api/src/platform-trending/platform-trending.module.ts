import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformTrendingPlayersProjectionService } from './platform-trending-players-projection.service';
import { PlatformTrendingPlayersReadService } from './platform-trending-players-read.service';

@Module({
  imports: [PrismaModule],
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
