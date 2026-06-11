import { Module } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';
import { RankingMovementService } from './ranking-movement.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RankingController],
  providers: [RankingService, RankingMovementService],
  exports: [RankingMovementService],
})
export class RankingModule {}
