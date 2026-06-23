import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GroupInvitesController } from './group-invites.controller';
import { GroupInvitesService } from './group-invites.service';
import { PublicInvitesController } from './public-invites.controller';
import { FeedModule } from '../feed/feed.module';
import { GroupsModule } from '../groups/groups.module';
import { ClaimsModule } from '../claims/claims.module';

@Module({
  imports: [PrismaModule, AuthModule, FeedModule, GroupsModule, ClaimsModule],
  controllers: [GroupInvitesController, PublicInvitesController],
  providers: [GroupInvitesService],
  exports: [GroupInvitesService],
})
export class GroupInvitesModule {}
