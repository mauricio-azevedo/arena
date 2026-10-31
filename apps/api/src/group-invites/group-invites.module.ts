import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProcessingModule } from '../processing/processing.module';
import { GroupInvitesController } from './group-invites.controller';
import { GroupInvitesService } from './group-invites.service';
import { PublicInvitesController } from './public-invites.controller';
import { FeedModule } from '../feed/feed.module';
import { GroupsModule } from '../groups/groups.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ClaimService } from './claim.service';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    FeedModule,
    GroupsModule,
    NotificationsModule,
    ProcessingModule,
  ],
  controllers: [GroupInvitesController, PublicInvitesController],
  providers: [GroupInvitesService, ClaimService],
  exports: [GroupInvitesService],
})
export class GroupInvitesModule {}
