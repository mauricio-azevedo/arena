import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MatchesModule } from './matches/matches.module';
import { RankingModule } from './ranking/ranking.module';
import { GroupsModule } from './groups/groups.module';
import { AuthModule } from './auth/auth.module';
import { GroupInvitesModule } from './group-invites/group-invites.module';
import { MeModule } from './me/me.module';
import { MembersModule } from './members/members.module';
import { FeedModule } from './feed/feed.module';
import { UsersModule } from './users/users.module';
import { ProcessingModule } from './processing/processing.module';
import { HomeHighlightsModule } from './home-highlights/home-highlights.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    GroupsModule,
    MembersModule,
    MatchesModule,
    RankingModule,
    AuthModule,
    GroupInvitesModule,
    MeModule,
    FeedModule,
    UsersModule,
    ProcessingModule,
    HomeHighlightsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
