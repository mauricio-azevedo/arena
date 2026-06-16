import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PlatformTrendingPlayersProjectionService } from './platform-trending-players-projection.service';

@Module({
  imports: [PrismaModule],
  providers: [PlatformTrendingPlayersProjectionService],
  exports: [PlatformTrendingPlayersProjectionService],
})
export class PlatformTrendingModule {}
