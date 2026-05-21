import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { ProfileSummaryStatsService } from './profile-summary/profile-summary-stats.service';
import { ProfileSummaryMatchesService } from './profile-summary/profile-summary-matches.service';
import { ProfileSummaryGroupsService } from './profile-summary/profile-summary-groups.service';
import { ProfileSummaryService } from './profile-summary/profile-summary.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [MeController],
  providers: [
    MeService,
    ProfileSummaryService,
    ProfileSummaryStatsService,
    ProfileSummaryMatchesService,
    ProfileSummaryGroupsService,
  ],
})
export class MeModule {}
