import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GroupInvitesController } from './group-invites.controller';
import { GroupInvitesService } from './group-invites.service';
import { PublicInvitesController } from './public-invites.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [GroupInvitesController, PublicInvitesController],
  providers: [GroupInvitesService],
})
export class GroupInvitesModule {}
