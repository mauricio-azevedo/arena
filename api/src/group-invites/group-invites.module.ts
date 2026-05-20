import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GroupInvitesController } from './group-invites.controller';
import { GroupInvitesService } from './group-invites.service';
import { PublicInvitesController } from './public-invites.controller';
import { FeedModule } from '../feed/feed.module';

@Module({
  imports: [PrismaModule, AuthModule, FeedModule],
  controllers: [GroupInvitesController, PublicInvitesController],
  providers: [GroupInvitesService],
})
export class GroupInvitesModule {}
