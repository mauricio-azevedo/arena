import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileMatchesService } from '../me/profile-matches/profile-matches.service';
import { ProfileSummaryGroupsService } from '../me/profile-summary/profile-summary-groups.service';
import { ProfileSummaryMatchesService } from '../me/profile-summary/profile-summary-matches.service';
import { ProfileSummaryService } from '../me/profile-summary/profile-summary.service';
import { ProfileSummaryStatsService } from '../me/profile-summary/profile-summary-stats.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    ProfileSummaryService,
    ProfileSummaryStatsService,
    ProfileSummaryMatchesService,
    ProfileSummaryGroupsService,
    ProfileMatchesService,
  ],
})
export class UsersModule {}
