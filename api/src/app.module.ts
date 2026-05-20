import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MatchesModule } from './matches/matches.module';
import { RankingModule } from './ranking/ranking.module';
import { GroupsModule } from './groups/groups.module';
import { AuthModule } from './auth/auth.module';
import { GroupInvitesModule } from './group-invites/group-invites.module';
import { MeModule } from './me/me.module';
import { MembersModule } from './members/members.module';

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
  ],
})
export class AppModule {}
