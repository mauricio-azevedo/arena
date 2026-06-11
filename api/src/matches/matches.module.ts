import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { FeedModule } from '../feed/feed.module';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [PrismaModule, AuthModule, FeedModule, RankingModule],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
