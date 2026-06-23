import { Module } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';
import { RankingMovementService } from './ranking-movement.service';
import { GroupMemberStatsProjectionService } from './group-member-stats-projection.service';
import { GroupMemberPartnerStatsProjectionService } from './group-member-partner-stats-projection.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RankingController],
  providers: [
    RankingService,
    RankingMovementService,
    GroupMemberStatsProjectionService,
    GroupMemberPartnerStatsProjectionService,
  ],
  exports: [
    RankingMovementService,
    GroupMemberStatsProjectionService,
    GroupMemberPartnerStatsProjectionService,
  ],
})
export class RankingModule {}
